'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Link2,
  Unlink,
  FileSpreadsheet,
  Mail,
  HardDrive,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface IntegrationsTabProps {
  clientId: string | null
}

export function IntegrationsTab({ clientId }: IntegrationsTabProps) {
  const [integrations, setIntegrations] = useState<any>({})
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [isConnectOpen, setIsConnectOpen] = useState(false)
  const [connectType, setConnectType] = useState<'sheets' | 'gmail' | 'drive'>('sheets')
  const [connectConfig, setConnectConfig] = useState({
    spreadsheetId: '',
    sheetName: 'Registrations',
    syncFrequency: 60,
  })

  // Load integrations on mount or when clientId changes
  useEffect(() => {
    if (!clientId) return
    
    let cancelled = false
    
    const loadIntegrations = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/integrations?clientId=${clientId}`)
        const data = await res.json()
        if (!cancelled) {
          setIntegrations(data.grouped)
          setSummary(data.summary)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    loadIntegrations()
    
    return () => { cancelled = true }
  }, [clientId])
  
  // Function to reload integrations after actions
  const reloadIntegrations = async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/integrations?clientId=${clientId}`)
      const data = await res.json()
      setIntegrations(data.grouped)
      setSummary(data.summary)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!clientId) return

    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          type: connectType,
          ...connectConfig,
        })
      })
      
      if (res.ok) {
        toast.success(`${connectType.charAt(0).toUpperCase() + connectType.slice(1)} connected!`)
        setIsConnectOpen(false)
        reloadIntegrations()
      }
    } catch (e) {
      toast.error('Failed to connect')
    }
  }

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    try {
      const res = await fetch('/api/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, action: 'sync' })
      })
      const data = await res.json()
      
      if (data.recordsSynced) {
        toast.success(`Synced ${data.recordsSynced} records`)
        reloadIntegrations()
      }
    } catch (e) {
      toast.error('Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, action: 'disconnect' })
      })
      
      if (res.ok) {
        toast.success('Disconnected')
        reloadIntegrations()
      }
    } catch (e) {
      toast.error('Failed to disconnect')
    }
  }

  const integrationCards = [
    {
      type: 'sheets',
      title: 'Google Sheets',
      description: 'Sync registrations in real-time from a live spreadsheet',
      icon: <FileSpreadsheet className="h-8 w-8" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    },
    {
      type: 'gmail',
      title: 'Gmail Automation',
      description: 'Set up automated follow-ups for students who haven\'t paid',
      icon: <Mail className="h-8 w-8" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      type: 'drive',
      title: 'Google Drive',
      description: 'Automatically store generated admission letters and documents',
      icon: <HardDrive className="h-8 w-8" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    },
  ]

  const statusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</Badge>
      case 'syncing':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Syncing</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Error</Badge>
      default:
        return <Badge variant="secondary"><Unlink className="h-3 w-3 mr-1" /> Disconnected</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Integrations</p>
            <p className="text-2xl font-bold">{summary.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Connected</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.connected || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Disconnected</p>
            <p className="text-2xl font-bold">{summary.disconnected || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Errors</p>
            <p className="text-2xl font-bold text-red-600">{summary.error || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrationCards.map((card) => {
          const integration = integrations[card.type]
          const isSyncingThis = syncing === integration?.id

          return (
            <Card key={card.type} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <div className={card.color}>{card.icon}</div>
                  </div>
                  {integration && statusBadge(integration.status)}
                </div>
                <CardTitle className="text-lg mt-3">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {integration ? (
                  <div className="space-y-3">
                    {integration.spreadsheetId && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Sheet: </span>
                        <code className="text-xs bg-muted px-1 rounded">{integration.spreadsheetId.slice(0, 20)}...</code>
                      </div>
                    )}
                    {integration.lastSync && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Last sync: </span>
                        {new Date(integration.lastSync).toLocaleString()}
                      </div>
                    )}
                    {integration.totalSynced > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total synced: </span>
                        {integration.totalSynced} records
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleSync(integration.id)}
                        disabled={isSyncingThis}
                      >
                        {isSyncingThis ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Sync
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full mt-2"
                    onClick={() => {
                      setConnectType(card.type as any)
                      setIsConnectOpen(true)
                    }}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">1</div>
              <div>
                <p className="font-medium">Google Sheets</p>
                <p className="text-sm text-muted-foreground">
                  Create a Google Sheet with registration data. Share it with the service account. Enter the Sheet ID to sync.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm">2</div>
              <div>
                <p className="font-medium">Gmail</p>
                <p className="text-sm text-muted-foreground">
                  Authorize Gmail access to enable automated follow-up emails. Templates can be customized per campaign.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">3</div>
              <div>
                <p className="font-medium">Google Drive</p>
                <p className="text-sm text-muted-foreground">
                  Connect a Drive folder for automatic document storage. Admission letters and reports will be saved automatically.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect Dialog */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {connectType.charAt(0).toUpperCase() + connectType.slice(1)}</DialogTitle>
            <DialogDescription>
              Enter your {connectType} configuration details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {connectType === 'sheets' && (
              <>
                <div className="space-y-2">
                  <Label>Spreadsheet ID</Label>
                  <Input 
                    value={connectConfig.spreadsheetId}
                    onChange={e => setConnectConfig({ ...connectConfig, spreadsheetId: e.target.value })}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                  <p className="text-xs text-muted-foreground">Found in the URL: docs.google.com/spreadsheets/d/[ID]/edit</p>
                </div>
                <div className="space-y-2">
                  <Label>Sheet Name</Label>
                  <Input 
                    value={connectConfig.sheetName}
                    onChange={e => setConnectConfig({ ...connectConfig, sheetName: e.target.value })}
                    placeholder="Registrations"
                  />
                </div>
              </>
            )}
            
            {connectType === 'gmail' && (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Gmail Integration</p>
                <p>Click Connect to authorize Gmail access. You'll be redirected to Google to grant permissions.</p>
              </div>
            )}
            
            {connectType === 'drive' && (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Drive Integration</p>
                <p>Click Connect to authorize Drive access. Documents will be saved to a dedicated folder.</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Sync Frequency (minutes)</Label>
              <Input 
                type="number"
                value={connectConfig.syncFrequency}
                onChange={e => setConnectConfig({ ...connectConfig, syncFrequency: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectOpen(false)}>Cancel</Button>
            <Button onClick={handleConnect}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
