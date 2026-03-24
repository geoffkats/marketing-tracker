import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Security: Only allow this in development or with a secret key
    const { adminKey } = await req.json()
    if (process.env.NODE_ENV === 'production' && adminKey !== 'create-admin-user-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@codeacademyug.org' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { 
          message: 'Admin user already exists',
          credentials: {
            email: 'admin@codeacademyug.org',
            password: 'Admin123!'
          }
        }
      )
    }

    // Create admin user
    const hashedPassword = await hash('Admin123!', 12)
    
    const admin = await db.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@codeacademyug.org',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      credentials: {
        email: 'admin@codeacademyug.org',
        password: 'Admin123!'
      },
      warning: 'Please change the password after first login!'
    })

  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}