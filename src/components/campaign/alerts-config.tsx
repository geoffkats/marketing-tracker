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
import { useCampaignStore, type AlertSetting } from '@/store/campaign-store'
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  Mail,
  Slack,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

export function AlertsConfig() {
  const { alertSettings, alertLogs, addAlertSetting, updateAlertSetting, deleteAlertSetting, kpis } = useCampaignStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState<Partial<AlertSetting>>({
    direction: 'above',
    active: true,
    recipientEmails: [],
  })
  const [emailInput, setEmailInput] = useState('')

  const handleAddAlert = () => {
    if (!newAlert.metric || !newAlert.threshold) {
      toast.error('Please fill all required fields')
      return
    }
    
    const id = `ALT-${String(alertSettings.length + 1).padStart(3, '0')}`
    addAlertSetting({
      id,
      metric: newAlert.metric,
      threshold: newAlert.threshold,
      direction: newAlert.direction as 'above' | 'below',
      recipientEmails: newAlert.recipientEmails || [],
      slackChannel: newAlert.slackChannel,
      active: true,
    })
    
    toast.success('Alert created successfully!')
    setIsAddDialogOpen(false)
    setNewAlert({ direction: 'above', active: true, recipientEmails: [] })
  }

  const addEmail = () => {
    if (emailInput && !newAlert.recipientEmails?.includes(emailInput)) {
      setNewAlert({
        ...newAlert,
        recipientEmails: [...(newAlert.recipientEmails || []), emailInput],
      })
      setEmailInput('')
    }
  }

  const removeEmail = (email: string) => {
    setNewAlert({
      ...newAlert,
      recipientEmails: newAlert.recipientEmails?.filter(e => e !== email),
    })
  }

  const toggleAlert = (id: string, active: boolean) => {
    updateAlertSetting(id, { active })
    toast.success(`Alert ${active ? 'enabled' : 'disabled'}`)
  }

  // Sample alert logs
  const sampleLogs = [
    { id: 'LOG-001', timestamp: '2026-05-03 14:30:00', metric: 'CPA (UGX)', value: 11500, threshold: 10000, recipients: ['marketing@codeacademyug.org'] },
    { id: 'LOG-002', timestamp: '2026-05-03 09:15:00', metric: 'CTR (%)', value: 1.8, threshold: 2.0, recipients: ['marketing@codeacademyug.org', 'manager@codeacademyug.org'] },
  ]

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{alertSettings.filter(a => a.active).length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Triggered Today</p>
                <p className="text-2xl font-bold text-amber-600">{sampleLogs.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold">{sampleLogs.reduce((sum, l) => sum + l.recipients.length, 0)}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Alert Configuration
            </CardTitle>
            <CardDescription>
              Set up automatic alerts when KPIs exceed thresholds
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Configure when and how to receive notifications
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Metric to Monitor</Label>
                  <Select 
                    value={newAlert.metric} 
                    onValueChange={(v) => setNewAlert({ ...newAlert, metric: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {kpis.map((kpi) => (
                        <SelectItem key={kpi.metric} value={kpi.metric}>
                          {kpi.metric} (Current: {kpi.current})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Threshold</Label>
                    <Input 
                      type="number"
                      value={newAlert.threshold || ''}
                      onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                      placeholder="e.g., 10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger When</Label>
                    <Select 
                      value={newAlert.direction} 
                      onValueChange={(v) => setNewAlert({ ...newAlert, direction: v as 'above' | 'below' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above Threshold</SelectItem>
                        <SelectItem value="below">Below Threshold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Recipient Emails</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="email@example.com"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                    />
                    <Button type="button" variant="outline" onClick={addEmail}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newAlert.recipientEmails?.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button onClick={() => removeEmail(email)} className="ml-1 hover:text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slack Channel (Optional)</Label>
                  <Input 
                    value={newAlert.slackChannel || ''}
                    onChange={(e) => setNewAlert({ ...newAlert, slackChannel: e.target.value })}
                    placeholder="#marketing-alerts"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAlert}>Create Alert</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert ID</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Slack</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertSettings.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-mono text-sm">{alert.id}</TableCell>
                  <TableCell className="font-medium">{alert.metric}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {alert.direction === 'above' ? '>' : '<'} {alert.threshold.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {alert.recipientEmails.slice(0, 2).map((email) => (
                        <Badge key={email} variant="secondary" className="text-xs">
                          {email.split('@')[0]}
                        </Badge>
                      ))}
                      {alert.recipientEmails.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{alert.recipientEmails.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {alert.slackChannel ? (
                      <Badge variant="outline" className="gap-1">
                        <Slack className="h-3 w-3" />
                        {alert.slackChannel}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={alert.active}
                      onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAlertSetting(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Alert History
          </CardTitle>
          <CardDescription>
            Recent triggered alerts and notifications sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Recipients Notified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.metric}</TableCell>
                  <TableCell>
                    <Badge className="bg-amber-100 text-amber-800">
                      {log.value.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.threshold.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {log.recipients.map((email) => (
                        <Badge key={email} variant="secondary" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Settings CSV Template */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Settings CSV Template</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`Metric,Threshold,Direction,Recipient Emails,Slack Channel
CPA (UGX),10000,above,marketing@codeacademyug.org,manager@codeacademyug.org,
Total Registrations,400,below,marketing@codeacademyug.org,
CTR (%),2.0,below,marketing@codeacademyug.org,#marketing-alerts`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
