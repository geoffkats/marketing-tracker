'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  LayoutDashboard,
  FolderTree,
  Link2,
  Database,
  Bell,
  Code,
  FileText,
  Menu,
  X,
  Calendar,
  Target,
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Star,
  Activity,
  Plug,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { FileImport } from '@/components/import/file-import'
import { AIStrategistTab } from '@/components/ai/ai-strategist-tab'
import { ForecastTab } from '@/components/ai/forecast-tab'
import { LeadsTab } from '@/components/ai/leads-tab'
import { InfluencersTab } from '@/components/ai/influencers-tab'
import { IntegrationsTab } from '@/components/integrations/integrations-tab'
import { HealthWidget } from '@/components/health/health-widget'
import { UTMBuilder } from '@/components/campaign/utm-builder'

// Data Sources Tab Component
function DataSourcesTab({ campaignId, onDataAdded }: { campaignId: string | null; onDataAdded: () => void }) {
  const [isAddDataOpen, setIsAddDataOpen] = useState(false)
  const [dataSources, setDataSources] = useState<any[]>([])
  const [ingestStats, setIngestStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/data/ingest')
      .then(res => res.json())
      .then(data => {
        setDataSources(data.dataSources)
        setIngestStats(data.stats)
      })
      .catch(console.error)
  }, [campaignId])

  const handleAddData = async (formData: FormData) => {
    if (!campaignId) return

    const entries = []
    const date = formData.get('date') as string
    const channel = formData.get('channel') as string

    const metrics = ['impressions', 'clicks', 'spend', 'registrations']
    for (const metric of metrics) {
      const value = parseFloat(formData.get(metric) as string)
      if (!isNaN(value) && value > 0) {
        entries.push({ date, channel, metric, value })
      }
    }

    if (entries.length === 0) {
      toast.error('Please enter at least one metric value')
      return
    }

    try {
      const res = await fetch('/api/data/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, data: entries })
      })
      const result = await res.json()
      if (result.success) {
        toast.success(`Added ${result.recordsAdded} data points`)
        setIsAddDataOpen(false)
        onDataAdded()
      }
    } catch (e) {
      toast.error('Failed to add data')
    }
  }

  const statusColors: Record<string, string> = {
    connected: 'bg-emerald-500',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
    syncing: 'bg-amber-500',
  }

  return (
    <div className="space-y-6">
      {/* CSV File Import */}
      {campaignId && (
        <FileImport campaignId={campaignId} onImportComplete={onDataAdded} />
      )}

      {/* Connected Data Sources */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Connected Platforms</h3>
          <Dialog open={isAddDataOpen} onOpenChange={setIsAddDataOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Marketing Data</DialogTitle>
                <DialogDescription>Manually enter performance data for this campaign.</DialogDescription>
              </DialogHeader>
              <form action={handleAddData} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select name="channel" defaultValue="FB">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FB">Facebook</SelectItem>
                        <SelectItem value="IG">Instagram</SelectItem>
                        <SelectItem value="TT">TikTok</SelectItem>
                        <SelectItem value="Google">Google Ads</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Impressions</Label>
                    <Input type="number" name="impressions" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Clicks</Label>
                    <Input type="number" name="clicks" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spend (UGX)</Label>
                    <Input type="number" name="spend" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Registrations</Label>
                    <Input type="number" name="registrations" placeholder="0" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDataOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Data</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map(source => (
            <div key={source.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{source.name}</span>
                <span className={`w-2 h-2 rounded-full ${statusColors[source.status]}`} />
              </div>
              <p className="text-sm text-muted-foreground">
                Last sync: {source.lastSync ? new Date(source.lastSync).toLocaleString() : 'Never'}
              </p>
              {source.lastError && (
                <p className="text-sm text-red-500 mt-1">Error: {source.lastError}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Info */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Webhook Integration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use this endpoint to programmatically send data to this campaign:
        </p>
        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`POST /api/data/ingest
Content-Type: application/json

{
  "campaignId": "${campaignId}",
  "type": "webhook",
  "data": {
    "date": "2026-05-10",
    "channel": "FB",
    "metrics": {
      "impressions": 50000,
      "clicks": 1200,
      "spend": 250000,
      "registrations": 45
    }
  }
}`}
        </pre>
      </div>

      {/* Ingestion Stats */}
      {ingestStats && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Data Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Data Points</p>
              <p className="text-2xl font-bold">{ingestStats.totalDataPoints}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Ingestion</p>
              <p className="text-lg font-medium">
                {ingestStats.lastIngestion ? new Date(ingestStats.lastIngestion).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Types
interface Client {
  id: string
  name: string
  slug: string
  logo: string | null
  primaryColor: string
  _count?: { campaigns: number }
}

interface Campaign {
  id: string
  name: string
  slug: string
  description: string | null
  startDate: string
  endDate: string
  status: string
  budget: number
  targetRegistrations: number
  baseUrl: string
  createdAt: string
  stats?: {
    totalRegistrations: number
    totalSpend: number
    cpa: number
    progress: number
  }
}

interface CampaignData {
  campaign: Campaign
  metrics: {
    totalRegistrations: number
    totalSpend: number
    totalClicks: number
    totalImpressions: number
    cpa: number
    ctr: number
    roas: number
    progress: number
    budgetUsed: number
  }
  channelMetrics: Record<string, Record<string, number>>
  dailyMetrics: Record<string, Record<string, number>>
  lastDataSync: string | null
  recentAlerts: any[]
  rawData: any[]
  assets: any[]
  utmLinks: any[]
  kpiTargets: any[]
  alerts: any[]
}

type TabId = 'summary' | 'assets' | 'utm' | 'data' | 'alerts' | 'ai' | 'forecast' | 'leads' | 'influencers' | 'health' | 'integrations' | 'scripts' | 'docs'

const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'summary', label: 'Executive Summary', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'health', label: '❤️ Campaign Health', icon: <Activity className="h-4 w-4" /> },
  { id: 'ai', label: '🤖 AI Strategist', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'forecast', label: '📈 Enrollment Forecast', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'leads', label: 'Lead Nurture', icon: <Users className="h-4 w-4" /> },
  { id: 'influencers', label: 'Influencer ROI', icon: <Star className="h-4 w-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug className="h-4 w-4" /> },
  { id: 'assets', label: 'Assets Manager', icon: <FolderTree className="h-4 w-4" /> },
  { id: 'utm', label: 'UTM Builder', icon: <Link2 className="h-4 w-4" /> },
  { id: 'data', label: 'Data Sources', icon: <Database className="h-4 w-4" /> },
  { id: 'alerts', label: 'Alert System', icon: <Bell className="h-4 w-4" /> },
  { id: 'scripts', label: 'Scripts & Templates', icon: <Code className="h-4 w-4" /> },
  { id: 'docs', label: 'Documentation', icon: <FileText className="h-4 w-4" /> },
]

export default function Home() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false)
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  
  // Fetch clients - only once on mount using AbortController pattern
  useEffect(() => {
    const controller = new AbortController()
    
    fetch('/api/clients?includeStats=true', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!controller.signal.aborted) {
          setClients(data.clients)
          if (data.clients.length > 0) {
            setSelectedClientId(data.clients[0].id)
          }
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch clients:', error)
        }
      })
    
    return () => controller.abort()
  }, [])

  // Fetch campaigns - only once on mount using AbortController pattern
  useEffect(() => {
    const controller = new AbortController()
    
    fetch('/api/campaigns?includeStats=true', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!controller.signal.aborted) {
          setCampaigns(data.campaigns)
          if (data.campaigns.length > 0) {
            // Select active campaign or first one
            const activeCampaign = data.campaigns.find((c: Campaign) => c.status === 'active')
            setSelectedCampaignId(activeCampaign?.id || data.campaigns[0].id)
          }
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch campaigns:', error)
        }
      })
    
    return () => controller.abort()
  }, [])

  // Fetch campaign data when selectedCampaignId changes
  useEffect(() => {
    if (!selectedCampaignId) return
    
    const controller = new AbortController()
    
    setLoading(true)
    fetch(`/api/campaigns/${selectedCampaignId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!controller.signal.aborted) {
          setCampaignData(data)
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch campaign data:', error)
          toast.error('Failed to load campaign data')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    
    return () => controller.abort()
  }, [selectedCampaignId])

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const [campaignsRes, campaignDataRes] = await Promise.all([
        fetch('/api/campaigns?includeStats=true'),
        selectedCampaignId ? fetch(`/api/campaigns/${selectedCampaignId}`) : null
      ])
      
      const campaignsData = await campaignsRes.json()
      setCampaigns(campaignsData.campaigns)
      
      if (campaignDataRes) {
        const data = await campaignDataRes.json()
        setCampaignData(data)
      }
      
      toast.success('Data refreshed')
    } catch (e) {
      toast.error('Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
  const selectedClient = clients.find(c => c.id === selectedClientId)

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    active: 'bg-emerald-500',
    paused: 'bg-amber-500',
    completed: 'bg-blue-500',
    archived: 'bg-gray-400',
  }

  const renderSummary = () => {
    if (!campaignData) return null

    const { metrics, channelMetrics, dailyMetrics } = campaignData

    // Transform data for charts
    const channelData = Object.entries(channelMetrics).map(([channel, data]) => ({
      channel,
      registrations: data.registrations || 0,
      spend: (data.spend || 0) / 100000,
    })).filter(c => c.registrations > 0)

    const dailyData = Object.entries(dailyMetrics)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: date.slice(5),
        registrations: data.registrations || 0,
        spend: (data.spend || 0) / 100000,
      }))

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Registrations</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics.totalRegistrations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Target: {selectedCampaign?.targetRegistrations} | {metrics.progress}% achieved
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(metrics.progress, 100)}%` }} />
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Spend (UGX)</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{(metrics.totalSpend / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              Budget: {(selectedCampaign?.budget || 0) / 1000000}M UGX | {metrics.budgetUsed}% used
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(metrics.budgetUsed, 100)}%` }} />
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">CPA (UGX)</span>
              {metrics.cpa <= 10000 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="text-2xl font-bold">{Math.round(metrics.cpa).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Target: ≤10,000 UGX</p>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">CTR / ROAS</span>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics.ctr.toFixed(2)}% / {metrics.roas.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground">Target: ≥3% CTR, ≥2.5x ROAS</p>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Channel Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Channel</th>
                  <th className="text-right py-2">Impressions</th>
                  <th className="text-right py-2">Clicks</th>
                  <th className="text-right py-2">CTR</th>
                  <th className="text-right py-2">Spend (UGX)</th>
                  <th className="text-right py-2">Registrations</th>
                  <th className="text-right py-2">CPA</th>
                </tr>
              </thead>
              <tbody>
                {channelData.sort((a, b) => b.registrations - a.registrations).map(ch => {
                  const data = channelMetrics[ch.channel] || {}
                  const ctr = data.impressions > 0 ? ((data.clicks || 0) / data.impressions * 100).toFixed(2) : '0'
                  const cpa = data.registrations > 0 ? Math.round((data.spend || 0) / data.registrations).toLocaleString() : 'N/A'
                  return (
                    <tr key={ch.channel} className="border-b">
                      <td className="py-3 font-medium">{ch.channel}</td>
                      <td className="text-right">{(data.impressions || 0).toLocaleString()}</td>
                      <td className="text-right">{(data.clicks || 0).toLocaleString()}</td>
                      <td className="text-right">{ctr}%</td>
                      <td className="text-right">{((data.spend || 0) / 1000).toFixed(0)}K</td>
                      <td className="text-right font-semibold">{data.registrations || 0}</td>
                      <td className="text-right">{cpa}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Raw Data */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Data Ingestion</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Channel</th>
                  <th className="text-left py-2">Metric</th>
                  <th className="text-right py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.rawData.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 font-mono text-sm">{new Date(row.date).toISOString().slice(0, 10)}</td>
                    <td className="py-2"><Badge variant="outline">{row.channel}</Badge></td>
                    <td className="py-2 capitalize">{row.metric}</td>
                    <td className="text-right font-mono">{row.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderAssets = () => {
    if (!campaignData) return null

    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Campaign Assets</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Owner</th>
                  <th className="text-left py-2">Version</th>
                  <th className="text-left py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.assets.map((asset: any) => (
                  <tr key={asset.id} className="border-b">
                    <td className="py-3">
                      <a href={asset.driveLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {asset.name}
                      </a>
                    </td>
                    <td className="py-3 capitalize">{asset.type}</td>
                    <td className="py-3">
                      <Badge variant={asset.status === 'approved' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm">{asset.owner}</td>
                    <td className="py-3 font-mono">v{asset.version}</td>
                    <td className="py-3 text-sm">{new Date(asset.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderUTM = () => {
    return (
      <UTMBuilder 
        campaignId={selectedCampaignId}
        campaignName={selectedCampaign?.name || 'campaign'}
        baseUrl={selectedCampaign?.baseUrl || 'https://codeacademyug.org/register'}
      />
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    switch (activeTab) {
      case 'summary':
        return renderSummary()
      case 'health':
        return <HealthWidget campaignId={selectedCampaignId} />
      case 'ai':
        return <AIStrategistTab campaignId={selectedCampaignId} />
      case 'forecast':
        return <ForecastTab campaignId={selectedCampaignId} />
      case 'leads':
        return <LeadsTab campaignId={selectedCampaignId} />
      case 'influencers':
        return <InfluencersTab campaignId={selectedCampaignId} />
      case 'integrations':
        return <IntegrationsTab clientId={selectedClientId} />
      case 'assets':
        return renderAssets()
      case 'utm':
        return renderUTM()
      case 'data':
        return <DataSourcesTab campaignId={selectedCampaignId} onDataAdded={handleRefresh} />
      case 'alerts':
        return (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Alert Settings</h3>
            <pre className="text-sm">{JSON.stringify(campaignData?.alerts, null, 2)}</pre>
          </div>
        )
      case 'scripts':
        return (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Scripts & Templates</h3>
            <p className="text-muted-foreground">Copy-paste scripts for Google Apps Script integration.</p>
          </div>
        )
      case 'docs':
        return (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Documentation</h3>
            <p className="text-muted-foreground">SOP, onboarding, and troubleshooting guides.</p>
          </div>
        )
      default:
        return renderSummary()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Marketing Tracker</h1>
              <p className="text-xs text-muted-foreground">{selectedClient?.name || 'Code Academy Uganda'}</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Client Switcher */}
          <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
            <Select value={selectedClientId || ''} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-48 hidden md:flex">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      {c.name}
                      {c._count && <span className="text-xs text-muted-foreground">({c._count.campaigns})</span>}
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <div 
                  className="px-2 py-1.5 text-sm cursor-pointer hover:bg-muted rounded"
                  onClick={() => setIsNewClientOpen(true)}
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Add Client
                </div>
              </SelectContent>
            </Select>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>Add a new school or organization to manage.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input placeholder="e.g., Makerere Hub" id="client-name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <Input type="color" defaultValue="#10B981" id="client-color" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select defaultValue="UGX">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UGX">UGX</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewClientOpen(false)}>Cancel</Button>
                <Button onClick={async () => {
                  const name = (document.getElementById('client-name') as HTMLInputElement)?.value
                  if (!name) {
                    toast.error('Name is required')
                    return
                  }
                  try {
                    const res = await fetch('/api/clients', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name })
                    })
                    if (res.ok) {
                      toast.success('Client created!')
                      setIsNewClientOpen(false)
                      // Refresh clients list
                      const clientsRes = await fetch('/api/clients?includeStats=true')
                      const clientsData = await clientsRes.json()
                      setClients(clientsData.clients)
                    }
                  } catch (e) {
                    toast.error('Failed to create client')
                  }
                }}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Campaign Selector */}
          <Select value={selectedCampaignId || ''} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColors[c.status]}`} />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>

          <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>Add a new marketing campaign to track.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input placeholder="e.g., Summer Bootcamp 2026" id="campaign-name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" id="campaign-start" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" id="campaign-end" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Budget (UGX)</Label>
                    <Input type="number" placeholder="5000000" id="campaign-budget" />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Registrations</Label>
                    <Input type="number" placeholder="500" id="campaign-target" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Campaign description..." id="campaign-desc" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewCampaignOpen(false)}>Cancel</Button>
                <Button onClick={async () => {
                  const name = (document.getElementById('campaign-name') as HTMLInputElement)?.value
                  const startDate = (document.getElementById('campaign-start') as HTMLInputElement)?.value
                  const endDate = (document.getElementById('campaign-end') as HTMLInputElement)?.value
                  const budget = parseFloat((document.getElementById('campaign-budget') as HTMLInputElement)?.value || '0')
                  const targetRegistrations = parseInt((document.getElementById('campaign-target') as HTMLInputElement)?.value || '0')
                  const description = (document.getElementById('campaign-desc') as HTMLTextAreaElement)?.value

                  if (!name || !startDate || !endDate) {
                    toast.error('Please fill required fields')
                    return
                  }

                  try {
                    const res = await fetch('/api/campaigns', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, startDate, endDate, budget, targetRegistrations, description })
                    })
                    if (res.ok) {
                      toast.success('Campaign created!')
                      setIsNewCampaignOpen(false)
                      // Refresh campaigns list
                      const campaignsRes = await fetch('/api/campaigns?includeStats=true')
                      const campaignsData = await campaignsRes.json()
                      setCampaigns(campaignsData.campaigns)
                    }
                  } catch (e) {
                    toast.error('Failed to create campaign')
                  }
                }}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "w-64 border-r bg-muted/30 transition-all duration-300 flex-shrink-0",
          "md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full absolute md:relative"
        )}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Navigation
              </div>
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'secondary' : 'ghost'}
                  className={cn("w-full justify-start gap-3", activeTab === item.id && "bg-secondary")}
                  onClick={() => { setActiveTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false) }}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            {selectedCampaign && (
              <div className="p-4 space-y-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Campaign Info
                </div>
                <div className="px-2 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Registrations</span>
                    <span className="font-medium">{selectedCampaign.stats?.totalRegistrations || 0} / {selectedCampaign.targetRegistrations}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(selectedCampaign.stats?.progress || 0, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget Used</span>
                    <span className="font-medium">{((selectedCampaign.stats?.totalSpend || 0) / 1000000).toFixed(2)}M / {(selectedCampaign.budget / 1000000).toFixed(0)}M</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-t mt-4">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{selectedClient?.name || 'Code Academy Uganda'}</p>
                <p>© 2026 All rights reserved</p>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <span>Dashboard</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{selectedCampaign?.name || 'Loading...'}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{navItems.find(item => item.id === activeTab)?.label}</span>
            </div>

            {renderContent()}
          </div>

          {/* Footer */}
          <footer className="border-t py-4 px-6 mt-auto bg-muted/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{selectedCampaign?.name || 'No campaign selected'}</span>
                {campaignData?.lastDataSync && (
                  <>
                    <span>•</span>
                    <span>Last sync: {new Date(campaignData.lastDataSync).toLocaleString()}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-foreground">SOP</a>
                <a href="#" className="hover:text-foreground">Support</a>
                <a href="#" className="hover:text-foreground">Contact</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
