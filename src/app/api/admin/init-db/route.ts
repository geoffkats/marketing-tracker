import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Simple security check
    const { initKey } = await req.json()
    if (initKey !== 'init-db-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to create tables by making a simple query that will trigger table creation
    const result = await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "name" TEXT,
        "email" TEXT NOT NULL,
        "emailVerified" TIMESTAMP(3),
        "image" TEXT,
        "password" TEXT,
        "role" TEXT NOT NULL DEFAULT 'user',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "clientId" TEXT,
        "lastLoginAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `

    const result2 = await db.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tables: 'User table created'
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}