import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/r/[code] - Redirect and track UTM link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    // Find UTM link by short code or ID
    const utmLink = await db.uTMLink.findFirst({
      where: {
        OR: [
          { id: code },
          { content: code }
        ]
      }
    })

    if (!utmLink) {
      // Redirect to 404 or home
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Track the click
    await db.uTMLink.update({
      where: { id: utmLink.id },
      data: {
        clickCount: { increment: 1 },
        lastClicked: new Date()
      }
    })

    // Log click event as raw data
    await db.rawData.create({
      data: {
        campaignId: utmLink.campaignId,
        date: new Date(),
        channel: utmLink.channel,
        metric: 'clicks',
        value: 1,
        source: `utm:${utmLink.id}`,
        rawData: JSON.stringify({
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })
      }
    })

    // Redirect to the UTM URL
    return NextResponse.redirect(utmLink.utmUrl)
  } catch (error) {
    console.error('Tracking error:', error)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
}
