'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { useCampaignStore, type Asset } from '@/store/campaign-store'
import { 
  FolderTree, 
  Upload, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const assetTypeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  copy: <FileText className="h-4 w-4" />,
  pdf: <File className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  other: <File className="h-4 w-4" />,
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-amber-100 text-amber-800',
}

export function AssetsManager() {
  const { assets, addAsset, updateAsset, deleteAsset } = useCampaignStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    type: 'image',
    status: 'draft',
  })

  const handleAddAsset = () => {
    const id = `AST-${String(assets.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString().slice(0, 10)
    addAsset({
      id,
      type: newAsset.type as Asset['type'],
      fileName: newAsset.fileName || '',
      driveLink: newAsset.driveLink || '',
      owner: newAsset.owner || '',
      version: newAsset.version || '1.0',
      createdDate: now,
      lastUpdated: now,
      status: newAsset.status as Asset['status'],
    })
    setIsAddDialogOpen(false)
    setNewAsset({ type: 'image', status: 'draft' })
  }

  // Google Drive folder structure
  const folderStructure = [
    { name: 'May Code Camp Marketing', type: 'folder', level: 0 },
    { name: '0_Assets', type: 'folder', level: 1 },
    { name: 'Images/', type: 'folder', level: 2 },
    { name: 'Videos/', type: 'folder', level: 2 },
    { name: 'Copy/', type: 'folder', level: 2 },
    { name: 'Contracts/', type: 'folder', level: 2 },
    { name: '1_UTM Links', type: 'folder', level: 1 },
    { name: '2_Reporting', type: 'folder', level: 1 },
    { name: '3_Archive', type: 'folder', level: 1 },
  ]

  return (
    <div className="space-y-6">
      {/* Folder Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Google Drive Folder Structure
          </CardTitle>
          <CardDescription>
            Organized folder hierarchy for all campaign assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
            {folderStructure.map((item, index) => (
              <div 
                key={index} 
                style={{ paddingLeft: `${item.level * 24}px` }}
                className="py-1 flex items-center gap-2"
              >
                <FolderTree className="h-4 w-4 text-amber-500" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Access Permissions</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>Owner:</strong> marketing-manager@codeacademyug.org (full edit)</li>
              <li>• <strong>Editors:</strong> marketing-team@codeacademyug.org (edit all)</li>
              <li>• <strong>Viewers:</strong> leadership@codeacademyug.org (view-only)</li>
              <li>• <strong>Commenters:</strong> external agency email (comment on Assets)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Asset Registry</CardTitle>
            <CardDescription>
              Master list of all creative assets stored in Google Drive
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Register a new creative asset in the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Type</Label>
                  <Select 
                    value={newAsset.type} 
                    onValueChange={(v) => setNewAsset({ ...newAsset, type: v as Asset['type'] })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="copy">Copy</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">File Name</Label>
                  <Input 
                    className="col-span-3" 
                    value={newAsset.fileName || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, fileName: e.target.value })}
                    placeholder="MayCodeCamp_Hero_Banner_v1.png"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Drive Link</Label>
                  <Input 
                    className="col-span-3" 
                    value={newAsset.driveLink || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, driveLink: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Owner</Label>
                  <Input 
                    className="col-span-3" 
                    value={newAsset.owner || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, owner: e.target.value })}
                    placeholder="email@codeacademyug.org"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Version</Label>
                  <Input 
                    className="col-span-3" 
                    value={newAsset.version || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, version: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <Select 
                    value={newAsset.status} 
                    onValueChange={(v) => setNewAsset({ ...newAsset, status: v as Asset['status'] })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAsset}>Add Asset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono text-sm">{asset.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {assetTypeIcons[asset.type]}
                      <span className="capitalize">{asset.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={asset.driveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {asset.fileName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-sm">{asset.owner}</TableCell>
                  <TableCell className="font-mono">v{asset.version}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[asset.status]}>
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{asset.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(asset.driveLink, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in Drive
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteAsset(asset.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CSV Export Template */}
      <Card>
        <CardHeader>
          <CardTitle>Assets CSV Template</CardTitle>
          <CardDescription>
            Copy this template for bulk import into Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`Asset ID,Type,File Name,Drive Link,Owner,Version,Created Date,Last Updated,Status
AST-001,image,MayCodeCamp_Hero_Banner_v2.png,https://drive.google.com/file/d/abc,marketing@codeacademyug.org,2.0,2026-04-15,2026-04-20,approved
AST-002,video,MayCodeCamp_Promo_30s.mp4,https://drive.google.com/file/d/def,creative@codeacademyug.org,1.0,2026-04-18,2026-04-18,approved
AST-003,copy,Email_Sequence_Week1.docx,https://drive.google.com/file/d/ghi,content@codeacademyug.org,1.5,2026-04-10,2026-04-22,approved`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
