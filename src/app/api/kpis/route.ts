import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/kpis - Get KPI targets for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const kpiTargets = await db.kPITarget.findMany({
      where: { campaignId },
      orderBy: { metric: 'asc' }
    })

    // Calculate status for each KPI
    const kpis = kpiTargets.map(kpi => {
      let status: 'success' | 'warning' | 'danger' = 'success'
      const delta = kpi.target > 0 ? ((kpi.current - kpi.target) / kpi.target) * 100 : 0

      if (kpi.isLowerBetter) {
        // For metrics like CPA, lower is better
        if (kpi.current > kpi.target) {
          status = kpi.current > kpi.target * 1.2 ? 'danger' : 'warning'
        }
      } else {
        // For metrics like registrations, higher is better
        if (kpi.current < kpi.target) {
          status = kpi.current < kpi.target * 0.8 ? 'danger' : 'warning'
        }
      }

      return {
        ...kpi,
        delta: Math.round(delta * 100) / 100,
        status
      }
    })

    return NextResponse.json({ kpis })
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    )
  }
}

// PUT /api/kpis - Update KPI target
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const kpi = await db.kPITarget.update({
      where: { id: body.id },
      data: {
        target: body.target,
        isLowerBetter: body.isLowerBetter,
      }
    })

    return NextResponse.json({ kpi })
  } catch (error) {
    console.error('Error updating KPI:', error)
    return NextResponse.json(
      { error: 'Failed to update KPI' },
      { status: 500 }
    )
  }
}
