import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseCSVFile, detectPlatform } from '@/lib/parsers/csv-parser'

// POST /api/import - Import CSV file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const campaignId = formData.get('campaignId') as string
    const platformOverride = formData.get('platform') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Read file content
    const content = await file.text()
    
    // Parse the CSV
    const parseResult = parseCSVFile(content)

    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Failed to parse file', 
        details: parseResult.errors 
      }, { status: 400 })
    }

    // Insert data into database
    const dataToInsert = parseResult.rows.map(row => ({
      campaignId,
      date: row.date,
      channel: row.channel,
      metric: row.metric,
      value: row.value,
      source: `import:${parseResult.platform}:${file.name}`,
      rawData: row.rawData ? JSON.stringify(row.rawData) : null,
    }))

    // Batch insert
    const insertResult = await db.rawData.createMany({
      data: dataToInsert,
      skipDuplicates: true
    })

    // Update KPIs
    await updateCampaignKPIs(campaignId)

    // Log import
    await db.auditLog.create({
      data: {
        campaignId,
        action: 'import',
        entityType: 'rawData',
        details: JSON.stringify({
          filename: file.name,
          platform: parseResult.platform,
          rowsImported: insertResult.count,
          summary: parseResult.summary
        }),
        userEmail: 'system'
      }
    })

    return NextResponse.json({
      success: true,
      imported: insertResult.count,
      platform: parseResult.platform,
      summary: parseResult.summary,
      errors: parseResult.errors.length > 0 ? parseResult.errors : undefined
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: 'Failed to import file',
      details: String(error)
    }, { status: 500 })
  }
}

// GET /api/import - Get import history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    const imports = await db.auditLog.findMany({
      where: {
        action: 'import',
        ...(campaignId && { campaignId })
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const parsedImports = imports.map(imp => ({
      ...imp,
      details: imp.details ? JSON.parse(imp.details) : null
    }))

    return NextResponse.json({ imports: parsedImports })
  } catch (error) {
    console.error('Error fetching imports:', error)
    return NextResponse.json({ error: 'Failed to fetch import history' }, { status: 500 })
  }
}

// Helper function to update KPIs after data import
async function updateCampaignKPIs(campaignId: string) {
  const rawData = await db.rawData.findMany({ where: { campaignId } })

  const metrics: Record<string, number> = {}
  for (const row of rawData) {
    metrics[row.metric] = (metrics[row.metric] || 0) + row.value
  }

  const totalRegistrations = metrics['registrations'] || 0
  const totalSpend = metrics['spend'] || 0
  const totalClicks = metrics['clicks'] || 0
  const totalImpressions = metrics['impressions'] || 0
  const cpa = totalRegistrations > 0 ? totalSpend / totalRegistrations : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const revenue = totalRegistrations * 15000
  const roas = totalSpend > 0 ? revenue / totalSpend : 0

  const now = new Date()

  await Promise.all([
    db.kPITarget.updateMany({
      where: { campaignId, metric: 'Total Registrations' },
      data: { current: totalRegistrations, lastUpdated: now }
    }),
    db.kPITarget.updateMany({
      where: { campaignId, metric: 'Total Spend' },
      data: { current: totalSpend, lastUpdated: now }
    }),
    db.kPITarget.updateMany({
      where: { campaignId, metric: 'CPA' },
      data: { current: cpa, lastUpdated: now }
    }),
    db.kPITarget.updateMany({
      where: { campaignId, metric: 'CTR' },
      data: { current: ctr, lastUpdated: now }
    }),
    db.kPITarget.updateMany({
      where: { campaignId, metric: 'ROAS' },
      data: { current: roas, lastUpdated: now }
    }),
  ])
}
