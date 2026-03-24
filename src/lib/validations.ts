import { z } from 'zod'

// ============================================
// AUTH VALIDATION
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// ============================================
// CLIENT VALIDATION
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  defaultCurrency: z.enum(['UGX', 'USD', 'KES', 'EUR', 'GBP']).optional(),
  timezone: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

// ============================================
// CAMPAIGN VALIDATION
// ============================================

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional(),
  clientId: z.string().cuid().optional(),
  startDate: z.string().transform((val) => new Date(val)).refine((date) => date > new Date('2020-01-01'), {
    message: 'Invalid start date',
  }),
  endDate: z.string().transform((val) => new Date(val)),
  budget: z.number().min(0, 'Budget must be positive').max(1000000000, 'Budget too large'),
  targetRegistrations: z.number().int().min(0).max(1000000),
  baseUrl: z.string().url('Invalid URL'),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const updateCampaignSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  budget: z.number().min(0).max(1000000000).optional(),
  targetRegistrations: z.number().int().min(0).max(1000000).optional(),
  baseUrl: z.string().url().optional(),
})

// ============================================
// ASSET VALIDATION
// ============================================

export const createAssetSchema = z.object({
  campaignId: z.string().cuid(),
  type: z.enum(['image', 'video', 'copy', 'pdf', 'contract', 'document', 'audio', 'other']),
  name: z.string().min(2).max(200),
  fileName: z.string().min(1).max(255),
  driveLink: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  owner: z.string().email(),
  version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y').optional(),
  status: z.enum(['draft', 'pending_review', 'approved', 'rejected', 'archived']).optional(),
  description: z.string().max(2000).optional(),
  tags: z.string().max(500).optional(),
})

export const updateAssetSchema = createAssetSchema.partial().omit({ campaignId: true })

// ============================================
// UTM LINK VALIDATION
// ============================================

export const createUTMLinkSchema = z.object({
  campaignId: z.string().cuid(),
  channel: z.string().min(1).max(50),
  source: z.string().min(1).max(100),
  medium: z.string().min(1).max(100),
  content: z.string().min(1).max(200),
  term: z.string().max(200).optional(),
  finalUrl: z.string().url(),
  createdBy: z.string().email(),
})

export const updateUTMLinkSchema = createUTMLinkSchema.partial().omit({ campaignId: true, createdBy: true })

// ============================================
// RAW DATA VALIDATION
// ============================================

export const createRawDataSchema = z.object({
  campaignId: z.string().cuid(),
  date: z.string().transform((val) => new Date(val)),
  channel: z.string().min(1).max(50),
  metric: z.enum(['impressions', 'clicks', 'spend', 'registrations', 'leads', 'conversions', 'opens', 'bounces', 'revenue', 'cost']),
  value: z.number(),
  source: z.string().max(100).optional(),
})

export const batchRawDataSchema = z.object({
  campaignId: z.string().cuid(),
  data: z.array(z.object({
    date: z.string().transform((val) => new Date(val)),
    channel: z.string().min(1).max(50),
    metric: z.enum(['impressions', 'clicks', 'spend', 'registrations', 'leads', 'conversions', 'opens', 'bounces', 'revenue', 'cost']),
    value: z.number(),
    source: z.string().max(100).optional(),
  })).max(1000, 'Maximum 1000 records per batch'),
})

// ============================================
// ALERT VALIDATION
// ============================================

export const createAlertSchema = z.object({
  campaignId: z.string().cuid(),
  metric: z.string().min(1).max(100),
  threshold: z.number(),
  direction: z.enum(['above', 'below']),
  recipientEmails: z.string().max(1000).refine((val) => {
    const emails = val.split(',').map(e => e.trim())
    return emails.every(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  }, 'Invalid email format'),
  slackChannel: z.string().max(100).optional(),
  slackWebhook: z.string().url().optional(),
  isActive: z.boolean().optional(),
  cooldownMinutes: z.number().int().min(1).max(1440).optional(),
})

export const updateAlertSchema = createAlertSchema.partial().omit({ campaignId: true })

// ============================================
// INFLUENCER VALIDATION
// ============================================

export const createInfluencerSchema = z.object({
  campaignId: z.string().cuid(),
  name: z.string().min(2).max(200),
  platform: z.string().min(1).max(50),
  handle: z.string().min(1).max(100),
  followerCount: z.number().int().min(0).optional(),
  contractFee: z.number().min(0),
  currency: z.enum(['UGX', 'USD', 'KES', 'EUR', 'GBP']).optional(),
  contractDate: z.string().transform((val) => new Date(val)).optional(),
  deliverables: z.string().max(5000).optional(),
  utmLink: z.string().url().optional(),
  promoCode: z.string().max(50).optional(),
})

export const updateInfluencerSchema = createInfluencerSchema.partial().omit({ campaignId: true }).extend({
  postsCount: z.number().int().min(0).optional(),
  storiesCount: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  engagements: z.number().int().min(0).optional(),
  linkClicks: z.number().int().min(0).optional(),
  registrations: z.number().int().min(0).optional(),
  revenue: z.number().min(0).optional(),
})

// ============================================
// LEAD VALIDATION
// ============================================

export const createLeadSchema = z.object({
  campaignId: z.string().cuid(),
  name: z.string().min(2).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
  channel: z.string().max(50).optional(),
  utmLink: z.string().url().optional(),
  influencerId: z.string().cuid().optional(),
  notes: z.string().max(5000).optional(),
})

export const updateLeadSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(['pending', 'paid', 'followed_up', 'converted', 'lost']).optional(),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  lastContactAt: z.string().transform((val) => new Date(val)).optional(),
  nextFollowUp: z.string().transform((val) => new Date(val)).optional(),
  smsSent: z.boolean().optional(),
  emailSent: z.boolean().optional(),
  called: z.boolean().optional(),
})

// ============================================
// QUERY PARAMETER VALIDATION
// ============================================

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.string().max(50).optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

export const dateRangeSchema = z.object({
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

import { NextResponse } from 'next/server'

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T | NextResponse {
  const result = schema.safeParse(data)
  if (!result.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        }))
      },
      { status: 400 }
    )
  }
  return result.data
}

export function validateQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): T | NextResponse {
  const obj: Record<string, string> = {}
  params.forEach((value, key) => {
    obj[key] = value
  })
  return validateBody(schema, obj)
}
