import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDatabaseInitialized } from '@/lib/db-init'

// GET /api/campaigns/[id] - Get single campaign with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure database is initialized with seed data
    await ensureDatabaseInitialized()
    
    const { id } = await params

    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        assets: { orderBy: { updatedAt: 'desc' } },
        utmLinks: { orderBy: { createdAt: 'desc' } },
        kpiTargets: true,
        alerts: { where: { isActive: true } },
        _count: {
          select: {
            assets: true,
            utmLinks: true,
            rawData: true,
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Calculate real metrics from raw data
    const rawData = await db.rawData.findMany({
      where: { campaignId: id },
      orderBy: { date: 'desc' }
    })

    // Aggregate metrics
    const metrics: Record<string, number> = {}
    const channelMetrics: Record<string, Record<string, number>> = {}
    const dailyMetrics: Record<string, Record<string, number>> = {}

    for (const row of rawData) {
      const metric = row.metric
      metrics[metric] = (metrics[metric] || 0) + row.value

      if (!channelMetrics[row.channel]) {
        channelMetrics[row.channel] = {}
      }
      channelMetrics[row.channel][metric] = (channelMetrics[row.channel][metric] || 0) + row.value

      const dateKey = row.date.toISOString().slice(0, 10)
      if (!dailyMetrics[dateKey]) {
        dailyMetrics[dateKey] = {}
      }
      dailyMetrics[dateKey][metric] = (dailyMetrics[dateKey][metric] || 0) + row.value
    }

    // Calculate derived metrics
    const totalRegistrations = metrics['registrations'] || 0
    const totalSpend = metrics['spend'] || 0
    const totalClicks = metrics['clicks'] || 0
    const totalImpressions = metrics['impressions'] || 0

    const cpa = totalRegistrations > 0 ? totalSpend / totalRegistrations : 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const revenue = totalRegistrations * 15000 // Assume 15,000 UGX per registration
    const roas = totalSpend > 0 ? revenue / totalSpend : 0

    // Get recent data ingestion info
    const lastDataSync = rawData.length > 0 
      ? rawData.reduce((latest, row) => row.createdAt > latest ? row.createdAt : latest, rawData[0].createdAt)
      : null

    // Get alert logs
    const recentAlerts = await db.alertLog.findMany({
      where: { campaignId: id },
      orderBy: { sentAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      campaign,
      metrics: {
        totalRegistrations,
        totalSpend,
        totalClicks,
        totalImpressions,
        cpa: Math.round(cpa * 100) / 100,
        ctr: Math.round(ctr * 100) / 100,
        roas: Math.round(roas * 100) / 100,
        progress: campaign.targetRegistrations > 0 
          ? Math.round((totalRegistrations / campaign.targetRegistrations) * 100)
          : 0,
        budgetUsed: campaign.budget > 0 
          ? Math.round((totalSpend / campaign.budget) * 100)
          : 0
      },
      channelMetrics,
      dailyMetrics,
      lastDataSync,
      recentAlerts,
      rawData: rawData.slice(0, 50) // Last 50 rows
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status,
        budget: body.budget,
        targetRegistrations: body.targetRegistrations,
        baseUrl: body.baseUrl,
      }
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.campaign.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
