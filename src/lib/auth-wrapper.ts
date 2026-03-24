import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

// Check if user is authenticated
export async function getAuthSession() {
  return getServerSession(authOptions)
}

// Require authentication - returns user or 401 response
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user: session.user, response: null }
}

// Require admin role
export async function requireAdmin() {
  const { user, response } = await requireAuth()
  if (response) return { user: null, response }
  
  if (user.role !== 'admin') {
    return { user: null, response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) }
  }
  return { user, response: null }
}

// Require client access (user belongs to client or is admin)
export async function requireClientAccess(clientId: string) {
  const { user, response } = await requireAuth()
  if (response) return { user: null, response }
  
  if (user.role === 'admin') return { user, response: null }
  
  if (user.clientId !== clientId) {
    return { user: null, response: NextResponse.json({ error: 'Forbidden: No access to this client' }, { status: 403 }) }
  }
  return { user, response: null }
}

// Higher-order function to wrap API handlers with auth
export function withAuth(
  handler: (req: NextRequest, context: { user: any; params?: any }) => Promise<NextResponse>,
  options?: { requireAdmin?: boolean }
) {
  return async (req: NextRequest, context?: any) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (options?.requireAdmin && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
    
    return handler(req, { user: session.user, params: context?.params })
  }
}

// Check if user owns a resource
export function isResourceOwner(user: any, resourceUserId: string): boolean {
  return user.role === 'admin' || user.id === resourceUserId
}
