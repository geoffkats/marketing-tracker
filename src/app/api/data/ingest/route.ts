import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addManualData, handleDataWebhook } from '@/lib/services/data-ingestion'

// POST /api/data/ingest - Manual data entry or webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, type, data } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    let count = 0

    if (type === 'webhook') {
      // Single data point from webhook
      await handleDataWebhook(campaignId, data)
      count = Object.keys(data.metrics || {}).length || 1
    } else {
      // Manual batch entry
      const entries = Array.isArray(data) ? data : [data]
      count = await addManualData(campaignId, entries)
    }

    return NextResponse.json({ 
      success: true, 
      recordsAdded: count,
      message: `Added ${count} data point(s)` 
    })
  } catch (error) {
    console.error('Error ingesting data:', error)
    return NextResponse.json(
      { error: 'Failed to ingest data' },
      { status: 500 }
    )
  }
}

// GET /api/data/ingest - Get ingestion status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    const dataSources = await db.dataSource.findMany({
      select: {
        id: true,
        name: true,
        platform: true,
        status: true,
        lastSync: true,
        syncFrequency: true,
        lastError: true,
      }
    })

    // Get ingestion stats
    const stats = {
      totalDataPoints: 0,
      lastIngestion: null as Date | null,
    }

    if (campaignId) {
      const count = await db.rawData.count({ where: { campaignId } })
      stats.totalDataPoints = count

      const latest = await db.rawData.findFirst({
        where: { campaignId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
      stats.lastIngestion = latest?.createdAt || null
    }

    return NextResponse.json({ dataSources, stats })
  } catch (error) {
    console.error('Error fetching ingestion status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ingestion status' },
      { status: 500 }
    )
  }
}
