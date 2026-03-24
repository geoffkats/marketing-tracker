'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Star, Plus, Loader2, DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { toast } from 'sonner'

interface InfluencersTabProps {
  campaignId: string | null
}

export function InfluencersTab({ campaignId }: InfluencersTabProps) {
  const [influencers, setInfluencers] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newInf, setNewInf] = useState({
    name: '',
    platform: 'Instagram',
    handle: '',
    followerCount: 0,
    contractFee: 0,
  })

  useEffect(() => {
    if (!campaignId) return
    
    let cancelled = false
    const loadInfluencers = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/influencers?campaignId=${campaignId}`)
        const data = await res.json()
        if (!cancelled) {
          setInfluencers(data.influencers)
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
    loadInfluencers()
    
    return () => { cancelled = true }
  }, [campaignId])

  const handleAdd = async () => {
    if (!campaignId || !newInf.name || !newInf.handle) {
      toast.error('Please fill required fields')
      return
    }

    try {
      const res = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, ...newInf })
      })
      if (res.ok) {
        toast.success('Influencer added!')
        setIsAddOpen(false)
        setNewInf({ name: '', platform: 'Instagram', handle: '', followerCount: 0, contractFee: 0 })
        // Refresh list
        const data = await (await fetch(`/api/influencers?campaignId=${campaignId}`)).json()
        setInfluencers(data.influencers)
        setSummary(data.summary)
      }
    } catch (e) {
      toast.error('Failed to add influencer')
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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">{(summary.totalSpent / 1000000).toFixed(2)}M UGX</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Registrations</p>
            <p className="text-2xl font-bold">{summary.totalRegistrations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg CPS</p>
            <p className="text-2xl font-bold">{summary.avgCPS?.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Cost Per Student</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{(summary.totalRevenue / 1000000).toFixed(2)}M</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overall ROI</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${parseFloat(summary.overallROI) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {parseFloat(summary.overallROI) >= 0 ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
              {summary.overallROI}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scorecard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Influencer ROI Scorecard
            </CardTitle>
            <CardDescription>
              Performance ranking based on CPS, ROI, engagement, and conversion
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Influencer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Influencer</DialogTitle>
                <DialogDescription>Register a new influencer partner</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={newInf.name}
                    onChange={e => setNewInf({ ...newInf, name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform *</Label>
                    <Select value={newInf.platform} onValueChange={v => setNewInf({ ...newInf, platform: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="TikTok">TikTok</SelectItem>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                        <SelectItem value="Twitter">Twitter/X</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Handle *</Label>
                    <Input 
                      value={newInf.handle}
                      onChange={e => setNewInf({ ...newInf, handle: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Followers</Label>
                    <Input 
                      type="number"
                      value={newInf.followerCount}
                      onChange={e => setNewInf({ ...newInf, followerCount: parseInt(e.target.value) || 0 })}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Fee (UGX) *</Label>
                    <Input 
                      type="number"
                      value={newInf.contractFee}
                      onChange={e => setNewInf({ ...newInf, contractFee: parseInt(e.target.value) || 0 })}
                      placeholder="500000"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {influencers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">#</th>
                    <th className="text-left py-3 px-2">Influencer</th>
                    <th className="text-left py-3 px-2">Platform</th>
                    <th className="text-right py-3 px-2">Fee</th>
                    <th className="text-right py-3 px-2">Reg.</th>
                    <th className="text-right py-3 px-2">CPS</th>
                    <th className="text-right py-3 px-2">ROI</th>
                    <th className="text-right py-3 px-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map((inf, i) => (
                    <tr key={inf.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-800' :
                          i === 1 ? 'bg-gray-200 text-gray-800' :
                          i === 2 ? 'bg-amber-200 text-amber-900' :
                          'bg-muted'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{inf.name}</p>
                          <p className="text-xs text-muted-foreground">{inf.handle}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{inf.platform}</Badge>
                      </td>
                      <td className="text-right py-3 px-2 font-mono">{(inf.contractFee / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-2 font-semibold">{inf.registrations}</td>
                      <td className="text-right py-3 px-2">
                        <span className={`font-mono ${inf.cps < 10000 ? 'text-emerald-600' : inf.cps < 20000 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.round(inf.cps).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={`font-semibold flex items-center justify-end gap-1 ${inf.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {inf.roi >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {Math.abs(inf.roi).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Progress value={inf.performanceScore} className="w-16 h-2" />
                          <span className="text-sm font-mono w-8 text-right">{inf.performanceScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No influencers yet</p>
              <p className="text-muted-foreground mb-4">Add your first influencer to track ROI</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Influencer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CPS Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Per Student (CPS) Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span>&lt; 10,000 UGX = Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span>10,000 - 20,000 = Good</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span>&gt; 20,000 UGX = Needs Review</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
