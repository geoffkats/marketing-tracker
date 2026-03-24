import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/track - Track conversion event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, event, channel, utmId, value = 1, metadata } = body

    if (!campaignId || !event) {
      return NextResponse.json({ error: 'campaignId and event are required' }, { status: 400 })
    }

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Create tracking event
    const trackData: any = {
      campaignId,
      date: new Date(),
      metric: event.toLowerCase(),
      value,
      source: 'tracking_pixel',
      rawData: JSON.stringify({
        ...metadata,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        timestamp: new Date().toISOString()
      })
    }

    if (channel) {
      trackData.channel = channel
    } else if (utmId) {
      const utmLink = await db.uTMLink.findUnique({ where: { id: utmId } })
      if (utmLink) {
        trackData.channel = utmLink.channel
        trackData.source = `utm:${utmId}`
      }
    }

    await db.rawData.create({ data: trackData })

    // Update KPIs if this is a registration
    if (event.toLowerCase() === 'registration' || event.toLowerCase() === 'registrations') {
      await updateCampaignKPIs(campaignId)
    }

    return NextResponse.json({ success: true, tracked: true })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

// GET /api/track - Get tracking pixel (for email open tracking, etc.)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const channel = searchParams.get('ch') || 'Email'
    const event = searchParams.get('e') || 'open'

    if (campaignId) {
      // Log the open/view event
      await db.rawData.create({
        data: {
          campaignId,
          date: new Date(),
          channel,
          metric: event,
          value: 1,
          source: 'tracking_pixel',
          rawData: JSON.stringify({
            userAgent: request.headers.get('user-agent'),
            referer: request.headers.get('referer'),
          })
        }
      })
    }

    // Return 1x1 transparent GIF
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return new NextResponse(gif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Tracking pixel error:', error)
    // Still return the pixel even on error
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return new NextResponse(gif, {
      headers: { 'Content-Type': 'image/gif' }
    })
  }
}

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
