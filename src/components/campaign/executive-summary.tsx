'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCampaignStore } from '@/store/campaign-store'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export function ExecutiveSummary() {
  const { kpis, rawData, alertSettings } = useCampaignStore()

  // Calculate totals from raw data
  const totalRegistrations = rawData
    .filter(d => d.metric === 'Registrations')
    .reduce((sum, d) => sum + d.value, 0)
  
  const totalSpend = rawData
    .filter(d => d.metric === 'Spend')
    .reduce((sum, d) => sum + d.value, 0)
  
  const totalClicks = rawData
    .filter(d => d.metric === 'Clicks')
    .reduce((sum, d) => sum + d.value, 0)
  
  const totalImpressions = rawData
    .filter(d => d.metric === 'Impressions')
    .reduce((sum, d) => sum + d.value, 0)

  const cpa = totalRegistrations > 0 ? Math.round(totalSpend / totalRegistrations) : 0
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
  const roas = totalSpend > 0 ? ((totalRegistrations * 15000) / totalSpend).toFixed(2) : '0'

  // Channel performance data
  const channelPerformance = ['FB', 'IG', 'TT', 'Google', 'Email'].map(channel => {
    const registrations = rawData
      .filter(d => d.channel === channel && d.metric === 'Registrations')
      .reduce((sum, d) => sum + d.value, 0)
    const spend = rawData
      .filter(d => d.channel === channel && d.metric === 'Spend')
      .reduce((sum, d) => sum + d.value, 0)
    return { channel, registrations, spend }
  }).filter(c => c.registrations > 0)

  // Daily trend data
  const dates = [...new Set(rawData.map(d => d.date))].sort()
  const dailyTrend = dates.map(date => {
    const registrations = rawData
      .filter(d => d.date === date && d.metric === 'Registrations')
      .reduce((sum, d) => sum + d.value, 0)
    const spend = rawData
      .filter(d => d.date === date && d.metric === 'Spend')
      .reduce((sum, d) => sum + d.value, 0)
    return { date: date.slice(5), registrations, spend: spend / 100000 }
  })

  // Active alerts
  const activeAlerts = alertSettings.filter(a => a.active)
  const triggeredAlerts = kpis.filter(kpi => {
    const setting = alertSettings.find(s => s.metric === kpi.metric && s.active)
    if (!setting) return false
    if (setting.direction === 'above') return kpi.current > setting.threshold
    return kpi.current < setting.threshold
  })

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {triggeredAlerts.length > 0 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                {triggeredAlerts.length} Active Alert(s)
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {triggeredAlerts.map(a => a.metric).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              Target: 500 | {((totalRegistrations / 500) * 100).toFixed(0)}% achieved
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${Math.min((totalRegistrations / 500) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend (UGX)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalSpend / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              Budget: 5M UGX | {((totalSpend / 5000000) * 100).toFixed(0)}% used
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.min((totalSpend / 5000000) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPA (UGX)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {cpa.toLocaleString()}
              {cpa <= 10000 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: ≤10,000 UGX
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {roas}x
              {parseFloat(roas) >= 2.5 ? (
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: ≥2.5x
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Performance
            </CardTitle>
            <CardDescription>Registrations and Spend trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="registrations" fill="#10b981" name="Registrations" />
                <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#3b82f6" name="Spend (100K)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Channel Performance
            </CardTitle>
            <CardDescription>Registrations by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={channelPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, registrations }) => `${channel}: ${registrations}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="registrations"
                >
                  {channelPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Channels</CardTitle>
          <CardDescription>Ranked by registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelPerformance
              .sort((a, b) => b.registrations - a.registrations)
              .slice(0, 3)
              .map((channel, index) => (
                <div key={channel.channel} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{channel.channel}</p>
                      <p className="text-sm text-muted-foreground">
                        Spend: {(channel.spend / 1000).toFixed(0)}K UGX
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{channel.registrations} registrations</p>
                    <p className="text-sm text-muted-foreground">
                      CPA: {channel.registrations > 0 ? Math.round(channel.spend / channel.registrations).toLocaleString() : 'N/A'} UGX
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Metric</th>
                  <th className="text-right py-3 px-4">Target</th>
                  <th className="text-right py-3 px-4">Current</th>
                  <th className="text-right py-3 px-4">Delta</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi) => (
                  <tr key={kpi.metric} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{kpi.metric}</td>
                    <td className="text-right py-3 px-4">{kpi.target.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{kpi.current.toLocaleString()}</td>
                    <td className={`text-right py-3 px-4 ${kpi.delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {kpi.delta > 0 ? '+' : ''}{kpi.delta.toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-4">
                      {kpi.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm">
                          <CheckCircle2 className="h-4 w-4" /> On Track
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-sm">
                          <AlertTriangle className="h-4 w-4" /> Attention
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
