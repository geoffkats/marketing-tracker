'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Link2, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink,
  Trash2,
  Sparkles,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface UTMParameter {
  id: string
  channel: string
  source: string
  medium: string
  campaign?: string
  content: string
  term?: string | null
  finalUrl: string
  utmUrl: string
  createdBy: string
  createdAt: string
  clickCount?: number
}

const channelOptions = [
  { value: 'FB', label: 'Facebook', defaultSource: 'facebook', defaultMedium: 'paid_social' },
  { value: 'IG', label: 'Instagram', defaultSource: 'instagram', defaultMedium: 'paid_social' },
  { value: 'TT', label: 'TikTok', defaultSource: 'tiktok', defaultMedium: 'paid_social' },
  { value: 'Google', label: 'Google Ads', defaultSource: 'google', defaultMedium: 'cpc' },
  { value: 'Email', label: 'Email', defaultSource: 'email', defaultMedium: 'email' },
  { value: 'SMS', label: 'SMS', defaultSource: 'sms', defaultMedium: 'sms' },
  { value: 'LinkedIn', label: 'LinkedIn', defaultSource: 'linkedin', defaultMedium: 'paid_social' },
]

interface UTMBuilderProps {
  campaignId: string | null
  campaignName?: string
  baseUrl?: string
}

