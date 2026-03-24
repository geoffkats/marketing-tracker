import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './db-prisma'

// Password verification function
// Uses require() to avoid static import issues with Turbopack
function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For bcrypt hashes
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    const bcrypt = require('bcryptjs')
    return bcrypt.compare(password, hash)
  }
  // Development fallback
  return Promise.resolve(password === hash)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { client: true },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await verifyPassword(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
          clientName: user.client?.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.clientId = user.clientId
        token.clientName = user.clientName
      }
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.clientId = token.clientId as string | null
        session.user.clientName = token.clientName as string | null
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`✅ User signed in: ${user.email}`)
    },
    async signOut({ token }) {
      console.log(`👋 User signed out: ${token?.email}`)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Type declarations
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      clientId: string | null
      clientName: string | null
    }
  }
  interface User {
    role: string
    clientId: string | null
    clientName: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    clientId: string | null
    clientName: string | null
  }
}
