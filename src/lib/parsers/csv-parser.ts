/**
 * Platform-specific CSV parsers for marketing data imports
 * Handles exports from Facebook, Instagram, TikTok, Google Ads, LinkedIn, etc.
 */

export interface ParsedDataRow {
  date: Date
  channel: string
  metric: string
  value: number
  campaign?: string
  adSet?: string
  adName?: string
  rawData?: Record<string, any>
}

export interface ParseResult {
  success: boolean
  platform: string
  rows: ParsedDataRow[]
  errors: string[]
  summary: {
    totalRows: number
    dateRange: { start: string; end: string }
    channels: string[]
    metrics: string[]
  }
}

/**
 * Auto-detect platform from CSV headers
 */
export function detectPlatform(headers: string[]): string {
  const headerStr = headers.join(',').toLowerCase()
  
  // Facebook/Meta Ads
  if (headerStr.includes('campaign name') && headerStr.includes('results')) {
    return 'facebook'
  }
  
  // TikTok Ads
  if (headerStr.includes('stat_cost') || headerStr.includes('ad_name')) {
    return 'tiktok'
  }
  
  // Google Ads
  if (headerStr.includes('campaign') && headerStr.includes('impressions') && headerStr.includes('cost')) {
    return 'google'
  }
  
  // LinkedIn Ads
  if (headerStr.includes('campaign name') && headerStr.includes('clicks') && headerStr.includes('impressions')) {
    return 'linkedin'
  }
  
  // Twitter/X Ads
  if (headerStr.includes('promoted_tweet') || headerStr.includes('billing')) {
    return 'twitter'
  }
  
  // Generic format
  if (headerStr.includes('date') && headerStr.includes('channel')) {
    return 'generic'
  }
  
  return 'unknown'
}

/**
 * Parse Facebook/Meta Ads export
 */
