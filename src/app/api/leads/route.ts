import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/leads - Get leads for campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status')
    const needsFollowUp = searchParams.get('needsFollowUp') === 'true'

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const where: any = { campaignId }
    if (status) where.status = status
    
    // Find leads needing follow-up (pending for >48 hours)
    if (needsFollowUp) {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      where.status = 'pending'
      where.registeredAt = { lt: fortyEightHoursAgo }
      where.OR = [
        { lastContactAt: null },
        { lastContactAt: { lt: fortyEightHoursAgo } }
      ]
    }

    const leads = await db.lead.findMany({
      where,
      include: {
        followUpTasks: { orderBy: { scheduledAt: 'desc' }, take: 5 }
      },
      orderBy: { registeredAt: 'desc' }
    })

    // Get summary stats
    const stats = await db.lead.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true
    })

    return NextResponse.json({
      leads,
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s._count
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

// POST /api/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const lead = await db.lead.create({
      data: {
        campaignId: body.campaignId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: body.source,
        channel: body.channel,
        utmLink: body.utmLink,
        influencerId: body.influencerId,
        status: 'pending',
      }
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

// PUT /api/leads - Update lead status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const lead = await db.lead.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

// POST /api/leads/generate-followup - Generate AI follow-up message
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, type } = body // type: 'sms' | 'email'

    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: { campaign: true }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Generate personalized message using AI
    const zai = await ZAI.create()

    const context = {
      leadName: lead.name,
      campaignName: lead.campaign.name,
      daysSinceRegistration: Math.floor((Date.now() - new Date(lead.registeredAt).getTime()) / (1000 * 60 * 60 * 24)),
      channel: lead.channel,
    }

    const systemPrompt = `You are a friendly enrollment assistant for Code Academy Uganda. Generate personalized follow-up messages for potential students who have registered but haven't completed payment.

Be warm, encouraging, and urgent but not pushy. Include:
- Personal greeting using their name
- Reminder of what they registered for
- Clear call-to-action
- Sense of urgency (limited spots, deadline approaching)

Format your response as JSON:
{
  "subject": "Email subject line (if email)",
  "message": "The full message content",
  "callToAction": "The specific action they should take"
}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: `Generate a ${type} follow-up for:\n${JSON.stringify(context, null, 2)}` }
      ],
      thinking: { type: 'disabled' }
    })

    const aiResponse = completion.choices[0]?.message?.content
    let messageContent
    try {
      messageContent = JSON.parse(aiResponse || '{}')
    } catch {
      messageContent = { message: aiResponse }
    }

    // Create follow-up task
    const task = await db.followUpTask.create({
      data: {
        campaignId: lead.campaignId,
        leadId: lead.id,
        type,
        scheduledAt: new Date(),
        content: JSON.stringify(messageContent),
        status: 'pending'
      }
    })

    // Update lead
    await db.lead.update({
      where: { id: leadId },
      data: {
        lastContactAt: new Date(),
        contactCount: { increment: 1 },
        nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next follow-up in 24h
      }
    })

    return NextResponse.json({
      success: true,
      task,
      content: messageContent
    })
  } catch (error) {
    console.error('Error generating follow-up:', error)
    return NextResponse.json({ error: 'Failed to generate follow-up' }, { status: 500 })
  }
}
