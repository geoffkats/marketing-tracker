'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { useCampaignStore } from '@/store/campaign-store'
import { 
  Database, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Clock,
  Settings,
  Key,
  ExternalLink
} from 'lucide-react'

interface DataSource {
  id: string
  name: string
  icon: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync: string
  syncFrequency: string
  metrics: string[]
}

const dataSources: DataSource[] = [
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    icon: '📊',
    status: 'connected',
    lastSync: '2026-05-03 14:30',
    syncFrequency: 'Daily at 6:00 AM',
    metrics: ['Registrations', 'Page Views', 'Sessions', 'Conversions']
  },
  {
    id: 'facebook',
    name: 'Facebook Ads',
    icon: '📘',
    status: 'connected',
    lastSync: '2026-05-03 14:25',
    syncFrequency: 'Daily at 6:00 AM',
    metrics: ['Impressions', 'Clicks', 'Spend', 'Leads']
  },
  {
    id: 'instagram',
    name: 'Instagram Ads',
    icon: '📷',
    status: 'connected',
    lastSync: '2026-05-03 14:25',
    syncFrequency: 'Daily at 6:00 AM',
    metrics: ['Impressions', 'Clicks', 'Spend', 'Leads']
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    icon: '🎵',
    status: 'connected',
    lastSync: '2026-05-03 14:20',
    syncFrequency: 'Daily at 6:00 AM',
    metrics: ['Impressions', 'Clicks', 'Spend', 'Registrations']
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    icon: '🔍',
    status: 'connected',
    lastSync: '2026-05-03 14:15',
    syncFrequency: 'Daily at 6:00 AM',
    metrics: ['Impressions', 'Clicks', 'Spend', 'Conversions']
  },
  {
    id: 'email',
    name: 'Email (Gmail)',
    icon: '📧',
    status: 'connected',
    lastSync: '2026-05-03 14:00',
    syncFrequency: 'Every 6 hours',
    metrics: ['Opens', 'Clicks', 'Bounces']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    icon: '💼',
    status: 'disconnected',
    lastSync: 'Never',
    syncFrequency: 'Not configured',
    metrics: ['Impressions', 'Clicks', 'Spend']
  },
]

export function DataSources() {
  const { rawData } = useCampaignStore()
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const handleSync = (id: string) => {
    setSyncingId(id)
    setTimeout(() => setSyncingId(null), 2000)
  }

  const statusColors = {
    connected: 'bg-emerald-100 text-emerald-800',
    disconnected: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
  }

  const statusIcons = {
    connected: <Check className="h-3 w-3" />,
    disconnected: <AlertCircle className="h-3 w-3" />,
    error: <AlertCircle className="h-3 w-3" />,
  }

  return (
    <div className="space-y-6">
      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map((source) => (
          <Card key={source.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{source.icon}</span>
                  <div>
                    <CardTitle className="text-base">{source.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {source.syncFrequency}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={statusColors[source.status]}>
                  <span className="flex items-center gap-1">
                    {statusIcons[source.status]}
                    {source.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {source.lastSync}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {source.metrics.slice(0, 3).map((metric) => (
                    <Badge key={metric} variant="outline" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                  {source.metrics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{source.metrics.length - 3} more
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleSync(source.id)}
                    disabled={source.status !== 'connected'}
                  >
                    {syncingId === source.id ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Raw Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Raw Data Preview
          </CardTitle>
          <CardDescription>
            Ingested data from all connected platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rawData.slice(0, 10).map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{row.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.channel}</Badge>
                  </TableCell>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell className="text-right font-mono">
                    {row.value.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rawData.length > 10 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 10 of {rawData.length} rows
            </p>
          )}
        </CardContent>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Credentials Setup
          </CardTitle>
          <CardDescription>
            Configure API access for each platform (stored securely in Script Properties)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facebook Access Token</Label>
                <Input 
                  type="password" 
                  placeholder="<<FB_ACCESS_TOKEN>>"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok Access Token</Label>
                <Input 
                  type="password" 
                  placeholder="<<TT_ACCESS_TOKEN>>"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Google Ads Developer Token</Label>
                <Input 
                  type="password" 
                  placeholder="<<GOOGLE_ADS_DEV_TOKEN>>"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>GA4 Property ID</Label>
                <Input 
                  placeholder="<<GA4_PROPERTY_ID>>"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Security Note:</strong> API credentials are stored in Google Apps Script Properties 
                and are only accessible to script owners. Never share these values in code or documentation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raw Data CSV Template */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data CSV Template</CardTitle>
          <CardDescription>
            Format for manual data uploads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`Date,Channel,Metric,Value
2026-05-01,FB,Impressions,45000
2026-05-01,FB,Clicks,1200
2026-05-01,FB,Spend,250000
2026-05-01,FB,Registrations,45
2026-05-01,IG,Impressions,32000
2026-05-01,IG,Clicks,890
2026-05-01,IG,Spend,180000
2026-05-01,IG,Registrations,32`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
