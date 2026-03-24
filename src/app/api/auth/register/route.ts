import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db-prisma'
import { registerSchema } from '@/lib/validations'
import { withRateLimit } from '@/lib/rate-limit'

// Use require for bcryptjs to avoid Turbopack issues
function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs')
  return bcrypt.hash(password, 12)
}

async function handler(req: NextRequest) {
  try {
    const body = await req.json()
    
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      )
    }
    
    const { name, email, password } = result.data
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    
    const hashedPassword = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
      },
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(handler, { maxRequests: 5 })
