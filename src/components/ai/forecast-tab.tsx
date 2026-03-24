'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Loader2, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ForecastTabProps {
  campaignId: string | null
}

export function ForecastTab({ campaignId }: ForecastTabProps) {
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!campaignId) return
    
    let cancelled = false
    const loadForecast = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/forecast?campaignId=${campaignId}`)
        const data = await res.json()
        if (!cancelled) {
          setForecastData(data.forecast)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadForecast()
    
    return () => { cancelled = true }
  }, [campaignId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!forecastData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4" />
          <p>No forecast data available. Add some data first!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-2xl font-bold">{forecastData.current.registrations}</p>
            <p className="text-xs text-muted-foreground">of {forecastData.current.target} target</p>
            <Progress value={parseFloat(forecastData.assessment.targetProgress)} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Days Remaining</p>
            <p className="text-2xl font-bold">{forecastData.current.daysRemaining}</p>
            <p className="text-xs text-muted-foreground">{forecastData.current.daysElapsed} days elapsed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Daily Rate</p>
            <p className="text-2xl font-bold">{forecastData.rates.current}</p>
            <p className="text-xs text-muted-foreground">Required: {forecastData.rates.required}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="text-2xl font-bold">{forecastData.projections.confidence}%</p>
            <Progress value={parseFloat(forecastData.projections.confidence)} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Enrollment Projections
          </CardTitle>
          <CardDescription>
            Predicted final enrollment numbers based on current trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-6 border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Pessimistic</p>
              <p className="text-3xl font-bold">{forecastData.projections.pessimistic}</p>
              <p className="text-xs text-muted-foreground mt-1">Worst case scenario</p>
            </div>
            
            <div className="p-6 border-2 border-blue-300 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Baseline</p>
              <p className="text-3xl font-bold text-blue-600">{forecastData.projections.baseline}</p>
              <p className="text-xs text-muted-foreground mt-1">Most likely</p>
            </div>
            
            <div className="p-6 border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Optimistic</p>
              <p className="text-3xl font-bold">{forecastData.projections.optimistic}</p>
              <p className="text-xs text-muted-foreground mt-1">Best case</p>
            </div>
          </div>

          {/* Will Hit Target? */}
          <div className={`p-6 rounded-lg ${
            forecastData.assessment.willHitTarget 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200'
          }`}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">
                {forecastData.assessment.willHitTarget ? '✅' : '⚠️'}
              </span>
              <div>
                <p className="text-lg font-bold">
                  {forecastData.assessment.willHitTarget 
                    ? 'On track to hit target!' 
                    : 'Risk of missing target'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Time progress: {forecastData.assessment.timeProgress}% | Target progress: {forecastData.assessment.targetProgress}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-lg ${
              forecastData.rates.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-950/20' :
              forecastData.rates.trend === 'down' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted'
            }`}>
              {forecastData.rates.trend === 'up' && <TrendingUp className="h-8 w-8 text-emerald-600" />}
              {forecastData.rates.trend === 'down' && <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />}
              {forecastData.rates.trend === 'stable' && <span className="text-2xl">➡️</span>}
            </div>
            <div>
              <p className="font-semibold text-lg capitalize">{forecastData.rates.trend} Trend</p>
              <p className="text-sm text-muted-foreground">
                {forecastData.rates.trendPercent}% change from previous week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold mb-2">AI Recommendation</p>
              <p className="text-sm">{forecastData.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