export function UTMBuilder({ campaignId, campaignName = 'campaign', baseUrl = 'https://codeacademyug.org/register' }: UTMBuilderProps) {
  const [utmLinks, setUtmLinks] = useState<UTMParameter[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    channel: 'FB',
    source: 'facebook',
    medium: 'paid_social',
    content: '',
    term: '',
    finalUrl: baseUrl,
  })

  // Fetch UTM links from database
  const fetchUTMLinks = useCallback(async () => {
    if (!campaignId) {
      setUtmLinks([])
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`/api/utm?campaignId=${campaignId}`)
      const data = await res.json()
      if (res.ok) {
        setUtmLinks(data.utmLinks || [])
      } else {
        console.error('Failed to fetch UTM links:', data.error)
      }
    } catch (error) {
      console.error('Error fetching UTM links:', error)
      toast.error('Failed to load UTM links')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchUTMLinks()
  }, [fetchUTMLinks])

  // Update finalUrl when baseUrl prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, finalUrl: baseUrl }))
  }, [baseUrl])

  const handleChannelChange = (channel: string) => {
    const option = channelOptions.find(c => c.value === channel)
    if (option) {
      setFormData({
        ...formData,
        channel,
        source: option.defaultSource,
        medium: option.defaultMedium,
      })
    }
  }

  const generateUTMUrl = () => {
    const params = new URLSearchParams({
      utm_source: formData.source,
      utm_medium: formData.medium,
      utm_campaign: campaignName.replace(/\s+/g, ''),
      utm_content: formData.content,
    })
    if (formData.term) {
      params.append('utm_term', formData.term)
    }
    return `${formData.finalUrl}?${params.toString()}`
  }

  const handleAddUTM = async () => {
    if (!formData.content) {
      toast.error('Content is required')
      return
    }
    
    if (!campaignId) {
      toast.error('Please select a campaign first')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/utm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          channel: formData.channel,
          source: formData.source,
          medium: formData.medium,
          content: formData.content,
          term: formData.term || null,
          finalUrl: formData.finalUrl,
          utmUrl: generateUTMUrl(),
          createdBy: 'user@codeacademyug.org',
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('UTM link created successfully!')
        setUtmLinks(prev => [data.utmLink, ...prev])
        setFormData({
          ...formData,
          content: '',
          term: '',
        })
      } else {
        toast.error(data.error || 'Failed to create UTM link')
      }
    } catch (error) {
      console.error('Error creating UTM link:', error)
      toast.error('Failed to create UTM link')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUTM = async (id: string) => {
    try {
      const res = await fetch(`/api/utm?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('UTM link deleted')
        setUtmLinks(prev => prev.filter(link => link.id !== id))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete UTM link')
      }
    } catch (error) {
      console.error('Error deleting UTM link:', error)
      toast.error('Failed to delete UTM link')
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('URL copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const channelColors: Record<string, string> = {
    FB: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    IG: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    TT: 'bg-gray-900 text-white',
    Google: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Email: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    SMS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    LinkedIn: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  }

  return (
    <div className="space-y-6">
      {/* UTM Builder Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            UTM Link Generator
          </CardTitle>
          <CardDescription>
            Create trackable URLs for each marketing channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Channel Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {channelOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={formData.channel === option.value ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => handleChannelChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source (utm_source)</Label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., facebook, google"
                />
              </div>
              <div className="space-y-2">
                <Label>Medium (utm_medium)</Label>
                <Input
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  placeholder="e.g., paid_social, cpc, email"
                />
              </div>
              <div className="space-y-2">
                <Label>Content (utm_content) *</Label>
                <Input
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="e.g., hero_banner_18-25"
                />
              </div>
              <div className="space-y-2">
                <Label>Term (utm_term) - Optional</Label>
                <Input
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  placeholder="e.g., coding_bootcamp"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Final URL</Label>
                <Input
                  value={formData.finalUrl}
                  onChange={(e) => setFormData({ ...formData, finalUrl: e.target.value })}
                  placeholder="https://codeacademyug.org/register"
                />
              </div>
            </div>

            {/* Generated URL Preview */}
            <div className="space-y-2">
              <Label>Generated UTM URL</Label>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm break-all">{generateUTMUrl()}</code>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddUTM} disabled={saving || !campaignId}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generate & Save URL
              </Button>
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(generateUTMUrl(), 'preview')}
              >
                {copiedId === 'preview' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy URL
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UTM Parameters Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Generated UTM Links ({utmLinks.length})
          </CardTitle>
          <CardDescription>
            All trackable URLs created for this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : utmLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No UTM links yet. Create your first one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>UTM URL</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utmLinks.map((utm) => (
                    <TableRow key={utm.id}>
                      <TableCell>
                        <Badge className={channelColors[utm.channel] || ''}>
                          {utm.channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{utm.source}</TableCell>
                      <TableCell className="text-sm">{utm.medium}</TableCell>
                      <TableCell className="text-sm max-w-32 truncate" title={utm.content}>
                        {utm.content}
                      </TableCell>
                      <TableCell>{utm.clickCount || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-48">
                          <code className="text-xs truncate flex-1">{utm.utmUrl}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(utm.utmUrl, utm.id)}
                          >
                            {copiedId === utm.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(utm.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(utm.utmUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUTM(utm.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Export Template */}
      <Card>
        <CardHeader>
          <CardTitle>UTM Parameters CSV Template</CardTitle>
          <CardDescription>
            Copy this template for bulk import into Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`UTM ID,Channel,Source,Medium,Campaign,Content,Term,Final URL,UTM URL,Created By,Created Date
UTM-001,FB,facebook,paid_social,${campaignName.replace(/\s+/g, '')},hero_banner_18-25,,${baseUrl},${baseUrl}?utm_source=facebook&utm_medium=paid_social&utm_campaign=${campaignName.replace(/\s+/g, '')}&utm_content=hero_banner_18-25,marketing@codeacademyug.org,${new Date().toISOString().slice(0, 10)}`}
          </pre>
        </CardContent>
      </Card>

      {/* Sample UTM URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Sample UTM URLs by Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelOptions.slice(0, 5).map((opt) => (
              <div key={opt.value} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={channelColors[opt.value]}>{opt.value}</Badge>
                  <span className="font-medium">{opt.label}</span>
                </div>
                <code className="text-xs break-all">
                  {baseUrl}?utm_source={opt.defaultSource}&utm_medium={opt.defaultMedium}&utm_campaign={campaignName.replace(/\s+/g, '')}&utm_content=ad_name_here
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
