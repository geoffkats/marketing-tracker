'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, Zap, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface AIStrategistTabProps {
  campaignId: string | null
}

export function AIStrategistTab({ campaignId }: AIStrategistTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [insight, setInsight] = useState<any>(null)

  const getRecommendation = async () => {
    if (!campaignId) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/strategize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      })
      const data = await res.json()
      setInsight(data)
      toast.success('AI analysis complete!')
    } catch (e) {
      toast.error('Failed to get AI recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Campaign Strategist
          </CardTitle>
          <CardDescription>
            Get AI-powered insights and recommendations based on your campaign data. 
            The AI analyzes your registration trends, budget spending, and channel performance to provide actionable advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={getRecommendation} disabled={isLoading || !campaignId} className="mb-4">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate AI Insights
              </>
            )}
          </Button>

          {insight?.analysis && (
            <div className="space-y-4 mt-4">
              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{insight.analysis.summary}</p>
              </div>

              {/* Urgency */}
              {insight.analysis.urgency && (
                <div className={`p-3 rounded-lg flex items-center gap-3 ${
                  insight.analysis.urgency === 'critical' ? 'bg-red-50 text-red-800 dark:bg-red-950/20' :
                  insight.analysis.urgency === 'high' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/20' :
                  'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20'
                }`}>
                  {insight.analysis.urgency === 'critical' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  <span className="font-semibold capitalize">Urgency: {insight.analysis.urgency}</span>
                </div>
              )}

              {/* Recommendations */}
              {insight.analysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {insight.analysis.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{rec.title}</span>
                          <div className="flex gap-2">
                            <Badge variant={rec.impact === 'high' ? 'default' : 'secondary'}>
                              {rec.impact} impact
                            </Badge>
                            <Badge variant="outline">{rec.effort} effort</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{rec.description}</p>
                        <p className="text-sm font-medium mt-2 text-primary">→ {rec.specifics}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel Insights */}
              {insight.analysis.channelInsights?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Channel Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insight.analysis.channelInsights.map((ch: any, i: number) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">{ch.channel}</span>
                          <Badge variant={
                            ch.status === 'overperforming' ? 'default' :
                            ch.status === 'underperforming' ? 'destructive' : 'secondary'
                          }>
                            {ch.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{ch.insight}</p>
                        {ch.action && (
                          <p className="text-sm font-medium mt-2 text-primary">→ {ch.action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Reallocation */}
              {insight.analysis.budgetReallocation && (
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <h4 className="font-semibold mb-2">Budget Reallocation Suggestion</h4>
                  <p className="text-sm">{insight.analysis.budgetReallocation.suggestion}</p>
                </div>
              )}

              {/* Predictions */}
              {insight.analysis.predictions && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-3">Prediction</h4>
                  <div className="flex items-center gap-4">
                    <span className={`text-3xl ${insight.analysis.predictions.willHitTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {insight.analysis.predictions.willHitTarget ? '✓' : '⚠️'}
                    </span>
                    <div>
                      <p className="font-semibold text-lg">
                        {insight.analysis.predictions.willHitTarget ? 'Likely to hit target' : 'May miss target'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {insight.analysis.predictions.confidence}%
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mt-3">{insight.analysis.predictions.explanation}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How AI Strategist Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>🤖 Analyzes your registration trends and budget spending patterns</p>
          <p>📊 Compares channel performance (FB, IG, TT, Google, etc.)</p>
          <p>⏱️ Considers days remaining and average daily rate</p>
          <p>💰 Provides specific budget reallocation suggestions</p>
          <p>🎯 Predicts likelihood of hitting your target</p>
        </CardContent>
      </Card>
    </div>
  )
}
