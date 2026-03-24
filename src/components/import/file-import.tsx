'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Facebook,
  X,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface ImportResult {
  success: boolean
  imported: number
  platform: string
  summary: {
    totalRows: number
    dateRange: { start: string; end: string }
    channels: string[]
    metrics: string[]
  }
  errors?: string[]
}

interface FileImportProps {
  campaignId: string
  onImportComplete: () => void
}

export function FileImport({ campaignId, onImportComplete }: FileImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await uploadFile(files[0])
    }
  }, [campaignId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await uploadFile(files[0])
    }
  }

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setIsUploading(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('campaignId', campaignId)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setImportResult(result)
        setShowResult(true)
        toast.success(`Imported ${result.imported} records from ${result.platform}`)
        onImportComplete()
      } else {
        toast.error(result.error || 'Import failed')
        if (result.details) {
          console.error('Import errors:', result.details)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const platformIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="h-5 w-5" />,
    tiktok: <span className="text-lg">🎵</span>,
    google: <span className="text-lg">🔍</span>,
    linkedin: <span className="text-lg">💼</span>,
    generic: <FileSpreadsheet className="h-5 w-5" />,
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Marketing Data
          </CardTitle>
          <CardDescription>
            Upload CSV exports from Facebook, TikTok, Google Ads, LinkedIn, or any platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Drop CSV file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports Facebook, TikTok, Google Ads, LinkedIn exports
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Supported Platforms */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Supported platforms:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(platformIcons).map(([platform, icon]) => (
                <Badge key={platform} variant="outline" className="gap-1 capitalize">
                  {icon}
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* Export Templates */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Need a template?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('facebook')}>
                <Download className="h-3 w-3 mr-1" />
                Facebook Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('generic')}>
                <Download className="h-3 w-3 mr-1" />
                Generic Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Import Successful
            </DialogTitle>
            <DialogDescription>
              Your data has been imported and processed
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Platform</p>
                  <p className="font-medium capitalize flex items-center gap-2">
                    {platformIcons[importResult.platform]}
                    {importResult.platform}
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Records Imported</p>
                  <p className="font-medium text-xl">{importResult.imported}</p>
                </div>
              </div>

              {/* Date Range */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Date Range</p>
                <p className="font-medium">
                  {importResult.summary.dateRange.start} to {importResult.summary.dateRange.end}
                </p>
              </div>

              {/* Channels */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Channels</p>
                <div className="flex flex-wrap gap-1">
                  {importResult.summary.channels.map(ch => (
                    <Badge key={ch} variant="secondary">{ch}</Badge>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Metrics Imported</p>
                <div className="flex flex-wrap gap-1">
                  {importResult.summary.metrics.map(m => (
                    <Badge key={m} variant="outline" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {importResult.errors.length} rows had issues
                  </p>
                  <details className="mt-2">
                    <summary className="text-xs text-amber-700 dark:text-amber-300 cursor-pointer">
                      View details
                    </summary>
                    <ul className="text-xs mt-2 space-y-1 text-amber-700 dark:text-amber-300">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function downloadTemplate(type: 'facebook' | 'generic') {
  let csv = ''
  
  if (type === 'facebook') {
    csv = `Reporting starts,Campaign name,Ad set name,Ad name,Impressions,Link clicks,Amount spent (USD),Results,Reach,CTR (link click-through rate)
2024-05-01,May Code Camp 2026,18-25 Audience,Hero Banner A,45000,1200,65.50,45,38000,2.67
2024-05-02,May Code Camp 2026,25-35 Audience,Video Ad B,52000,1450,72.30,58,41000,2.79`
  } else {
    csv = `Date,Channel,Impressions,Clicks,Spend,Registrations,Campaign
2024-05-01,FB,45000,1200,250000,45,May Code Camp
2024-05-01,IG,32000,890,180000,32,May Code Camp
2024-05-02,TT,78000,2100,150000,72,May Code Camp`
  }

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${type}_template.csv`
  a.click()
  URL.revokeObjectURL(url)
}
