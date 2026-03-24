import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/ai/strategize - Get AI campaign strategy recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    // Get campaign data
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        rawData: { orderBy: { date: 'desc' }, take: 100 },
        kpiTargets: true,
        alerts: { where: { isActive: true } },
        influencers: true,
        leads: true,
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Calculate metrics
    const channelMetrics: Record<string, Record<string, number>> = {}
    for (const row of campaign.rawData) {
      if (!channelMetrics[row.channel]) {
        channelMetrics[row.channel] = {}
      }
      channelMetrics[row.channel][row.metric] = (channelMetrics[row.channel][row.metric] || 0) + row.value
    }

    const totalRegistrations = campaign.rawData
      .filter(r => r.metric === 'registrations')
      .reduce((sum, r) => sum + r.value, 0)

    const totalSpend = campaign.rawData
      .filter(r => r.metric === 'spend')
      .reduce((sum, r) => sum + r.value, 0)

    const totalClicks = campaign.rawData
      .filter(r => r.metric === 'clicks')
      .reduce((sum, r) => sum + r.value, 0)

    const totalImpressions = campaign.rawData
      .filter(r => r.metric === 'impressions')
      .reduce((sum, r) => sum + r.value, 0)

    const cpa = totalRegistrations > 0 ? totalSpend / totalRegistrations : 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    // Calculate days remaining
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const daysElapsed = Math.ceil((now.getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))

    // Calculate daily rate
    const avgDailyRate = daysElapsed > 0 ? totalRegistrations / daysElapsed : 0
    const projectedTotal = totalRegistrations + (avgDailyRate * daysRemaining)
    const progressPercent = campaign.targetRegistrations > 0 ? (totalRegistrations / campaign.targetRegistrations) * 100 : 0

    // Prepare context for AI
    const context = {
      campaign: {
        name: campaign.name,
        budget: campaign.budget,
        targetRegistrations: campaign.targetRegistrations,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
      },
      currentMetrics: {
        totalRegistrations,
        totalSpend,
        totalClicks,
        totalImpressions,
        cpa: Math.round(cpa),
        ctr: ctr.toFixed(2),
        progressPercent: progressPercent.toFixed(1),
        daysRemaining,
        daysElapsed,
        avgDailyRate: avgDailyRate.toFixed(1),
        projectedTotal: Math.round(projectedTotal),
      },
      channelPerformance: channelMetrics,
      kpiTargets: campaign.kpiTargets,
      influencerCount: campaign.influencers.length,
      pendingLeads: campaign.leads.filter(l => l.status === 'pending').length,
    }

    // Initialize ZAI and get AI recommendation
    const zai = await ZAI.create()

    const systemPrompt = `You are an expert marketing strategist for Code Academy Uganda, an educational organization that runs coding bootcamps for youth. You analyze marketing campaign data and provide actionable, specific recommendations.

Your recommendations should be:
1. Specific - mention exact channels, budget amounts, and actions
2. Data-driven - reference the metrics provided
3. Practical - consider the context (Uganda market, youth audience, coding bootcamps)
4. Urgent - prioritize recommendations based on time remaining

Format your response as JSON with this structure:
{
  "summary": "2-3 sentence overall assessment",
  "urgency": "low|medium|high|critical",
  "recommendations": [
    {
      "title": "Action title",
      "description": "Detailed explanation",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "specifics": "Concrete action to take"
    }
  ],
  "budgetReallocation": {
    "suggestion": "Description of budget changes",
    "amounts": { "channel": amount }
  },
  "channelInsights": [
    {
      "channel": "FB",
      "status": "overperforming|underperforming|on_track",
      "insight": "Why this channel is doing well/poorly",
      "action": "What to do about it"
    }
  ],
  "predictions": {
    "willHitTarget": true,
    "confidence": 80,
    "explanation": "Why we think this"
  }
}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: `Analyze this campaign data and provide strategic recommendations:\n\n${JSON.stringify(context, null, 2)}` }
      ],
      thinking: { type: 'disabled' }
    })

    const aiResponse = completion.choices[0]?.message?.content

    // Parse AI response
    let insights
    try {
      insights = JSON.parse(aiResponse || '{}')
    } catch {
      insights = { raw: aiResponse }
    }

    // Store the insight
    const savedInsight = await db.aIInsight.create({
      data: {
        campaignId,
        type: 'campaign_strategy',
        title: `AI Strategy Analysis - ${new Date().toLocaleDateString()}`,
        description: insights.summary || 'Campaign analysis completed',
        analysis: JSON.stringify(insights),
        recommendations: JSON.stringify(insights.recommendations || []),
        priority: insights.urgency || 'medium',
        category: 'strategy',
      }
    })

    return NextResponse.json({
      success: true,
      insight: savedInsight,
      analysis: insights,
      context: {
        channelMetrics,
        metrics: context.currentMetrics,
      }
    })
  } catch (error) {
    console.error('AI Strategist error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI recommendations', details: String(error) },
      { status: 500 }
    )
  }
}

// GET /api/ai/strategize - Get previous AI insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const insights = await db.aIInsight.findMany({
      where: campaignId ? { campaignId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching AI insights:', error)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
