import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/influencers - Get influencers with ROI data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const influencers = await db.influencer.findMany({
      where: { campaignId },
      include: {
        campaign: { select: { name: true } }
      },
      orderBy: { roi: 'desc' }
    })

    // Calculate summary stats
    const totalSpent = influencers.reduce((sum, i) => sum + i.contractFee, 0)
    const totalRegistrations = influencers.reduce((sum, i) => sum + i.registrations, 0)
    const totalRevenue = influencers.reduce((sum, i) => sum + i.revenue, 0)
    const avgCPS = totalRegistrations > 0 ? totalSpent / totalRegistrations : 0
    const overallROI = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0

    // Rank influencers by performance
    const ranked = influencers.map((inf, idx) => ({
      ...inf,
      rank: idx + 1,
      engagementRate: inf.reach > 0 ? ((inf.engagements / inf.reach) * 100).toFixed(2) : '0',
      clickRate: inf.reach > 0 ? ((inf.linkClicks / inf.reach) * 100).toFixed(2) : '0',
      conversionRate: inf.linkClicks > 0 ? ((inf.registrations / inf.linkClicks) * 100).toFixed(2) : '0',
      performanceScore: calculatePerformanceScore(inf),
    }))

    return NextResponse.json({
      influencers: ranked,
      summary: {
        totalInfluencers: influencers.length,
        totalSpent,
        totalRegistrations,
        totalRevenue,
        avgCPS: Math.round(avgCPS),
        overallROI: overallROI.toFixed(1),
        topPerformer: ranked[0]?.name || null,
        worstPerformer: ranked[ranked.length - 1]?.name || null,
      }
    })
  } catch (error) {
    console.error('Error fetching influencers:', error)
    return NextResponse.json({ error: 'Failed to fetch influencers' }, { status: 500 })
  }
}

// POST /api/influencers - Add new influencer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate unique UTM link and promo code
    const promoCode = `${body.name.toLowerCase().replace(/\s+/g, '').slice(0, 8)}${Date.now().toString(36)}`

    const influencer = await db.influencer.create({
      data: {
        campaignId: body.campaignId,
        name: body.name,
        platform: body.platform,
        handle: body.handle,
        followerCount: body.followerCount,
        contractFee: body.contractFee,
        currency: body.currency || 'UGX',
        contractDate: body.contractDate ? new Date(body.contractDate) : new Date(),
        deliverables: JSON.stringify(body.deliverables || []),
        utmLink: body.utmLink,
        promoCode,
        status: 'active',
      }
    })

    return NextResponse.json({ influencer }, { status: 201 })
  } catch (error) {
    console.error('Error creating influencer:', error)
    return NextResponse.json({ error: 'Failed to create influencer' }, { status: 500 })
  }
}

// PUT /api/influencers - Update influencer performance
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    // Recalculate derived metrics if registration data changed
    if (updates.registrations !== undefined || updates.contractFee !== undefined) {
      const existing = await db.influencer.findUnique({ where: { id } })
      if (existing) {
        const registrations = updates.registrations ?? existing.registrations
        const fee = updates.contractFee ?? existing.contractFee
        const revenue = updates.revenue ?? existing.revenue

        updates.cps = registrations > 0 ? fee / registrations : 0
        updates.roi = fee > 0 ? ((revenue - fee) / fee) * 100 : 0
      }
    }

    const influencer = await db.influencer.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ influencer })
  } catch (error) {
    console.error('Error updating influencer:', error)
    return NextResponse.json({ error: 'Failed to update influencer' }, { status: 500 })
  }
}

// POST /api/influencers/bulk-update - Bulk update from CSV
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, updates } = body // Array of { handle, registrations, revenue, etc }

    const results = []
    for (const update of updates) {
      const influencer = await db.influencer.findFirst({
        where: { campaignId, handle: update.handle }
      })

      if (influencer) {
        const registrations = (update.registrations || 0) + influencer.registrations
        const revenue = (update.revenue || 0) + influencer.revenue
        const reach = (update.reach || 0) + influencer.reach
        const engagements = (update.engagements || 0) + influencer.engagements

        const updated = await db.influencer.update({
          where: { id: influencer.id },
          data: {
            registrations,
            revenue,
            reach,
            engagements,
            postsCount: (update.postsCount || 0) + influencer.postsCount,
            storiesCount: (update.storiesCount || 0) + influencer.storiesCount,
            linkClicks: (update.linkClicks || 0) + influencer.linkClicks,
            cps: registrations > 0 ? influencer.contractFee / registrations : 0,
            roi: influencer.contractFee > 0 ? ((revenue - influencer.contractFee) / influencer.contractFee) * 100 : 0,
          }
        })
        results.push(updated)
      }
    }

    return NextResponse.json({ 
      success: true, 
      updated: results.length,
      influencers: results 
    })
  } catch (error) {
    console.error('Error bulk updating influencers:', error)
    return NextResponse.json({ error: 'Failed to bulk update' }, { status: 500 })
  }
}

// DELETE /api/influencers - Delete influencer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.influencer.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting influencer:', error)
    return NextResponse.json({ error: 'Failed to delete influencer' }, { status: 500 })
  }
}

// Helper function to calculate performance score (0-100)
function calculatePerformanceScore(inf: any): number {
  const weights = {
    cps: 0.3,      // Lower is better
    roi: 0.3,      // Higher is better
    engagement: 0.2, // Higher is better
    conversion: 0.2  // Higher is better
  }

  // CPS score (inverse - lower is better, cap at 50,000 UGX)
  const cpsScore = Math.max(0, 100 - (inf.cps / 50000) * 100)

  // ROI score (cap at 500%)
  const roiScore = Math.min(100, Math.max(0, inf.roi / 5))

  // Engagement rate score (cap at 10%)
  const engagementRate = inf.reach > 0 ? (inf.engagements / inf.reach) * 100 : 0
  const engagementScore = Math.min(100, engagementRate * 10)

  // Conversion rate score (cap at 20%)
  const conversionRate = inf.linkClicks > 0 ? (inf.registrations / inf.linkClicks) * 100 : 0
  const conversionScore = Math.min(100, conversionRate * 5)

  return Math.round(
    cpsScore * weights.cps +
    roiScore * weights.roi +
    engagementScore * weights.engagement +
    conversionScore * weights.conversion
  )
}
