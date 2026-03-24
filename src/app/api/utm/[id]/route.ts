import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDatabaseInitialized } from '@/lib/db-init'

// GET /api/utm/[id] - Get single UTM link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized()
    
    const { id } = await params

    const utmLink = await db.uTMLink.findUnique({
      where: { id }
    })

    if (!utmLink) {
      return NextResponse.json({ error: 'UTM link not found' }, { status: 404 })
    }

    return NextResponse.json({ utmLink })
  } catch (error) {
    console.error('Error fetching UTM link:', error)
    return NextResponse.json({ error: 'Failed to fetch UTM link' }, { status: 500 })
  }
}

// PUT /api/utm/[id] - Update UTM link
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized()
    
    const { id } = await params
    const body = await request.json()

    const utmLink = await db.uTMLink.update({
      where: { id },
      data: {
        channel: body.channel,
        source: body.source,
        medium: body.medium,
        content: body.content,
        term: body.term,
        finalUrl: body.finalUrl,
        utmUrl: body.utmUrl,
      }
    })

    return NextResponse.json({ utmLink })
  } catch (error) {
    console.error('Error updating UTM link:', error)
    return NextResponse.json({ error: 'Failed to update UTM link' }, { status: 500 })
  }
}

// DELETE /api/utm/[id] - Delete UTM link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized()
    
    const { id } = await params

    await db.uTMLink.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting UTM link:', error)
    return NextResponse.json({ error: 'Failed to delete UTM link' }, { status: 500 })
  }
}
