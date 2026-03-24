import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/integrations - Get all integrations for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const integrations = await db.googleWorkspaceIntegration.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { type: 'asc' }
    })

    // Group by type for easier frontend handling
    const grouped = {
      sheets: integrations.find(i => i.type === 'sheets'),
      gmail: integrations.find(i => i.type === 'gmail'),
      drive: integrations.find(i => i.type === 'drive'),
    }

    return NextResponse.json({ 
      integrations,
      grouped,
      summary: {
        total: integrations.length,
        connected: integrations.filter(i => i.status === 'connected').length,
        disconnected: integrations.filter(i => i.status === 'disconnected').length,
        error: integrations.filter(i => i.status === 'error').length,
      }
    })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

// POST /api/integrations - Create or update integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, type, spreadsheetId, sheetName, syncFrequency, config } = body

    if (!clientId || !type) {
      return NextResponse.json({ error: 'clientId and type are required' }, { status: 400 })
    }

    // Check if integration already exists
    const existing = await db.googleWorkspaceIntegration.findUnique({
      where: { clientId_type: { clientId, type } }
    })

    if (existing) {
      // Update
      const updated = await db.googleWorkspaceIntegration.update({
        where: { id: existing.id },
        data: {
          spreadsheetId,
          sheetName,
          syncFrequency,
          config: config ? JSON.stringify(config) : existing.config,
          status: 'connected',
          lastSync: new Date(),
        }
      })
      return NextResponse.json({ integration: updated })
    }

    // Create new
    const integration = await db.googleWorkspaceIntegration.create({
      data: {
        clientId,
        type,
        spreadsheetId,
        sheetName,
        syncFrequency: syncFrequency || 60,
        config: config ? JSON.stringify(config) : null,
        status: 'connected',
        lastSync: new Date(),
      }
    })

    return NextResponse.json({ integration })
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }
}

// PATCH /api/integrations - Sync integration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { integrationId, action } = body

    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 })
    }

    if (action === 'sync') {
      // Simulate sync - in production, this would actually fetch data from Google
      const integration = await db.googleWorkspaceIntegration.update({
        where: { id: integrationId },
        data: {
          status: 'syncing',
        }
      })

      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const updated = await db.googleWorkspaceIntegration.update({
        where: { id: integrationId },
        data: {
          status: 'connected',
          lastSync: new Date(),
          totalSynced: { increment: 10 }, // Simulated
        }
      })

      return NextResponse.json({ integration: updated, recordsSynced: 10 })
    }

    if (action === 'disconnect') {
      const updated = await db.googleWorkspaceIntegration.update({
        where: { id: integrationId },
        data: {
          status: 'disconnected',
          accessToken: null,
          refreshToken: null,
        }
      })
      return NextResponse.json({ integration: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating integration:', error)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}

// DELETE /api/integrations - Delete integration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.googleWorkspaceIntegration.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting integration:', error)
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
  }
}