export function parseFacebookAds(csvData: string[]): ParseResult {
  const errors: string[] = []
  const rows: ParsedDataRow[] = []
  
  // Find header row
  const headerIndex = csvData.findIndex(row => 
    row.toLowerCase().includes('date') || row.toLowerCase().includes('reporting starts')
  )
  
  if (headerIndex === -1) {
    return { success: false, platform: 'facebook', rows: [], errors: ['Could not find header row'], summary: { totalRows: 0, dateRange: { start: '', end: '' }, channels: [], metrics: [] } }
  }
  
  const headers = csvData[headerIndex].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const dataRows = csvData.slice(headerIndex + 1).filter(row => row.trim())
  
  // Find column indices
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('reporting starts') || h === 'day')
  const campaignIdx = headers.findIndex(h => h.includes('campaign name'))
  const adSetIdx = headers.findIndex(h => h.includes('ad set name') || h.includes('adset name'))
  const adIdx = headers.findIndex(h => h.includes('ad name'))
  const impressionsIdx = headers.findIndex(h => h.includes('impressions'))
  const clicksIdx = headers.findIndex(h => h.includes('clicks') || h.includes('link clicks'))
  const spendIdx = headers.findIndex(h => h.includes('amount spent') || h.includes('spend'))
  const resultsIdx = headers.findIndex(h => h.includes('results'))
  const reachIdx = headers.findIndex(h => h.includes('reach'))
  const frequencyIdx = headers.findIndex(h => h.includes('frequency'))
  const ctrIdx = headers.findIndex(h => h.includes('ctr'))
  const cpmIdx = headers.findIndex(h => h.includes('cpm'))
  
  let dates: string[] = []
  
  for (let i = 0; i < dataRows.length; i++) {
    try {
      const cells = parseCSVLine(dataRows[i])
      if (cells.length < 3) continue
      
      const dateStr = cells[dateIdx]?.replace(/"/g, '').trim()
      if (!dateStr) continue
      
      const date = parseDate(dateStr)
      if (isNaN(date.getTime())) continue
      
      dates.push(date.toISOString().slice(0, 10))
      
      const campaign = campaignIdx >= 0 ? cells[campaignIdx]?.replace(/"/g, '').trim() : undefined
      const adSet = adSetIdx >= 0 ? cells[adSetIdx]?.replace(/"/g, '').trim() : undefined
      const adName = adIdx >= 0 ? cells[adIdx]?.replace(/"/g, '').trim() : undefined
      
      const rawData: Record<string, any> = {}
      headers.forEach((h, idx) => {
        if (cells[idx]) rawData[h] = cells[idx].replace(/"/g, '').trim()
      })
      
      // Extract metrics
      const metrics: Array<{ metric: string; value: number }> = []
      
      if (impressionsIdx >= 0) {
        const val = parseFloat(cells[impressionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'impressions', value: val })
      }
      
      if (clicksIdx >= 0) {
        const val = parseFloat(cells[clicksIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'clicks', value: val })
      }
      
      if (spendIdx >= 0) {
        let val = parseFloat(cells[spendIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) {
          // Convert USD to UGX if needed (approximate rate)
          val = val * 3800
          metrics.push({ metric: 'spend', value: Math.round(val) })
        }
      }
      
      if (resultsIdx >= 0) {
        const val = parseFloat(cells[resultsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'registrations', value: val })
      }
      
      if (reachIdx >= 0) {
        const val = parseFloat(cells[reachIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'reach', value: val })
      }
      
      for (const m of metrics) {
        rows.push({
          date,
          channel: 'FB',
          metric: m.metric,
          value: m.value,
          campaign,
          adSet,
          adName,
          rawData
        })
      }
      
    } catch (e) {
      errors.push(`Row ${i + headerIndex + 2}: ${e}`)
    }
  }
  
  dates = [...new Set(dates)].sort()
  
  return {
    success: true,
    platform: 'facebook',
    rows,
    errors,
    summary: {
      totalRows: rows.length,
      dateRange: { start: dates[0] || '', end: dates[dates.length - 1] || '' },
      channels: ['FB', 'IG'],
      metrics: [...new Set(rows.map(r => r.metric))]
    }
  }
}

/**
 * Parse TikTok Ads export
 */
export function parseTikTokAds(csvData: string[]): ParseResult {
  const errors: string[] = []
  const rows: ParsedDataRow[] = []
  
  const headerIndex = csvData.findIndex(row => 
    row.toLowerCase().includes('stat_cost') || row.toLowerCase().includes('date')
  )
  
  if (headerIndex === -1) {
    return { success: false, platform: 'tiktok', rows: [], errors: ['Could not find header row'], summary: { totalRows: 0, dateRange: { start: '', end: '' }, channels: [], metrics: [] } }
  }
  
  const headers = csvData[headerIndex].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const dataRows = csvData.slice(headerIndex + 1).filter(row => row.trim())
  
  // TikTok specific columns
  const dateIdx = headers.findIndex(h => h.includes('stat_datetime') || h.includes('date'))
  const campaignIdx = headers.findIndex(h => h.includes('campaign_name'))
  const adIdx = headers.findIndex(h => h.includes('ad_name'))
  const spendIdx = headers.findIndex(h => h.includes('stat_cost'))
  const impressionsIdx = headers.findIndex(h => h.includes('show_cnt') || h.includes('impression'))
  const clicksIdx = headers.findIndex(h => h.includes('click_cnt') || h.includes('click'))
  const conversionsIdx = headers.findIndex(h => h.includes('conversion') || h.includes('result'))
  const videoPlayIdx = headers.findIndex(h => h.includes('video_play'))
  
  let dates: string[] = []
  
  for (let i = 0; i < dataRows.length; i++) {
    try {
      const cells = parseCSVLine(dataRows[i])
      if (cells.length < 3) continue
      
      const dateStr = cells[dateIdx]?.replace(/"/g, '').trim()
      if (!dateStr) continue
      
      const date = parseDate(dateStr)
      if (isNaN(date.getTime())) continue
      
      dates.push(date.toISOString().slice(0, 10))
      
      const campaign = campaignIdx >= 0 ? cells[campaignIdx]?.replace(/"/g, '').trim() : undefined
      const adName = adIdx >= 0 ? cells[adIdx]?.replace(/"/g, '').trim() : undefined
      
      const rawData: Record<string, any> = {}
      headers.forEach((h, idx) => {
        if (cells[idx]) rawData[h] = cells[idx].replace(/"/g, '').trim()
      })
      
      const metrics: Array<{ metric: string; value: number }> = []
      
      if (impressionsIdx >= 0) {
        const val = parseFloat(cells[impressionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'impressions', value: val })
      }
      
      if (clicksIdx >= 0) {
        const val = parseFloat(cells[clicksIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'clicks', value: val })
      }
      
      if (spendIdx >= 0) {
        let val = parseFloat(cells[spendIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) {
          val = val * 3800 // USD to UGX
          metrics.push({ metric: 'spend', value: Math.round(val) })
        }
      }
      
      if (conversionsIdx >= 0) {
        const val = parseFloat(cells[conversionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'registrations', value: val })
      }
      
      if (videoPlayIdx >= 0) {
        const val = parseFloat(cells[videoPlayIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'video_plays', value: val })
      }
      
      for (const m of metrics) {
        rows.push({
          date,
          channel: 'TT',
          metric: m.metric,
          value: m.value,
          campaign,
          adName,
          rawData
        })
      }
      
    } catch (e) {
      errors.push(`Row ${i + headerIndex + 2}: ${e}`)
    }
  }
  
  dates = [...new Set(dates)].sort()
  
  return {
    success: true,
    platform: 'tiktok',
    rows,
    errors,
    summary: {
      totalRows: rows.length,
      dateRange: { start: dates[0] || '', end: dates[dates.length - 1] || '' },
      channels: ['TT'],
      metrics: [...new Set(rows.map(r => r.metric))]
    }
  }
}

/**
 * Parse Google Ads export
 */
export function parseGoogleAds(csvData: string[]): ParseResult {
  const errors: string[] = []
  const rows: ParsedDataRow[] = []
  
  // Skip Google Ads summary rows at the top
  const headerIndex = csvData.findIndex(row => 
    row.toLowerCase().includes('day') || row.toLowerCase().includes('date')
  )
  
  if (headerIndex === -1) {
    return { success: false, platform: 'google', rows: [], errors: ['Could not find header row'], summary: { totalRows: 0, dateRange: { start: '', end: '' }, channels: [], metrics: [] } }
  }
  
  const headers = csvData[headerIndex].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const dataRows = csvData.slice(headerIndex + 1).filter(row => row.trim() && !row.includes('Total') && !row.includes('Average'))
  
  const dateIdx = headers.findIndex(h => h.includes('day') || h.includes('date'))
  const campaignIdx = headers.findIndex(h => h.includes('campaign'))
  const impressionsIdx = headers.findIndex(h => h.includes('impressions'))
  const clicksIdx = headers.findIndex(h => h.includes('clicks'))
  const costIdx = headers.findIndex(h => h.includes('cost'))
  const conversionsIdx = headers.findIndex(h => h.includes('conversions') || h.includes('registrations'))
  const ctrIdx = headers.findIndex(h => h.includes('ctr'))
  const cpcIdx = headers.findIndex(h => h.includes('avg') && h.includes('cpc'))
  
  let dates: string[] = []
  
  for (let i = 0; i < dataRows.length; i++) {
    try {
      const cells = parseCSVLine(dataRows[i])
      if (cells.length < 3) continue
      
      const dateStr = cells[dateIdx]?.replace(/"/g, '').trim()
      if (!dateStr) continue
      
      const date = parseDate(dateStr)
      if (isNaN(date.getTime())) continue
      
      dates.push(date.toISOString().slice(0, 10))
      
      const campaign = campaignIdx >= 0 ? cells[campaignIdx]?.replace(/"/g, '').trim() : undefined
      
      const rawData: Record<string, any> = {}
      headers.forEach((h, idx) => {
        if (cells[idx]) rawData[h] = cells[idx].replace(/"/g, '').trim()
      })
      
      const metrics: Array<{ metric: string; value: number }> = []
      
      if (impressionsIdx >= 0) {
        const val = parseFloat(cells[impressionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'impressions', value: val })
      }
      
      if (clicksIdx >= 0) {
        const val = parseFloat(cells[clicksIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'clicks', value: val })
      }
      
      if (costIdx >= 0) {
        let val = parseFloat(cells[costIdx]?.replace(/"/g, '').replace(/,/g, '').replace(/[^0-9.-]/g, ''))
        if (!isNaN(val) && val > 0) {
          // Google Ads cost is usually in local currency or micros
          val = val * 3800 // Assume USD, convert to UGX
          metrics.push({ metric: 'spend', value: Math.round(val) })
        }
      }
      
      if (conversionsIdx >= 0) {
        const val = parseFloat(cells[conversionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'registrations', value: val })
      }
      
      for (const m of metrics) {
        rows.push({
          date,
          channel: 'Google',
          metric: m.metric,
          value: m.value,
          campaign,
          rawData
        })
      }
      
    } catch (e) {
      errors.push(`Row ${i + headerIndex + 2}: ${e}`)
    }
  }
  
  dates = [...new Set(dates)].sort()
  
  return {
    success: true,
    platform: 'google',
    rows,
    errors,
    summary: {
      totalRows: rows.length,
      dateRange: { start: dates[0] || '', end: dates[dates.length - 1] || '' },
      channels: ['Google'],
      metrics: [...new Set(rows.map(r => r.metric))]
    }
  }
}

/**
 * Parse generic CSV format
 * Expected columns: date, channel, impressions, clicks, spend, registrations
 */
export function parseGenericCSV(csvData: string[]): ParseResult {
  const errors: string[] = []
  const rows: ParsedDataRow[] = []
  
  const headerIndex = csvData.findIndex(row => 
    row.toLowerCase().includes('date')
  )
  
  if (headerIndex === -1) {
    return { success: false, platform: 'generic', rows: [], errors: ['Could not find header row'], summary: { totalRows: 0, dateRange: { start: '', end: '' }, channels: [], metrics: [] } }
  }
  
  const headers = csvData[headerIndex].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const dataRows = csvData.slice(headerIndex + 1).filter(row => row.trim())
  
  const dateIdx = headers.findIndex(h => h.includes('date'))
  const channelIdx = headers.findIndex(h => h.includes('channel'))
  const impressionsIdx = headers.findIndex(h => h.includes('impressions'))
  const clicksIdx = headers.findIndex(h => h.includes('clicks'))
  const spendIdx = headers.findIndex(h => h.includes('spend') || h.includes('cost'))
  const registrationsIdx = headers.findIndex(h => h.includes('registration') || h.includes('conversion') || h.includes('lead'))
  
  let dates: string[] = []
  const channels = new Set<string>()
  
  for (let i = 0; i < dataRows.length; i++) {
    try {
      const cells = parseCSVLine(dataRows[i])
      if (cells.length < 2) continue
      
      const dateStr = cells[dateIdx]?.replace(/"/g, '').trim()
      if (!dateStr) continue
      
      const date = parseDate(dateStr)
      if (isNaN(date.getTime())) continue
      
      const channel = channelIdx >= 0 ? cells[channelIdx]?.replace(/"/g, '').trim().toUpperCase() : 'FB'
      channels.add(channel)
      dates.push(date.toISOString().slice(0, 10))
      
      const rawData: Record<string, any> = {}
      headers.forEach((h, idx) => {
        if (cells[idx]) rawData[h] = cells[idx].replace(/"/g, '').trim()
      })
      
      const metrics: Array<{ metric: string; value: number }> = []
      
      if (impressionsIdx >= 0) {
        const val = parseFloat(cells[impressionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'impressions', value: val })
      }
      
      if (clicksIdx >= 0) {
        const val = parseFloat(cells[clicksIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'clicks', value: val })
      }
      
      if (spendIdx >= 0) {
        const val = parseFloat(cells[spendIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'spend', value: val })
      }
      
      if (registrationsIdx >= 0) {
        const val = parseFloat(cells[registrationsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'registrations', value: val })
      }
      
      for (const m of metrics) {
        rows.push({
          date,
          channel,
          metric: m.metric,
          value: m.value,
          rawData
        })
      }
      
    } catch (e) {
      errors.push(`Row ${i + headerIndex + 2}: ${e}`)
    }
  }
  
  dates = [...new Set(dates)].sort()
  
  return {
    success: true,
    platform: 'generic',
    rows,
    errors,
    summary: {
      totalRows: rows.length,
      dateRange: { start: dates[0] || '', end: dates[dates.length - 1] || '' },
      channels: [...channels],
      metrics: [...new Set(rows.map(r => r.metric))]
    }
  }
}

/**
 * Parse LinkedIn Ads export
 */
export function parseLinkedInAds(csvData: string[]): ParseResult {
  const errors: string[] = []
  const rows: ParsedDataRow[] = []
  
  const headerIndex = csvData.findIndex(row => 
    row.toLowerCase().includes('date') || row.toLowerCase().includes('day')
  )
  
  if (headerIndex === -1) {
    return { success: false, platform: 'linkedin', rows: [], errors: ['Could not find header row'], summary: { totalRows: 0, dateRange: { start: '', end: '' }, channels: [], metrics: [] } }
  }
  
  const headers = csvData[headerIndex].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const dataRows = csvData.slice(headerIndex + 1).filter(row => row.trim())
  
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('day'))
  const campaignIdx = headers.findIndex(h => h.includes('campaign'))
  const impressionsIdx = headers.findIndex(h => h.includes('impressions'))
  const clicksIdx = headers.findIndex(h => h.includes('clicks'))
  const spendIdx = headers.findIndex(h => h.includes('cost') || h.includes('spend') || h.includes('total'))
  const conversionsIdx = headers.findIndex(h => h.includes('conversion') || h.includes('lead'))
  
  let dates: string[] = []
  
  for (let i = 0; i < dataRows.length; i++) {
    try {
      const cells = parseCSVLine(dataRows[i])
      if (cells.length < 3) continue
      
      const dateStr = cells[dateIdx]?.replace(/"/g, '').trim()
      if (!dateStr) continue
      
      const date = parseDate(dateStr)
      if (isNaN(date.getTime())) continue
      
      dates.push(date.toISOString().slice(0, 10))
      
      const campaign = campaignIdx >= 0 ? cells[campaignIdx]?.replace(/"/g, '').trim() : undefined
      
      const rawData: Record<string, any> = {}
      headers.forEach((h, idx) => {
        if (cells[idx]) rawData[h] = cells[idx].replace(/"/g, '').trim()
      })
      
      const metrics: Array<{ metric: string; value: number }> = []
      
      if (impressionsIdx >= 0) {
        const val = parseFloat(cells[impressionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'impressions', value: val })
      }
      
      if (clicksIdx >= 0) {
        const val = parseFloat(cells[clicksIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'clicks', value: val })
      }
      
      if (spendIdx >= 0) {
        let val = parseFloat(cells[spendIdx]?.replace(/"/g, '').replace(/,/g, '').replace(/[^0-9.-]/g, ''))
        if (!isNaN(val) && val > 0) {
          val = val * 3800 // USD to UGX
          metrics.push({ metric: 'spend', value: Math.round(val) })
        }
      }
      
      if (conversionsIdx >= 0) {
        const val = parseFloat(cells[conversionsIdx]?.replace(/"/g, '').replace(/,/g, ''))
        if (!isNaN(val) && val > 0) metrics.push({ metric: 'registrations', value: val })
      }
      
      for (const m of metrics) {
        rows.push({
          date,
          channel: 'LinkedIn',
          metric: m.metric,
          value: m.value,
          campaign,
          rawData
        })
      }
      
    } catch (e) {
      errors.push(`Row ${i + headerIndex + 2}: ${e}`)
    }
  }
  
  dates = [...new Set(dates)].sort()
  
  return {
    success: true,
    platform: 'linkedin',
    rows,
    errors,
    summary: {
      totalRows: rows.length,
      dateRange: { start: dates[0] || '', end: dates[dates.length - 1] || '' },
      channels: ['LinkedIn'],
      metrics: [...new Set(rows.map(r => r.metric))]
    }
  }
}

/**
 * Auto-parse CSV file - detects platform and routes to appropriate parser
 */
export function parseCSVFile(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  
  if (lines.length < 2) {
    return {
      success: false,
      platform: 'unknown',
      rows: [],
      errors: ['File is empty or has no data rows'],
      summary: { totalRows: 0, dateRange: { start: '', end: '' }, channels: [], metrics: [] }
    }
  }
  
  // Try to detect platform from headers
  const firstRows = lines.slice(0, 10)
  const headers = firstRows.map(row => row.toLowerCase())
  const platform = detectPlatform(lines[Math.min(5, lines.length - 1)].split(','))
  
  switch (platform) {
    case 'facebook':
      return parseFacebookAds(lines)
    case 'tiktok':
      return parseTikTokAds(lines)
    case 'google':
      return parseGoogleAds(lines)
    case 'linkedin':
      return parseLinkedInAds(lines)
    case 'twitter':
      return parseGenericCSV(lines) // Use generic for Twitter
    default:
      return parseGenericCSV(lines)
  }
}

/**
 * Helper: Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

/**
 * Helper: Parse various date formats
 */
function parseDate(dateStr: string): Date {
  // Try ISO format: 2024-05-01
  let date = new Date(dateStr)
  if (!isNaN(date.getTime())) return date
  
  // Try MM/DD/YYYY
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    date = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`)
    if (!isNaN(date.getTime())) return date
  }
  
  // Try DD-MM-YYYY
  const dashParts = dateStr.split('-')
  if (dashParts.length === 3) {
    const [d, m, y] = dashParts
    date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(date.getTime())) return date
  }
  
  // Try month name format: May 1, 2024
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const lowerDate = dateStr.toLowerCase()
  for (let i = 0; i < monthNames.length; i++) {
    if (lowerDate.includes(monthNames[i])) {
      const year = dateStr.match(/\d{4}/)?.[0] || new Date().getFullYear()
      const dayMatch = dateStr.match(/\d{1,2}/)
      const day = dayMatch ? dayMatch[0] : '1'
      date = new Date(`${year}-${String(i + 1).padStart(2, '0')}-${day.padStart(2, '0')}`)
      if (!isNaN(date.getTime())) return date
    }
  }
  
  return new Date(dateStr)
}
