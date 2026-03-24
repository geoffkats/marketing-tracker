import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/data - Get raw data for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const channel = searchParams.get('channel')
    const metric = searchParams.get('metric')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const where: any = { campaignId }
    if (channel) where.channel = channel
    if (metric) where.metric = metric
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const rawData = await db.rawData.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ rawData })
  } catch (error) {
    console.error('Error fetching raw data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch raw data' },
      { status: 500 }
    )
  }
}

// POST /api/data - Add raw data (for manual entry or webhook)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Support single entry or batch
    const entries = Array.isArray(body) ? body : [body]
    
    const created = await db.rawData.createMany({
      data: entries.map(entry => ({
        campaignId: entry.campaignId,
        date: new Date(entry.date),
        channel: entry.channel,
        metric: entry.metric,
        value: entry.value,
        source: entry.source,
        rawData: entry.rawData ? JSON.stringify(entry.rawData) : null,
      }))
    })

    // Update KPIs after data insertion
    await updateKPIsForCampaign(entries[0].campaignId)

    return NextResponse.json({ created: created.count }, { status: 201 })
  } catch (error) {
    console.error('Error creating raw data:', error)
    return NextResponse.json(
      { error: 'Failed to create raw data' },
      { status: 500 }
    )
  }
}

// Helper function to update KPIs after data insertion
async function updateKPIsForCampaign(campaignId: string) {
  // Get aggregated data
  const rawData = await db.rawData.findMany({
    where: { campaignId }
  })

  // Calculate metrics
  const metrics: Record<string, number> = {}
  for (const row of rawData) {
    metrics[row.metric] = (metrics[row.metric] || 0) + row.value
  }

  const totalRegistrations = metrics['registrations'] || 0
  const totalSpend = metrics['spend'] || 0
  const totalClicks = metrics['clicks'] || 0
  const totalImpressions = metrics['impressions'] || 0

  // Update KPI targets
  const now = new Date()
  
  await db.kPITarget.updateMany({
    where: { campaignId, metric: 'Total Registrations' },
    data: { current: totalRegistrations, lastUpdated: now }
  })

  await db.kPITarget.updateMany({
    where: { campaignId, metric: 'Total Spend' },
    data: { current: totalSpend, lastUpdated: now }
  })

  const cpa = totalRegistrations > 0 ? totalSpend / totalRegistrations : 0
  await db.kPITarget.updateMany({
    where: { campaignId, metric: 'CPA' },
    data: { current: cpa, lastUpdated: now }
  })

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  await db.kPITarget.updateMany({
    where: { campaignId, metric: 'CTR' },
    data: { current: ctr, lastUpdated: now }
  })

  const revenue = totalRegistrations * 15000
  const roas = totalSpend > 0 ? revenue / totalSpend : 0
  await db.kPITarget.updateMany({
    where: { campaignId, metric: 'ROAS' },
    data: { current: roas, lastUpdated: now }
  })
}
