import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Simple security check
    const { initKey } = await req.json()
    if (initKey !== 'init-db-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create ENUMs first - check if they exist
    await db.$executeRaw`
      DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('admin', 'user', 'viewer');
      EXCEPTION
      WHEN duplicate_object THEN null;
      END $$;
    `

    await db.$executeRaw`
      DO $$ BEGIN
      CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'completed');
      EXCEPTION
      WHEN duplicate_object THEN null;
      END $$;
    `

    // Create Client table
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Client" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "primaryColor" TEXT DEFAULT '#10B981',
        "defaultCurrency" TEXT DEFAULT 'UGX',
        "timezone" TEXT DEFAULT 'Africa/Kampala',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
      );
    `

    // Create User table with proper UserRole reference
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT,
        "email" TEXT NOT NULL,
        "emailVerified" TIMESTAMP(3),
        "image" TEXT,
        "password" TEXT,
        "role" "UserRole" NOT NULL DEFAULT 'user',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "clientId" TEXT,
        "lastLoginAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `

    // Create indexes
    await db.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Client_slug_key" ON "Client"("slug");
    `
    
    await db.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `

    // Insert default client
    await db.$executeRaw`
      INSERT INTO "Client" ("id", "name", "slug", "primaryColor", "defaultCurrency", "timezone", "createdAt", "updatedAt")
      SELECT 'default-client-001', 'Code Academy Uganda', 'code-academy-uganda', '#10B981', 'UGX', 'Africa/Kampala', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM "Client" WHERE "slug" = 'code-academy-uganda');
    `

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully with complete schema',
      tables: 'User table, Client table, and required ENUMs created'
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