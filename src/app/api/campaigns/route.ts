import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createCampaignSchema, validateBody, paginationSchema } from '@/lib/validations'
import { withRateLimit } from '@/lib/rate-limit'

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.INIT_MODE === 'true'

// GET /api/campaigns - List all campaigns
async function getCampaigns(req: NextRequest) {
  try {
    // Check authentication (skip in development mode for easier testing)
    const session = await getServerSession(authOptions)
    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const includeStats = searchParams.get('includeStats') === 'true'
    const clientId = searchParams.get('clientId')

    // Validate pagination
    const pagination = paginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })
    const page = pagination.success ? Number(pagination.data.page) : 1
    const limit = pagination.success ? Number(pagination.data.limit) : 50
    const skip = (page - 1) * limit

    // Build where clause based on user role
    const where: Prisma.CampaignWhereInput = {}
    
    // Non-admin users can only see their client's campaigns (in production)
    if (!isDevelopment && session?.user && session.user.role !== 'admin' && session.user.clientId) {
      where.clientId = session.user.clientId
    }
    
    if (status) {
      where.status = status as Prisma.EnumCampaignStatusFilter['equals']
    }
    if (clientId) {
      where.clientId = clientId
    }

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: includeStats ? {
          _count: {
            select: {
              assets: true,
              utmLinks: true,
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.campaign.count({ where }),
    ])

    // Calculate real stats for each campaign
    if (includeStats) {
      const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
        const rawRegistrations = await db.rawData.aggregate({
          where: {
            campaignId: campaign.id,
            metric: 'registrations'
          },
          _sum: { value: true }
        })

        const rawSpend = await db.rawData.aggregate({
          where: {
            campaignId: campaign.id,
            metric: 'spend'
          },
          _sum: { value: true }
        })

        const totalRegistrations = rawRegistrations._sum.value || 0
        const totalSpend = rawSpend._sum.value || 0
        const cpa = totalRegistrations > 0 ? totalSpend / totalRegistrations : 0

        return {
          ...campaign,
          stats: {
            totalRegistrations,
            totalSpend,
            cpa: Math.round(cpa),
            progress: campaign.targetRegistrations > 0 
              ? Math.round((totalRegistrations / campaign.targetRegistrations) * 100)
              : 0
          }
        }
      }))

      return NextResponse.json({ 
        campaigns: campaignsWithStats,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      })
    }

    return NextResponse.json({ 
      campaigns,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Create new campaign
async function createCampaign(req: NextRequest) {
  try {
    // Check authentication (skip in development mode for easier testing)
    const session = await getServerSession(authOptions)
    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate input
    const validation = validateBody(createCampaignSchema, body)
    if (validation instanceof NextResponse) return validation
    
    const data = validation

    // Check client access (in production)
    if (!isDevelopment && data.clientId && session?.user && session.user.role !== 'admin' && session.user.clientId !== data.clientId) {
      return NextResponse.json({ error: 'Forbidden: No access to this client' }, { status: 403 })
    }

    // Create campaign
    const campaign = await db.campaign.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'draft',
        budget: data.budget || 0,
        targetRegistrations: data.targetRegistrations || 0,
        baseUrl: data.baseUrl || 'https://codeacademyug.org/register',
        clientId: data.clientId || (session?.user?.clientId || null),
      }
    })

    // Create default KPI targets
    await db.kPITarget.createMany({
      data: [
        { campaignId: campaign.id, metric: 'Total Registrations', target: data.targetRegistrations || 0, unit: 'count' },
        { campaignId: campaign.id, metric: 'Total Spend', target: data.budget || 0, unit: 'UGX' },
        { campaignId: campaign.id, metric: 'CPA', target: 10000, unit: 'UGX', isLowerBetter: true },
        { campaignId: campaign.id, metric: 'CTR', target: 3.0, unit: '%' },
        { campaignId: campaign.id, metric: 'ROAS', target: 2.5, unit: 'x' },
      ]
    })

    // Log audit (in production)
    if (!isDevelopment && session?.user) {
      await db.auditLog.create({
        data: {
          action: 'create',
          entityType: 'campaign',
          entityId: campaign.id,
          userId: session.user.id,
          userEmail: session.user.email,
          details: JSON.stringify({ name: campaign.name }),
        }
      })
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

// Export handlers with rate limiting
export const GET = withRateLimit(getCampaigns)
export const POST = withRateLimit(createCampaign)
