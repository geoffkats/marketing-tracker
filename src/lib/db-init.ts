import { db } from './db'

let isInitialized = false
let initPromise: Promise<void> | null = null

export async function ensureDatabaseInitialized() {
  // Return existing promise if already initializing
  if (initPromise) return initPromise
  
  // Skip if already initialized
  if (isInitialized) return
  
  initPromise = initializeDatabase()
  await initPromise
  initPromise = null
}

async function initializeDatabase() {
  try {
    // Check if we have any campaigns
    const campaignCount = await db.campaign.count()
    
    if (campaignCount > 0) {
      console.log('✅ Database already has', campaignCount, 'campaigns')
      isInitialized = true
      return
    }
    
    console.log('🌱 Database is empty, seeding...')
    await seedDatabase()
    isInitialized = true
    console.log('✅ Database seeded successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    // Mark as initialized anyway to prevent infinite retries
    isInitialized = true
  }
}

async function seedDatabase() {
  // Create default client
  let client = await db.client.findFirst()
  if (!client) {
    client = await db.client.create({
      data: {
        name: 'Code Academy Uganda',
        slug: 'code-academy-uganda',
        primaryColor: '#10B981',
        defaultCurrency: 'UGX',
        timezone: 'Africa/Kampala',
      }
    })
    console.log('Created client:', client.name)
  }

  // Create campaigns
  const mayCamp = await db.campaign.create({
    data: {
      name: 'May Code Camp 2026',
      slug: 'may-code-camp-2026',
      description: "Code Academy Uganda's annual coding bootcamp for youth (ages 12-25). 18 days of intensive programming training.",
      startDate: new Date('2026-05-04'),
      endDate: new Date('2026-05-21'),
      status: 'active',
      budget: 5000000,
      targetRegistrations: 500,
      baseUrl: 'https://codeacademyug.org/register',
      clientId: client.id,
    }
  })
  console.log('Created campaign:', mayCamp.name)

  await db.campaign.create({
    data: {
      name: 'July Web Dev Bootcamp 2026',
      slug: 'july-web-dev-bootcamp-2026',
      description: 'Intensive 4-week web development bootcamp focusing on React and Node.js.',
      startDate: new Date('2026-07-06'),
      endDate: new Date('2026-08-01'),
      status: 'draft',
      budget: 8000000,
      targetRegistrations: 300,
      baseUrl: 'https://codeacademyug.org/bootcamp',
      clientId: client.id,
    }
  })

  await db.campaign.create({
    data: {
      name: 'September Kids Code Camp 2026',
      slug: 'september-kids-code-camp-2026',
      description: 'Coding camp designed for children ages 8-14. Fun, game-based learning.',
      startDate: new Date('2026-09-07'),
      endDate: new Date('2026-09-18'),
      status: 'draft',
      budget: 3000000,
      targetRegistrations: 200,
      baseUrl: 'https://codeacademyug.org/kids',
      clientId: client.id,
    }
  })
  console.log('Created 3 campaigns')

  // Generate sample raw data
  const rawDataEntries = []
  const channels = ['FB', 'IG', 'TT', 'Google', 'Email']
  const metrics = ['impressions', 'clicks', 'spend', 'registrations']
  
  for (let day = 6; day >= 0; day--) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    date.setHours(0, 0, 0, 0)

    for (const channel of channels) {
      for (const metric of metrics) {
        let value = 0
        switch (metric) {
          case 'impressions': value = Math.floor(Math.random() * 50000) + 10000; break
          case 'clicks': value = Math.floor(Math.random() * 2000) + 500; break
          case 'spend': value = Math.floor(Math.random() * 300000) + 100000; break
          case 'registrations': value = Math.floor(Math.random() * 80) + 20; break
        }
        rawDataEntries.push({
          campaignId: mayCamp.id,
          date,
          channel,
          metric: metric as any,
          value,
          source: 'seed',
        })
      }
    }
  }

  await db.rawData.createMany({ data: rawDataEntries })
  console.log('Created', rawDataEntries.length, 'raw data entries')

  // Create assets
  await db.asset.createMany({
    data: [
      {
        campaignId: mayCamp.id,
        type: 'image',
        name: 'Hero Banner - 1920x1080',
        fileName: 'MayCodeCamp_Hero_Banner_v2.png',
        driveLink: 'https://drive.google.com/file/d/example1',
        owner: 'marketing@codeacademyug.org',
        version: '2.0',
        status: 'approved',
        description: 'Main hero banner for landing page and ads',
        tags: 'hero,banner,primary',
      },
      {
        campaignId: mayCamp.id,
        type: 'video',
        name: 'Promo Video - 30 seconds',
        fileName: 'MayCodeCamp_Promo_30s.mp4',
        driveLink: 'https://drive.google.com/file/d/example2',
        owner: 'creative@codeacademyug.org',
        version: '1.0',
        status: 'approved',
        description: 'Short promotional video for social media',
        tags: 'video,promo,social',
      },
    ]
  })
  console.log('Created assets')

  // Create UTM links
  await db.uTMLink.createMany({
    data: [
      {
        campaignId: mayCamp.id,
        channel: 'FB',
        source: 'facebook',
        medium: 'paid_social',
        content: 'hero_banner_18-25',
        finalUrl: 'https://codeacademyug.org/register',
        utmUrl: 'https://codeacademyug.org/register?utm_source=facebook&utm_medium=paid_social&utm_campaign=may-code-camp-2026',
        createdBy: 'marketing@codeacademyug.org',
      },
      {
        campaignId: mayCamp.id,
        channel: 'IG',
        source: 'instagram',
        medium: 'story_ad',
        content: 'story_swipe_up',
        finalUrl: 'https://codeacademyug.org/register',
        utmUrl: 'https://codeacademyug.org/register?utm_source=instagram&utm_medium=story_ad&utm_campaign=may-code-camp-2026',
        createdBy: 'marketing@codeacademyug.org',
      },
      {
        campaignId: mayCamp.id,
        channel: 'TT',
        source: 'tiktok',
        medium: 'in_feed',
        content: 'promo_video',
        finalUrl: 'https://codeacademyug.org/register',
        utmUrl: 'https://codeacademyug.org/register?utm_source=tiktok&utm_medium=in_feed&utm_campaign=may-code-camp-2026',
        createdBy: 'marketing@codeacademyug.org',
      },
    ]
  })
  console.log('Created UTM links')

  // Create data sources
  await db.dataSource.createMany({
    data: [
      { name: 'Google Analytics 4', platform: 'ga4', status: 'connected', lastSync: new Date() },
      { name: 'Facebook Ads', platform: 'facebook', status: 'connected', lastSync: new Date() },
      { name: 'TikTok Ads', platform: 'tiktok', status: 'connected', lastSync: new Date() },
      { name: 'Google Ads', platform: 'google_ads', status: 'connected', lastSync: new Date() },
    ]
  })
  console.log('Created data sources')
}
