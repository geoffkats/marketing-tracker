'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Zap,
  DollarSign,
  Target,
  Clock,
  Users
} from 'lucide-react'

interface HealthWidgetProps {
  campaignId: string | null
}

export function HealthWidget({ campaignId }: HealthWidgetProps) {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!campaignId) return
    
    let cancelled = false
    
    const loadHealth = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/health?campaignId=${campaignId}`)
        const data = await res.json()
        if (!cancelled) {
          setHealth(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    loadHealth()
    
    return () => { cancelled = true }
  }, [campaignId])

  const statusConfig = {
    excellent: { 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/20', 
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="h-5 w-5" />
    },
    good: { 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 dark:bg-blue-950/20', 
      border: 'border-blue-200',
      icon: <CheckCircle2 className="h-5 w-5" />
    },
    warning: { 
      color: 'text-amber-600', 
      bg: 'bg-amber-50 dark:bg-amber-950/20', 
      border: 'border-amber-200',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    critical: { 
      color: 'text-red-600', 
      bg: 'bg-red-50 dark:bg-red-950/20', 
      border: 'border-red-200',
      icon: <XCircle className="h-5 w-5" />
    },
  }

  const healthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!health) {
    return null
  }

  const config = statusConfig[health.status as keyof typeof statusConfig]

  return (
    <div className="space-y-6">
      {/* Overall Health Card */}
      <Card className={`border-2 ${config.border}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Campaign Health
            </CardTitle>
            <Badge className={`${config.bg} ${config.color} border-0`}>
              {config.icon}
              <span className="ml-1 capitalize">{health.status}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall Score */}
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold ${healthColor(health.health.overall)}`}>
              {health.health.overall}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Overall Health Score</p>
            <Progress value={health.health.overall} className="mt-2 h-3" />
          </div>

          {/* Individual Health Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <DollarSign className={`h-5 w-5 mx-auto mb-1 ${healthColor(health.health.budget)}`} />
              <p className="text-2xl font-bold">{health.health.budget}</p>
              <p className="text-xs text-muted-foreground">Budget Health</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Target className={`h-5 w-5 mx-auto mb-1 ${healthColor(health.health.progress)}`} />
              <p className="text-2xl font-bold">{health.health.progress}</p>
              <p className="text-xs text-muted-foreground">Progress Health</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Activity className={`h-5 w-5 mx-auto mb-1 ${healthColor(health.health.cpa)}`} />
              <p className="text-2xl font-bold">{health.health.cpa}</p>
              <p className="text-xs text-muted-foreground">CPA Health</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Users className={`h-5 w-5 mx-auto mb-1 ${healthColor(health.health.lead)}`} />
              <p className="text-2xl font-bold">{health.health.lead}</p>
              <p className="text-xs text-muted-foreground">Lead Health</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registrations</p>
                <p className="text-xl font-bold">{health.metrics.totalRegistrations}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <Progress value={parseFloat(health.metrics.progress)} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">{health.metrics.progress}% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Used</p>
                <p className="text-xl font-bold">{health.metrics.budgetUsed}%</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <Progress value={parseFloat(health.metrics.budgetUsed)} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {(health.metrics.totalSpend / 1000000).toFixed(2)}M UGX
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-xl font-bold">{health.timeline.daysRemaining}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <Progress value={parseFloat(health.metrics.timeProgress)} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">{health.metrics.timeProgress}% elapsed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPA</p>
                <p className="text-xl font-bold">{health.metrics.cpa.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: ≤10,000 UGX
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {health.alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.alerts.map((alert: any, i: number) => (
                <div 
                  key={i}
                  className={`p-3 rounded-lg flex items-start gap-3 ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50 dark:bg-red-950/20 border border-red-200' 
                      : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200'
                  }`}
                >
                  {alert.severity === 'critical' ? (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {health.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Daily Rate Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily Rate Analysis</CardTitle>
          <CardDescription>
            Current vs required daily registration rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Rate</p>
              <p className="text-2xl font-bold">{health.metrics.avgDailyRate}</p>
              <p className="text-xs text-muted-foreground">registrations/day</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Required Rate</p>
              <p className={`text-2xl font-bold ${
                parseFloat(health.metrics.requiredDailyRate) > parseFloat(health.metrics.avgDailyRate) * 1.2
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }`}>
                {health.metrics.requiredDailyRate}
              </p>
              <p className="text-xs text-muted-foreground">registrations/day needed</p>
            </div>
          </div>
          
          {parseFloat(health.metrics.requiredDailyRate) > parseFloat(health.metrics.avgDailyRate) && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Need to increase daily rate by {(
                    ((parseFloat(health.metrics.requiredDailyRate) / parseFloat(health.metrics.avgDailyRate)) - 1) * 100
                  ).toFixed(0)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
