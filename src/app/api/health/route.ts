import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/health - Get campaign health metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        rawData: true,
        leads: true,
        influencers: true,
        kpiTargets: true,
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Calculate metrics
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
    const budgetUsed = campaign.budget > 0 ? (totalSpend / campaign.budget) * 100 : 0
    const progress = campaign.targetRegistrations > 0 
      ? (totalRegistrations / campaign.targetRegistrations) * 100 : 0

    // Calculate days
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil(
      (new Date(campaign.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ))
    const daysElapsed = Math.max(1, Math.ceil(
      (now.getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ))
    const totalDays = Math.ceil(
      (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Time progress
    const timeProgress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0

    // Lead conversion rate
    const totalLeads = campaign.leads.length
    const convertedLeads = campaign.leads.filter(l => l.status === 'paid' || l.status === 'converted').length
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    // Pending leads (unpaid for 48+ hours)
    const pendingLeads = campaign.leads.filter(l => {
      if (l.status !== 'pending') return false
      const hoursSinceRegistration = (Date.now() - new Date(l.registeredAt).getTime()) / (1000 * 60 * 60)
      return hoursSinceRegistration >= 48
    }).length

    // Daily rate
    const avgDailyRate = totalRegistrations / daysElapsed
    const requiredDailyRate = daysRemaining > 0 
      ? (campaign.targetRegistrations - totalRegistrations) / daysRemaining 
      : 0

    // Health scores (0-100)
    const budgetHealth = calculateBudgetHealth(budgetUsed, timeProgress)
    const progressHealth = calculateProgressHealth(progress, timeProgress)
    const cpaHealth = calculateCPAHealth(cpa)
    const leadHealth = calculateLeadHealth(leadConversionRate, pendingLeads, totalLeads)

    // Overall health
    const overallHealth = Math.round((budgetHealth + progressHealth + cpaHealth + leadHealth) / 4)

    // Status determination
    const status = determineStatus(overallHealth)

    // Alerts
    const alerts = generateAlerts({
      budgetUsed,
      timeProgress,
      progress,
      cpa,
      ctr,
      pendingLeads,
      avgDailyRate,
      requiredDailyRate,
      daysRemaining,
    })

    return NextResponse.json({
      health: {
        overall: overallHealth,
        budget: budgetHealth,
        progress: progressHealth,
        cpa: cpaHealth,
        lead: leadHealth,
      },
      status,
      metrics: {
        totalRegistrations,
        totalSpend,
        cpa: Math.round(cpa),
        ctr: ctr.toFixed(2),
        budgetUsed: budgetUsed.toFixed(1),
        progress: progress.toFixed(1),
        timeProgress: timeProgress.toFixed(1),
        leadConversionRate: leadConversionRate.toFixed(1),
        avgDailyRate: avgDailyRate.toFixed(1),
        requiredDailyRate: requiredDailyRate.toFixed(1),
      },
      timeline: {
        daysRemaining,
        daysElapsed,
        totalDays,
      },
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        pending: campaign.leads.filter(l => l.status === 'pending').length,
        urgent: pendingLeads,
      },
      alerts,
      recommendations: generateRecommendations({
        budgetHealth,
        progressHealth,
        cpaHealth,
        leadHealth,
        budgetUsed,
        progress,
        cpa,
        pendingLeads,
        daysRemaining,
        requiredDailyRate,
        avgDailyRate,
      }),
    })
  } catch (error) {
    console.error('Error calculating health:', error)
    return NextResponse.json({ error: 'Failed to calculate health' }, { status: 500 })
  }
}

function calculateBudgetHealth(budgetUsed: number, timeProgress: number): number {
  // Ideal: budget used should roughly match time progress
  const budgetRatio = budgetUsed / Math.max(timeProgress, 1)
  
  if (budgetRatio >= 0.8 && budgetRatio <= 1.2) return 100 // On track
  if (budgetRatio >= 0.6 && budgetRatio <= 1.4) return 80  // Slight deviation
  if (budgetRatio >= 0.4 && budgetRatio <= 1.6) return 60  // Moderate deviation
  if (budgetRatio >= 0.2 && budgetRatio <= 1.8) return 40  // Significant deviation
  return 20 // Critical deviation
}

function calculateProgressHealth(progress: number, timeProgress: number): number {
  if (timeProgress <= 0) return 100 // Campaign not started
  
  const progressRatio = progress / timeProgress
  
  if (progressRatio >= 0.9) return 100 // Ahead or on track
  if (progressRatio >= 0.7) return 80  // Slightly behind
  if (progressRatio >= 0.5) return 60  // Behind
  if (progressRatio >= 0.3) return 40  // Significantly behind
  return 20 // Critical
}

function calculateCPAHealth(cpa: number): number {
  // Assuming target CPA is 10,000 UGX
  const targetCPA = 10000
  
  if (cpa <= targetCPA * 0.7) return 100 // Excellent
  if (cpa <= targetCPA) return 85        // Good
  if (cpa <= targetCPA * 1.5) return 60  // Moderate
  if (cpa <= targetCPA * 2) return 40    // High
  return 20 // Critical
}

function calculateLeadHealth(leadConversionRate: number, pendingLeads: number, totalLeads: number): number {
  if (totalLeads === 0) return 100 // No leads yet
  
  let score = 50
  
  // Conversion rate bonus
  if (leadConversionRate >= 50) score += 30
  else if (leadConversionRate >= 30) score += 20
  else if (leadConversionRate >= 15) score += 10
  
  // Pending leads penalty
  const pendingRatio = pendingLeads / totalLeads
  if (pendingRatio > 0.5) score -= 20
  else if (pendingRatio > 0.3) score -= 10
  else if (pendingRatio <= 0.1) score += 20
  
  return Math.max(0, Math.min(100, score))
}

function determineStatus(overallHealth: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (overallHealth >= 80) return 'excellent'
  if (overallHealth >= 60) return 'good'
  if (overallHealth >= 40) return 'warning'
  return 'critical'
}

function generateAlerts(metrics: any): any[] {
  const alerts: any[] = []
  
  if (metrics.budgetUsed > metrics.timeProgress * 1.3) {
    alerts.push({
      type: 'budget',
      severity: 'warning',
      message: `Budget spending (${metrics.budgetUsed.toFixed(1)}%) is ahead of time progress (${metrics.timeProgress.toFixed(1)}%)`,
    })
  }
  
  if (metrics.progress < metrics.timeProgress * 0.7) {
    alerts.push({
      type: 'progress',
      severity: 'warning',
      message: `Registration progress (${metrics.progress.toFixed(1)}%) is behind time progress (${metrics.timeProgress.toFixed(1)}%)`,
    })
  }
  
  if (metrics.cpa > 15000) {
    alerts.push({
      type: 'cpa',
      severity: 'critical',
      message: `CPA (${Math.round(metrics.cpa).toLocaleString()} UGX) is above target (10,000 UGX)`,
    })
  }
  
  if (metrics.pendingLeads > 5) {
    alerts.push({
      type: 'leads',
      severity: 'warning',
      message: `${metrics.pendingLeads} leads have been pending for 48+ hours`,
    })
  }
  
  if (metrics.requiredDailyRate > metrics.avgDailyRate * 1.5) {
    alerts.push({
      type: 'pace',
      severity: 'critical',
      message: `Need ${metrics.requiredDailyRate.toFixed(1)}/day vs current ${metrics.avgDailyRate.toFixed(1)}/day`,
    })
  }
  
  if (metrics.daysRemaining <= 3 && metrics.progress < 80) {
    alerts.push({
      type: 'deadline',
      severity: 'critical',
      message: `Only ${metrics.daysRemaining} days remaining with ${metrics.progress.toFixed(1)}% progress`,
    })
  }
  
  return alerts
}

function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = []
  
  if (metrics.budgetHealth < 60) {
    if (metrics.budgetUsed > 70) {
      recommendations.push('Consider slowing ad spend or increasing budget allocation')
    } else {
      recommendations.push('Consider increasing ad spend to meet registration targets')
    }
  }
  
  if (metrics.progressHealth < 60) {
    recommendations.push('Explore additional channels or increase content frequency')
  }
  
  if (metrics.cpaHealth < 60) {
    recommendations.push('Review underperforming ads and reallocate budget to top performers')
  }
  
  if (metrics.pendingLeads > 0) {
    recommendations.push(`Follow up with ${metrics.pendingLeads} pending leads immediately`)
  }
  
  if (metrics.daysRemaining <= 7) {
    recommendations.push('Prepare end-of-campaign report and transition materials')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Campaign is on track! Continue current strategy')
  }
  
  return recommendations
}
