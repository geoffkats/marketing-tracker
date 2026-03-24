'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users, AlertTriangle, CheckCircle2, MessageSquare, Mail, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface LeadsTabProps {
  campaignId: string | null
}

export function LeadsTab({ campaignId }: LeadsTabProps) {
  const [leads, setLeads] = useState<any[]>([])
  const [allLeads, setAllLeads] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [followUpContent, setFollowUpContent] = useState<any>(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (campaignId) {
      setLoading(true)
      // Fetch leads needing follow-up
      fetch(`/api/leads?campaignId=${campaignId}&needsFollowUp=true`)
        .then(res => res.json())
        .then(data => {
          setLeads(data.leads)
          setStats(data.stats)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
      
      // Fetch all leads for stats
      fetch(`/api/leads?campaignId=${campaignId}`)
        .then(res => res.json())
        .then(data => setAllLeads(data.leads))
        .catch(console.error)
    }
  }, [campaignId])

  const generateFollowUp = async (leadId: string, type: 'sms' | 'email') => {
    if (!campaignId) return
    
    setGenerating(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, type })
      })
      const data = await res.json()
      
      if (data.success) {
        setFollowUpContent(data.content)
        setShowFollowUp(true)
        toast.success(`${type.toUpperCase()} draft generated!`)
      }
    } catch (e) {
      toast.error('Failed to generate follow-up')
    } finally {
      setGenerating(false)
    }
  }

  const formatDaysAgo = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    return `${days} day${days !== 1 ? 's' : ''} ago`
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.paid || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Followed Up</p>
            <p className="text-2xl font-bold">{stats.followed_up || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Converted</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.converted || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Lost</p>
            <p className="text-2xl font-bold text-red-600">{stats.lost || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Needing Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Leads Needing Follow-up
          </CardTitle>
          <CardDescription>
            These leads registered but haven't paid and haven't been contacted in 48+ hours. 
            Click SMS or Email to generate a personalized AI-crafted message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length > 0 ? (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{lead.name}</p>
                        <Badge variant="secondary">
                          {formatDaysAgo(lead.registeredAt)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lead.email && <span>{lead.email}</span>}
                        {lead.email && lead.phone && <span> • </span>}
                        {lead.phone && <span>{lead.phone}</span>}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {lead.channel && (
                          <Badge variant="outline">{lead.channel}</Badge>
                        )}
                        {lead.contactCount > 0 && (
                          <Badge variant="secondary">{lead.contactCount} contacts</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedLead(lead)
                          generateFollowUp(lead.id, 'sms')
                        }}
                        disabled={generating}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        SMS Draft
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead)
                          generateFollowUp(lead.id, 'email')
                        }}
                        disabled={generating}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email Draft
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground">No leads currently need follow-up.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-up Dialog */}
      <Dialog open={showFollowUp} onOpenChange={setShowFollowUp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generated Follow-up Message</DialogTitle>
            <DialogDescription>
              AI-generated message for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          
          {followUpContent && (
            <div className="space-y-4">
              {followUpContent.subject && (
                <div>
                  <p className="text-sm font-medium mb-1">Subject:</p>
                  <p className="text-sm bg-muted p-2 rounded">{followUpContent.subject}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-1">Message:</p>
                <div className="bg-muted p-3 rounded whitespace-pre-wrap text-sm">
                  {followUpContent.message}
                </div>
              </div>
              {followUpContent.callToAction && (
                <div className="p-3 bg-primary/10 rounded-lg border">
                  <p className="text-sm font-medium">Call to Action:</p>
                  <p className="text-sm">{followUpContent.callToAction}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowFollowUp(false)}>
                  Close
                </Button>
                <Button className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Copy & Send
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automated Lead Nurture</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>⏰ Automatically flags leads pending &gt;48 hours without contact</p>
          <p>🤖 AI generates personalized SMS and email follow-ups</p>
          <p>📝 Messages include: greeting, reminder, urgency, and CTA</p>
          <p>📊 Tracks contact attempts and lead status changes</p>
        </CardContent>
      </Card>
    </div>
  )
}
