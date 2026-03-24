import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alerts - Get alert settings for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const includeLogs = searchParams.get('includeLogs') === 'true'

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const alertSettings = await db.alertSetting.findMany({
      where: { campaignId },
      orderBy: { metric: 'asc' }
    })

    const response: any = { alertSettings }

    if (includeLogs) {
      const recentLogs = await db.alertLog.findMany({
        where: { campaignId },
        orderBy: { sentAt: 'desc' },
        take: 20
      })
      response.recentLogs = recentLogs
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// POST /api/alerts - Create new alert setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const alert = await db.alertSetting.create({
      data: {
        campaignId: body.campaignId,
        metric: body.metric,
        threshold: body.threshold,
        direction: body.direction,
        recipientEmails: body.recipientEmails.join(','),
        slackChannel: body.slackChannel,
        slackWebhook: body.slackWebhook,
        isActive: body.isActive ?? true,
        cooldownMinutes: body.cooldownMinutes || 240,
      }
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}

// PUT /api/alerts - Update alert setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const alert = await db.alertSetting.update({
      where: { id: body.id },
      data: {
        metric: body.metric,
        threshold: body.threshold,
        direction: body.direction,
        recipientEmails: Array.isArray(body.recipientEmails) 
          ? body.recipientEmails.join(',') 
          : body.recipientEmails,
        slackChannel: body.slackChannel,
        slackWebhook: body.slackWebhook,
        isActive: body.isActive,
        cooldownMinutes: body.cooldownMinutes,
      }
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}

// DELETE /api/alerts - Delete alert setting
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.alertSetting.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}
