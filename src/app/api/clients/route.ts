import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDatabaseInitialized } from '@/lib/db-init'

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  try {
    // Ensure database is initialized with seed data
    await ensureDatabaseInitialized()
    
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    const clients = await db.client.findMany({
      where: { isActive: true },
      include: includeStats ? {
        _count: { select: { campaigns: true } }
      } : undefined,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch clients', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, primaryColor, defaultCurrency, timezone } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const client = await db.client.create({
      data: {
        name,
        slug,
        primaryColor: primaryColor || '#10B981',
        defaultCurrency: defaultCurrency || 'UGX',
        timezone: timezone || 'Africa/Kampala',
      }
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
