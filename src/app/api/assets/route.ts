import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/assets - List assets (optionally filtered by campaign)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const assets = await db.asset.findMany({
      where: {
        ...(campaignId && { campaignId }),
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
      },
      include: {
        campaign: { select: { name: true, slug: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const asset = await db.asset.create({
      data: {
        campaignId: body.campaignId,
        type: body.type,
        name: body.name,
        fileName: body.fileName,
        driveLink: body.driveLink,
        thumbnailUrl: body.thumbnailUrl,
        owner: body.owner,
        version: body.version || '1.0',
        status: body.status || 'draft',
        description: body.description,
        tags: body.tags,
      }
    })

    // Log audit
    await db.auditLog.create({
      data: {
        campaignId: body.campaignId,
        action: 'create',
        entityType: 'asset',
        entityId: asset.id,
        details: JSON.stringify({ name: body.name, type: body.type }),
        userEmail: body.owner || 'system',
      }
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
