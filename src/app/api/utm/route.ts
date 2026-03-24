import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDatabaseInitialized } from '@/lib/db-init'

// GET /api/utm - Get all UTM links for a campaign
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()
    
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      // Return all UTM links if no campaign specified
      const utmLinks = await db.uTMLink.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ utmLinks })
    }

    const utmLinks = await db.uTMLink.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ utmLinks })
  } catch (error) {
    console.error('Error fetching UTM links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch UTM links', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/utm - Create new UTM link
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()
    
    const body = await request.json()
    const { campaignId, channel, source, medium, content, term, finalUrl, utmUrl, createdBy } = body

    if (!campaignId || !channel || !source || !medium || !content || !finalUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const utmLink = await db.uTMLink.create({
      data: {
        campaignId,
        channel,
        source,
        medium,
        content,
        term: term || null,
        finalUrl,
        utmUrl: utmUrl || finalUrl,
        createdBy: createdBy || 'system',
      }
    })

    return NextResponse.json({ utmLink }, { status: 201 })
  } catch (error) {
    console.error('Error creating UTM link:', error)
    return NextResponse.json(
      { error: 'Failed to create UTM link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/utm - Delete UTM link
export async function DELETE(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'UTM link ID is required' }, { status: 400 })
    }

    await db.uTMLink.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting UTM link:', error)
    return NextResponse.json(
      { error: 'Failed to delete UTM link' },
      { status: 500 }
    )
  }
}
