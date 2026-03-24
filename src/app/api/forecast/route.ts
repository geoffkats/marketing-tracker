import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/forecast - Get enrollment forecast
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    // Get campaign and raw data
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        rawData: { orderBy: { date: 'asc' } },
        forecasts: { orderBy: { forecastDate: 'desc' }, take: 10 }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Calculate metrics
    const registrations = campaign.rawData.filter(r => r.metric === 'registrations')
    const totalRegistrations = registrations.reduce((sum, r) => sum + r.value, 0)

    // Calculate daily rates
    const dailyData: Record<string, number> = {}
    for (const row of registrations) {
      const dateKey = new Date(row.date).toISOString().slice(0, 10)
      dailyData[dateKey] = (dailyData[dateKey] || 0) + row.value
    }

    const dates = Object.keys(dailyData).sort()
    
    // Calculate time-based metrics
    const now = new Date()
    const startDate = new Date(campaign.startDate)
    const endDate = new Date(campaign.endDate)
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Calculate average daily rate
    const avgDailyRate = daysElapsed > 0 ? totalRegistrations / daysElapsed : 0
    
    // Calculate trend (last 7 days vs previous 7 days)
    const last7Days = dates.slice(-7)
    const previous7Days = dates.slice(-14, -7)
    
    const last7DaysTotal = last7Days.reduce((sum, d) => sum + dailyData[d], 0)
    const previous7DaysTotal = previous7Days.reduce((sum, d) => sum + dailyData[d], 0)
    
    const trendDirection = last7DaysTotal > previous7DaysTotal ? 'up' : last7DaysTotal < previous7DaysTotal ? 'down' : 'stable'
    const trendPercent = previous7DaysTotal > 0 
      ? ((last7DaysTotal - previous7DaysTotal) / previous7DaysTotal) * 100 
      : 0

    // Calculate projections
    const baseProjection = totalRegistrations + (avgDailyRate * daysRemaining)
    
    // Adjust for trend
    let optimisticRate = avgDailyRate * (1 + Math.max(0, trendPercent / 100))
    let pessimisticRate = avgDailyRate * (1 - Math.max(0, Math.abs(trendPercent) / 200))
    
    // Ensure rates are positive
    optimisticRate = Math.max(optimisticRate, avgDailyRate)
    pessimisticRate = Math.max(pessimisticRate, avgDailyRate * 0.5)

    const optimisticProjection = totalRegistrations + (optimisticRate * daysRemaining)
    const pessimisticProjection = totalRegistrations + (pessimisticRate * daysRemaining)

    // Calculate confidence based on data quality
    const dataPoints = registrations.length
    const daysWithData = dates.length
    const confidence = Math.min(95, 50 + (daysWithData * 3) + (dataPoints > 50 ? 20 : 10))

    // Calculate progress metrics
    const timeProgress = (daysElapsed / totalDays) * 100
    const targetProgress = (totalRegistrations / campaign.targetRegistrations) * 100
    const isOnTrack = targetProgress >= timeProgress * 0.9 // Within 10% of expected pace

    // Required daily rate to hit target
    const remainingNeeded = campaign.targetRegistrations - totalRegistrations
    const requiredDailyRate = daysRemaining > 0 ? remainingNeeded / daysRemaining : 0

    // Generate recommendation
    let recommendation = ''
    if (isOnTrack) {
      recommendation = `Campaign is on track! Maintain current strategy with ${requiredDailyRate.toFixed(1)} registrations/day needed.`
    } else if (requiredDailyRate > avgDailyRate * 1.5) {
      recommendation = `⚠️ URGENT: Need ${requiredDailyRate.toFixed(1)} registrations/day (${((requiredDailyRate / avgDailyRate - 1) * 100).toFixed(0)}% increase). Consider budget increase or new channels.`
    } else {
      recommendation = `Need ${requiredDailyRate.toFixed(1)} registrations/day to hit target. Current rate: ${avgDailyRate.toFixed(1)}/day. Minor adjustments recommended.`
    }

    // Store forecast
    const forecast = await db.forecast.create({
      data: {
        campaignId,
        currentRegistrations: totalRegistrations,
        daysRemaining,
        avgDailyRate,
        predictedTotal: Math.round(baseProjection),
        confidence: confidence / 100,
        optimisticTotal: Math.round(optimisticProjection),
        pessimisticTotal: Math.round(pessimisticProjection),
        recommendation,
      }
    })

    return NextResponse.json({
      success: true,
      forecast: {
        id: forecast.id,
        current: {
          registrations: totalRegistrations,
          target: campaign.targetRegistrations,
          progress: targetProgress.toFixed(1),
          daysElapsed,
          daysRemaining,
          totalDays,
        },
        rates: {
          current: avgDailyRate.toFixed(2),
          required: requiredDailyRate.toFixed(2),
          trend: trendDirection,
          trendPercent: trendPercent.toFixed(1),
        },
        projections: {
          baseline: Math.round(baseProjection),
          optimistic: Math.round(optimisticProjection),
          pessimistic: Math.round(pessimisticProjection),
          confidence: confidence.toFixed(0),
        },
        assessment: {
          willHitTarget: baseProjection >= campaign.targetRegistrations,
          isOnTrack,
          timeProgress: timeProgress.toFixed(1),
          targetProgress: targetProgress.toFixed(1),
        },
        recommendation,
        chart: {
          dates: dates.slice(-30),
          values: dates.slice(-30).map(d => dailyData[d] || 0),
          cumulative: dates.slice(-30).reduce((acc: number[], d) => {
            const prev = acc[acc.length - 1] || 0
            acc.push(prev + (dailyData[d] || 0))
            return acc
          }, []),
        }
      },
      history: campaign.forecasts
    })
  } catch (error) {
    console.error('Forecast error:', error)
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}
