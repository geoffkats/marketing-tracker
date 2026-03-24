'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, 
  Copy, 
  Check, 
  FileCode,
  Terminal,
  Play,
  Clock,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

export function ScriptsDisplay() {
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedScript(id)
    toast.success('Script copied to clipboard!')
    setTimeout(() => setCopiedScript(null), 2000)
  }

  const utmBuilderScript = `/**
 * UTM Builder - Google Apps Script
 * Bound to: UTM Parameters Sheet
 * 
 * SETUP:
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Copy this code into the script editor
 * 3. Save and refresh the sheet
 * 4. Look for "UTM Builder" menu in the toolbar
 */

// Constants
const CAMPAIGN_NAME = 'MayCodeCamp2026';
const BASE_URL = 'https://codeacademyug.org/register';

// Add custom menu when spreadsheet opens
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('UTM Builder')
    .addItem('Generate URL', 'generateUTM')
    .addItem('Generate All Selected', 'generateSelectedUTM')
    .addSeparator()
    .addItem('Open Audit Log', 'openAuditLog')
    .addToUi();
}

/**
 * Generate UTM URL for the active row
 * Expects columns: Channel, Source, Medium, Content, Term, Final URL
 */
function generateUTM() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const activeRange = sheet.getActiveCell();
  const row = activeRange.getRow();
  
  // Skip header row
  if (row === 1) {
    SpreadsheetApp.getUi().alert('Please select a data row, not the header.');
    return;
  }
  
  // Get data from the row
  // Column mapping (adjust if needed):
  // A: UTM ID, B: Channel, C: Source, D: Medium, E: Campaign, 
  // F: Content, G: Term, H: Final URL, I: UTM URL, J: Created By, K: Created Date
  
  const channel = sheet.getRange(row, 2).getValue();
  const source = sheet.getRange(row, 3).getValue();
  const medium = sheet.getRange(row, 4).getValue();
  const content = sheet.getRange(row, 6).getValue();
  const term = sheet.getRange(row, 7).getValue();
  const finalUrl = sheet.getRange(row, 8).getValue() || BASE_URL;
  
  // Validate required fields
  if (!source || !medium || !content) {
    SpreadsheetApp.getUi().alert('Missing required fields. Please fill in Source, Medium, and Content.');
    return;
  }
  
  // Build UTM URL
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: CAMPAIGN_NAME,
    utm_content: content
  });
  
  if (term) {
    params.append('utm_term', term);
  }
  
  const utmUrl = finalUrl + '?' + params.toString();
  
  // Write UTM URL to the row
  sheet.getRange(row, 9).setValue(utmUrl);
  sheet.getRange(row, 9).setFormula('HYPERLINK("' + finalUrl + '", "' + utmUrl + '")');
  sheet.getRange(row, 10).setValue(Session.getActiveUser().getEmail());
  sheet.getRange(row, 11).setValue(new Date().toISOString().slice(0, 10));
  
  // Generate UTM ID if not present
  if (!sheet.getRange(row, 1).getValue()) {
    const lastId = getLastUtmId(sheet);
    sheet.getRange(row, 1).setValue('UTM-' + String(lastId + 1).padStart(3, '0'));
  }
  
  // Log to Audit sheet
  logAudit('generateUTM', \`Generated UTM for \${channel} - \${content}\`);
  
  SpreadsheetApp.getUi().alert('UTM URL generated successfully!\\n\\n' + utmUrl);
}

/**
 * Generate UTM URLs for all selected rows
 */
function generateSelectedUTM() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getSelection();
  const ranges = selection.getActiveRange();
  
  if (!ranges || ranges.getNumRows() === 0) {
    SpreadsheetApp.getUi().alert('Please select at least one row.');
    return;
  }
  
  const startRow = ranges.getRow();
  const numRows = ranges.getNumRows();
  let successCount = 0;
  
  for (let i = 0; i < numRows; i++) {
    const row = startRow + i;
    if (row === 1) continue; // Skip header
    
    try {
      const source = sheet.getRange(row, 3).getValue();
      const medium = sheet.getRange(row, 4).getValue();
      const content = sheet.getRange(row, 6).getValue();
      const term = sheet.getRange(row, 7).getValue();
      const finalUrl = sheet.getRange(row, 8).getValue() || BASE_URL;
      
      if (!source || !medium || !content) continue;
      
      const params = new URLSearchParams({
        utm_source: source,
        utm_medium: medium,
        utm_campaign: CAMPAIGN_NAME,
        utm_content: content
      });
      
      if (term) params.append('utm_term', term);
      
      const utmUrl = finalUrl + '?' + params.toString();
      sheet.getRange(row, 9).setValue(utmUrl);
      sheet.getRange(row, 10).setValue(Session.getActiveUser().getEmail());
      sheet.getRange(row, 11).setValue(new Date().toISOString().slice(0, 10));
      
      if (!sheet.getRange(row, 1).getValue()) {
        const lastId = getLastUtmId(sheet);
        sheet.getRange(row, 1).setValue('UTM-' + String(lastId + 1 + i).padStart(3, '0'));
      }
      
      successCount++;
    } catch (e) {
      console.error('Error processing row ' + row, e);
    }
  }
  
  logAudit('generateSelectedUTM', \`Generated \${successCount} UTM URLs\`);
  SpreadsheetApp.getUi().alert('Generated ' + successCount + ' UTM URLs successfully!');
}

/**
 * Get the last UTM ID from the sheet
 */
function getLastUtmId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  
  const lastId = sheet.getRange(lastRow, 1).getValue();
  if (lastId && lastId.startsWith('UTM-')) {
    return parseInt(lastId.replace('UTM-', ''), 10);
  }
  return 0;
}

/**
 * Log action to hidden Audit sheet
 */
function logAudit(action, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let auditSheet = ss.getSheetByName('Audit Log');
  
  // Create audit sheet if it doesn't exist
  if (!auditSheet) {
    auditSheet = ss.insertSheet('Audit Log');
    auditSheet.appendRow(['Timestamp', 'User', 'Action', 'Details']);
    auditSheet.hideSheet();
  }
  
  auditSheet.appendRow([
    new Date().toISOString(),
    Session.getActiveUser().getEmail(),
    action,
    details
  ]);
}

/**
 * Open the Audit Log sheet
 */
function openAuditLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const auditSheet = ss.getSheetByName('Audit Log');
  
  if (auditSheet) {
    auditSheet.showSheet();
    auditSheet.activate();
  } else {
    SpreadsheetApp.getUi().alert('Audit Log not found. Generate a UTM URL first to create it.');
  }
}`

  const dataIngestionScript = `/**
 * Data Ingestion Scripts - Google Apps Script
 * Runs daily via Time-Driven Triggers
 * 
 * SETUP:
 * 1. Store API credentials in Script Properties (File → Project properties → Script properties)
 * 2. Set up triggers (Edit → Current project's triggers → Add trigger)
 * 3. Recommended: Run daily at 6:00 AM UTC
 */

// Configuration
const SPREADSHEET_ID = '<<DASHBOARD_SPREADSHEET_ID>>';
const RAW_DATA_SHEET = 'Raw Data';
const PROPERTIES = PropertiesService.getScriptProperties();

/**
 * ============ GOOGLE ANALYTICS 4 ============
 */
function fetchGA4Data() {
  const propertyId = PROPERTIES.getProperty('GA4_PROPERTY_ID');
  if (!propertyId) {
    console.error('GA4 Property ID not configured');
    return;
  }
  
  // Get last sync date
  const lastSync = PROPERTIES.getProperty('GA4_LAST_SYNC') || '2026-05-01';
  const today = new Date().toISOString().slice(0, 10);
  
  // GA4 Data API request
  // Note: Requires Analytics Data API to be enabled in Google Cloud Console
  const request = {
    entity: { propertyId: propertyId },
    dateRanges: [{ startDate: lastSync, endDate: today }],
    dimensions: [
      { name: 'date' },
      { name: 'utmSource' },
      { name: 'utmMedium' }
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'conversions' }, // Ensure 'registration' event is set as conversion
      { name: 'totalUsers' }
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'registration' }
      }
    }
  };
  
  try {
    // Using Analytics Data API (requires enabling in Cloud Console)
    const response = AnalyticsData.Properties.runReport(request, \`properties/\${propertyId}\`);
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RAW_DATA_SHEET);
    
    response.rows.forEach(row => {
      const date = row.dimensionValues[0].value;
      const source = row.dimensionValues[1].value;
      const registrations = row.metricValues[1].value;
      
      sheet.appendRow([date, source, 'Registrations', parseInt(registrations, 10)]);
    });
    
    PROPERTIES.setProperty('GA4_LAST_SYNC', today);
    logSync('GA4', response.rows.length);
    
  } catch (e) {
    console.error('GA4 API Error:', e);
    sendErrorEmail('GA4 Data Sync', e.message);
  }
}

/**
 * ============ FACEBOOK/META ADS ============
 */
function fetchFacebookAdsData() {
  const accessToken = PROPERTIES.getProperty('FB_ACCESS_TOKEN');
  const adAccountId = PROPERTIES.getProperty('FB_AD_ACCOUNT_ID');
  
  if (!accessToken || !adAccountId) {
    console.error('Facebook credentials not configured');
    return;
  }
  
  const lastSync = PROPERTIES.getProperty('FB_LAST_SYNC') || '2026-05-01';
  const today = new Date().toISOString().slice(0, 10);
  
  // Facebook Marketing API endpoint
  const endpoint = \`https://graph.facebook.com/v18.0/\${adAccountId}/insights\`;
  
  const params = {
    access_token: accessToken,
    date_preset: 'last_30d',
    fields: 'date,impressions,clicks,spend,actions',
    time_range: JSON.stringify({ since: lastSync, until: today }),
    level: 'account'
  };
  
  const queryString = Object.entries(params)
    .map(([k, v]) => \`\${k}=\${encodeURIComponent(v)}\`)
    .join('&');
  
  try {
    const response = UrlFetchApp.fetch(endpoint + '?' + queryString);
    const data = JSON.parse(response.getContentText());
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RAW_DATA_SHEET);
    
    data.data.forEach(row => {
      const date = row.date;
      const impressions = parseInt(row.impressions, 10) || 0;
      const clicks = parseInt(row.clicks, 10) || 0;
      const spend = Math.round(parseFloat(row.spend) * 3800); // Convert USD to UGX (approx rate)
      
      // Get lead/registration actions
      const leadActions = row.actions?.find(a => a.action_type === 'lead')?.value || 0;
      
      sheet.appendRow([date, 'FB', 'Impressions', impressions]);
      sheet.appendRow([date, 'FB', 'Clicks', clicks]);
      sheet.appendRow([date, 'FB', 'Spend', spend]);
      if (leadActions > 0) {
        sheet.appendRow([date, 'FB', 'Leads', parseInt(leadActions, 10)]);
      }
    });
    
    PROPERTIES.setProperty('FB_LAST_SYNC', today);
    logSync('Facebook', data.data.length);
    
  } catch (e) {
    console.error('Facebook API Error:', e);
    sendErrorEmail('Facebook Ads Sync', e.message);
  }
}

/**
 * ============ TIKTOK ADS ============
 */
function fetchTikTokAdsData() {
  const accessToken = PROPERTIES.getProperty('TT_ACCESS_TOKEN');
  const advertiserId = PROPERTIES.getProperty('TT_ADVERTISER_ID');
  
  if (!accessToken || !advertiserId) {
    console.error('TikTok credentials not configured');
    return;
  }
  
  const lastSync = PROPERTIES.getProperty('TT_LAST_SYNC') || '2026-05-01';
  const today = new Date().toISOString().slice(0, 10);
  
  // TikTok Marketing API endpoint
  const endpoint = 'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/';
  
  const payload = {
    advertiser_id: advertiserId,
    start_date: lastSync,
    end_date: today,
    metrics: ['impressions', 'clicks', 'spend', 'conversions'],
    dimensions: ['stat_dim_date']
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Access-Token': accessToken
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const data = JSON.parse(response.getContentText());
    
    if (data.code !== 0) {
      throw new Error(data.message);
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RAW_DATA_SHEET);
    
    data.data.list.forEach(row => {
      const date = row.dimensions.date;
      const metrics = row.metrics;
      
      sheet.appendRow([date, 'TT', 'Impressions', parseInt(metrics.impressions, 10)]);
      sheet.appendRow([date, 'TT', 'Clicks', parseInt(metrics.clicks, 10)]);
      sheet.appendRow([date, 'TT', 'Spend', Math.round(parseFloat(metrics.spend) * 3800)]);
      if (metrics.conversions > 0) {
        sheet.appendRow([date, 'TT', 'Registrations', parseInt(metrics.conversions, 10)]);
      }
    });
    
    PROPERTIES.setProperty('TT_LAST_SYNC', today);
    logSync('TikTok', data.data.list.length);
    
  } catch (e) {
    console.error('TikTok API Error:', e);
    sendErrorEmail('TikTok Ads Sync', e.message);
  }
}

/**
 * ============ EMAIL (GMAIL) ============
 */
function fetchEmailData() {
  // Search for campaign emails
  const searchQuery = 'subject:"May Code Camp" after:2026/05/01';
  const threads = GmailApp.search(searchQuery);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RAW_DATA_SHEET);
  
  let totalOpens = 0;
  let totalClicks = 0;
  const today = new Date().toISOString().slice(0, 10);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      // Note: GmailApp doesn't provide open tracking directly
      // This would typically be tracked via tracking pixels in the email
      // and stored in a separate system (Mailchimp, SendGrid, etc.)
      
      // For now, we'll just count sent emails
      const body = message.getBody();
      const linkMatches = body.match(/href/g) || [];
      totalClicks += linkMatches.length; // Approximate
    });
  });
  
  // Log aggregated data
  sheet.appendRow([today, 'Email', 'Clicks', totalClicks]);
  
  logSync('Email', threads.length);
}

/**
 * ============ SMS/WHATSAPP (CSV Import) ============
 */
function importSMSReport() {
  const folderId = PROPERTIES.getProperty('SMS_REPORTS_FOLDER_ID');
  if (!folderId) return;
  
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByName('sms_report_*.csv');
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RAW_DATA_SHEET);
  
  while (files.hasNext()) {
    const file = files.next();
    const content = file.getBlob().getDataAsString();
    const rows = Utilities.parseCsv(content);
    
    // Expected format: Date,Sent,Delivered,Failed
    rows.slice(1).forEach(row => {
      const date = row[0];
      const sent = parseInt(row[1], 10);
      
      sheet.appendRow([date, 'SMS', 'Sent', sent]);
    });
    
    // Archive processed file
    file.setTrashed(true);
  }
}

/**
 * ============ UTILITY FUNCTIONS ============
 */
function logSync(platform, recordCount) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let logSheet = ss.getSheetByName('Sync Log');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('Sync Log');
    logSheet.appendRow(['Timestamp', 'Platform', 'Records', 'Status']);
  }
  
  logSheet.appendRow([new Date().toISOString(), platform, recordCount, 'Success']);
}

function sendErrorEmail(syncName, errorMessage) {
  const recipients = 'marketing@codeacademyug.org';
  const subject = \`🚨 Alert: \${syncName} Failed\`;
  const body = \`
The data sync for \${syncName} encountered an error.

Error: \${errorMessage}
Time: \${new Date().toISOString()}

Please check the Apps Script execution log for details.
  \`;
  
  MailApp.sendEmail(recipients, subject, body);
}

/**
 * ============ MASTER SYNC FUNCTION ============
 * Set this as the daily trigger
 */
function runDailySync() {
  fetchGA4Data();
  fetchFacebookAdsData();
  fetchTikTokAdsData();
  fetchEmailData();
  importSMSReport();
  
  // Update KPIs after data sync
  updateKPIs();
}

/**
 * Trigger setup instruction:
 * 1. Go to Edit → Current project's triggers
 * 2. Click "+ Add Trigger"
 * 3. Select: runDailySync, Head, Time-driven, Day timer, 6am to 7am
 */`

  const alertEngineScript = `/**
 * KPI Alert Engine - Google Apps Script
 * Runs hourly via Time-Driven Triggers
 * 
 * SETUP:
 * 1. Update SPREADSHEET_ID below
 * 2. Set up hourly trigger (Edit → Current project's triggers)
 */

const SPREADSHEET_ID = '<<DASHBOARD_SPREADSHEET_ID>>';

/**
 * Main alert check function - runs hourly
 */
function checkAlerts() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Get alert settings
  const alertSheet = ss.getSheetByName('Alert Settings');
  const alertData = alertSheet.getDataRange().getValues();
  
  // Get current KPIs
  const kpiSheet = ss.getSheetByName('KPIs');
  const kpiData = kpiSheet.getDataRange().getValues();
  
  // Skip header rows
  const alerts = alertData.slice(1);
  const kpis = kpiData.slice(1);
  
  alerts.forEach(alertRow => {
    const [metric, threshold, direction, recipients, slackChannel] = alertRow;
    
    // Find matching KPI
    const kpiRow = kpis.find(k => k[0] === metric);
    if (!kpiRow) return;
    
    const current = kpiRow[2]; // Current column (index 2)
    
    // Check if alert should trigger
    let shouldAlert = false;
    
    if (direction === 'above' && current > threshold) {
      shouldAlert = true;
    } else if (direction === 'below' && current < threshold) {
      shouldAlert = true;
    }
    
    if (shouldAlert) {
      // Check if we already alerted recently (within last 4 hours)
      const lastAlert = getAlertCooldown(metric);
      if (lastAlert) {
        const hoursSince = (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 4) {
          console.log(\`Skipping alert for \${metric} - cooldown active\`);
          return;
        }
      }
      
      // Send email alert
      const subject = \`🚨 Alert: \${metric} \${direction} threshold\`;
      const body = \`
KPI Alert Triggered

Metric: \${metric}
Current Value: \${current}
Threshold: \${threshold}
Direction: \${direction}

Time: \${new Date().toISOString()}

Please investigate the May Code Camp marketing dashboard.
Dashboard: https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}

---
May Code Camp Marketing Dashboard
      \`;
      
      const emailList = recipients.split(',').map(e => e.trim());
      MailApp.sendEmail({
        to: emailList.join(','),
        subject: subject,
        body: body
      });
      
      // Send Slack notification if configured
      if (slackChannel) {
        sendSlackNotification(slackChannel, subject, metric, current, threshold, direction);
      }
      
      // Log the alert
      logAlert(metric, current, threshold, emailList);
      
      // Set cooldown
      setAlertCooldown(metric);
    }
  });
}

/**
 * Send Slack notification via webhook
 */
function sendSlackNotification(channel, title, metric, value, threshold, direction) {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
  if (!webhookUrl) return;
  
  const payload = {
    channel: channel,
    username: 'Marketing Alerts',
    icon_emoji: ':rotating_light:',
    attachments: [{
      color: 'warning',
      title: title,
      fields: [
        { title: 'Metric', value: metric, short: true },
        { title: 'Current', value: String(value), short: true },
        { title: 'Threshold', value: String(threshold), short: true },
        { title: 'Direction', value: direction, short: true }
      ],
      footer: 'May Code Camp Dashboard',
      ts: Math.floor(Date.now() / 1000)
    }]
  };
  
  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Slack notification failed:', e);
  }
}

/**
 * Log alert to Alert Log sheet
 */
function logAlert(metric, value, threshold, recipients) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let logSheet = ss.getSheetByName('Alert Log');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('Alert Log');
    logSheet.appendRow(['Timestamp', 'Metric', 'Value', 'Threshold', 'Recipients']);
  }
  
  logSheet.appendRow([
    new Date().toISOString(),
    metric,
    value,
    threshold,
    recipients.join(', ')
  ]);
}

/**
 * Get last alert timestamp for cooldown
 */
function getAlertCooldown(metric) {
  const cooldownKey = \`ALERT_COOLDOWN_\${metric.replace(/\\s+/g, '_')}\`;
  const timestamp = PropertiesService.getScriptProperties().getProperty(cooldownKey);
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Set alert cooldown timestamp
 */
function setAlertCooldown(metric) {
  const cooldownKey = \`ALERT_COOLDOWN_\${metric.replace(/\\s+/g, '_')}\`;
  PropertiesService.getScriptProperties().setProperty(cooldownKey, new Date().toISOString());
}

/**
 * Trigger setup instruction:
 * 1. Go to Edit → Current project's triggers
 * 2. Click "+ Add Trigger"
 * 3. Select: checkAlerts, Head, Time-driven, Hour timer, Every hour
 */`

  const kpiFormulas = `/**
 * KPI Update Functions - Run after data sync
 */

function updateKPIs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rawDataSheet = ss.getSheetByName('Raw Data');
  const kpiSheet = ss.getSheetByName('KPIs');
  
  // Get raw data
  const rawData = rawDataSheet.getDataRange().getValues().slice(1);
  
  // Calculate metrics
  const totalRegistrations = rawData
    .filter(r => r[2] === 'Registrations')
    .reduce((sum, r) => sum + r[3], 0);
  
  const totalSpend = rawData
    .filter(r => r[2] === 'Spend')
    .reduce((sum, r) => sum + r[3], 0);
  
  const totalClicks = rawData
    .filter(r => r[2] === 'Clicks')
    .reduce((sum, r) => sum + r[3], 0);
  
  const totalImpressions = rawData
    .filter(r => r[2] === 'Impressions')
    .reduce((sum, r) => sum + r[3], 0);
  
  // Calculate derived metrics
  const cpa = totalRegistrations > 0 ? Math.round(totalSpend / totalRegistrations) : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
  const revenue = totalRegistrations * 15000; // Assume 15,000 UGX per registration
  const roas = totalSpend > 0 ? (revenue / totalSpend).toFixed(2) : 0;
  
  // Update KPI sheet
  // Column mapping: A=Metric, B=Target, C=Current, D=Delta%, E=Status, F=Last Updated
  const today = new Date().toISOString().slice(0, 10);
  
  updateKPIRow(kpiSheet, 'Total Registrations', 500, totalRegistrations, today);
  updateKPIRow(kpiSheet, 'Total Spend (UGX)', 5000000, totalSpend, today);
  updateKPIRow(kpiSheet, 'CPA (UGX)', 10000, cpa, today);
  updateKPIRow(kpiSheet, 'CTR (%)', 3.0, parseFloat(ctr), today);
  updateKPIRow(kpiSheet, 'ROAS', 2.5, parseFloat(roas), today);
}

function updateKPIRow(sheet, metric, target, current, date) {
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, idx) => idx > 0 && row[0] === metric);
  
  if (rowIndex === -1) {
    // Add new row
    sheet.appendRow([metric, target, current, 0, 'success', date]);
  } else {
    // Update existing row
    const delta = target > 0 ? ((current - target) / target * 100).toFixed(1) : 0;
    const status = shouldTriggerAlert(metric, current, target) ? 'warning' : 'success';
    
    sheet.getRange(rowIndex + 1, 2).setValue(target);
    sheet.getRange(rowIndex + 1, 3).setValue(current);
    sheet.getRange(rowIndex + 1, 4).setValue(parseFloat(delta));
    sheet.getRange(rowIndex + 1, 5).setValue(status);
    sheet.getRange(rowIndex + 1, 6).setValue(date);
  }
}

function shouldTriggerAlert(metric, current, target) {
  // Lower is better for CPA, higher is better for others
  if (metric === 'CPA (UGX)') {
    return current > target;
  }
  return current < target;
}`

  const sheetsFormulas = `// ============================================
// GOOGLE SHEETS FORMULAS FOR KPI TAB
// ============================================
// Copy these formulas into the KPIs sheet

// Total Registrations (Row 2, Column C)
=SUMIF('Raw Data'!C:C, "Registrations", 'Raw Data'!D:D)

// Total Spend (Row 3, Column C)
=SUMIF('Raw Data'!C:C, "Spend", 'Raw Data'!D:D)

// CPA - Cost per Acquisition (Row 4, Column C)
=IF(C2>0, C3/C2, 0)

// CTR - Click Through Rate (Row 5, Column C)
=IF(SUMIF('Raw Data'!C:C, "Impressions", 'Raw Data'!D:D)=0, 0, 
    SUMIF('Raw Data'!C:C, "Clicks", 'Raw Data'!D:D) / 
    SUMIF('Raw Data'!C:C, "Impressions", 'Raw Data'!D:D) * 100)

// ROAS (Row 6, Column C) - Assuming 15,000 UGX revenue per registration
=IF(C3=0, 0, (C2 * 15000) / C3)

// Delta % (Column D) - Formula for each row
=(C2-B2)/B2*100

// Status (Column E) - Conditional
=IF(OR(AND(A2="CPA (UGX)", C2>B2), AND(A2<>"CPA (UGX)", C2<B2)), "warning", "success")

// ============================================
// EXECUTIVE SUMMARY SHEET FORMULAS
// ============================================

// Total Spend (formatted)
=TEXT(KPIs!C3, "#,##0") & " UGX"

// CPA Status
=IF(KPIs!C4<=KPIs!B4, "✅ On Target", "⚠️ Above Target")

// Top Performing Channel (Registrations)
=INDEX(QUERY('Raw Data'!A:D, 
    "SELECT B, SUM(D) WHERE C='Registrations' GROUP BY B ORDER BY SUM(D) DESC LIMIT 1", 0), 1, 1)

// Daily Trend Sparkline (last 7 days)
=SPARKLINE(QUERY('Raw Data'!A:D, 
    "SELECT A, SUM(D) WHERE C='Registrations' GROUP BY A ORDER BY A DESC LIMIT 7", 0), 
    {"charttype", "column"; "color", "#10b981"})

// Active Alerts Count
=COUNTIF('Alert Settings'!F:F, TRUE)

// ============================================
// CONDITIONAL FORMATTING RULES
// ============================================
// Apply these via Format > Conditional formatting

// Rule 1: Status column - Green for "success"
// Range: E2:E100
// Format: Custom formula =E2="success"
// Background: #dcfce7 (green-100)

// Rule 2: Status column - Red for "warning"  
// Range: E2:E100
// Format: Custom formula =E2="warning"
// Background: #fef3c7 (amber-100)

// Rule 3: CPA cell - Red if above target
// Range: C4
// Format: Custom formula =C4>B4
// Background: #fee2e2 (red-100)

// ============================================
// QUERY FOR CHANNEL BREAKDOWN
// ============================================
// Use this in Executive Summary for channel performance

=QUERY('Raw Data'!A:D, 
    "SELECT B, SUM(D) WHERE C='Registrations' GROUP BY B PIVOT C ORDER BY SUM(D) DESC", 0)`

  const triggerSetup = `/**
 * TRIGGER SETUP INSTRUCTIONS
 * ==========================
 * 
 * 1. Open the Apps Script editor
 *    - In Google Sheets: Extensions → Apps Script
 * 
 * 2. Go to Triggers
 *    - Click the clock icon in the left sidebar
 *    - Or go to: Edit → Current project's triggers
 * 
 * 3. Add the following triggers:
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │ TRIGGER 1: Daily Data Sync                                  │
 *    ├─────────────────────────────────────────────────────────────┤
 *    │ Choose which function to run: runDailySync                  │
 *    │ Select event source: Time-driven                            │
 *    │ Select type of time based trigger: Day timer                │
 *    │ Select time of day: 6am to 7am                             │
 *    └─────────────────────────────────────────────────────────────┘
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │ TRIGGER 2: Hourly Alert Check                               │
 *    ├─────────────────────────────────────────────────────────────┤
 *    │ Choose which function to run: checkAlerts                   │
 *    │ Select event source: Time-driven                            │
 *    │ Select type of time based trigger: Hour timer               │
 *    │ Select hour interval: Every hour                            │
 *    └─────────────────────────────────────────────────────────────┘
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │ TRIGGER 3: On-Open Menu (for UTM Builder)                   │
 *    ├─────────────────────────────────────────────────────────────┤
 *    │ Choose which function to run: onOpen                        │
 *    │ Select event source: From spreadsheet                       │
 *    │ Select event type: On open                                  │
 *    └─────────────────────────────────────────────────────────────┘
 * 
 * 4. Save triggers
 * 
 * 5. Test triggers by clicking "Run" button in the script editor
 * 
 * PERMISSIONS REQUIRED:
 * - Google Sheets API (read/write)
 * - Gmail API (send emails)
 * - Analytics Data API (for GA4)
 * - External URL fetch (for Facebook/TikTok APIs)
 */

// Script Properties to configure (File → Project properties → Script properties):
/*
GA4_PROPERTY_ID=123456789
FB_ACCESS_TOKEN=your_facebook_access_token
FB_AD_ACCOUNT_ID=act_123456789
TT_ACCESS_TOKEN=your_tiktok_access_token
TT_ADVERTISER_ID=123456789
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
SMS_REPORTS_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
*/`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Google Apps Script Code
          </CardTitle>
          <CardDescription>
            Complete scripts for UTM building, data ingestion, and alerts. Copy and paste into your Google Apps Script editor.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="utm" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="utm">UTM Builder</TabsTrigger>
          <TabsTrigger value="ingestion">Data Ingestion</TabsTrigger>
          <TabsTrigger value="alerts">Alert Engine</TabsTrigger>
          <TabsTrigger value="formulas">Sheets Formulas</TabsTrigger>
        </TabsList>

        <TabsContent value="utm" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>UTM Builder Script</CardTitle>
                <CardDescription>Adds custom menu and generates UTM URLs</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(utmBuilderScript, 'utm')}>
                {copiedScript === 'utm' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Code
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                <code>{utmBuilderScript}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Data Ingestion Scripts</CardTitle>
                <CardDescription>Daily sync from GA4, Facebook, TikTok, and Email</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(dataIngestionScript, 'ingestion')}>
                {copiedScript === 'ingestion' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Code
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                <code>{dataIngestionScript}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>KPI Update Functions</CardTitle>
                <CardDescription>Calculate and update KPIs after data sync</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(kpiFormulas, 'kpi')}>
                {copiedScript === 'kpi' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Code
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-64 overflow-y-auto">
                <code>{kpiFormulas}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alert Engine Script</CardTitle>
                <CardDescription>Hourly checks for KPI threshold breaches</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(alertEngineScript, 'alerts')}>
                {copiedScript === 'alerts' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Code
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                <code>{alertEngineScript}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Google Sheets Formulas</CardTitle>
                <CardDescription>Copy into KPIs and Executive Summary sheets</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(sheetsFormulas, 'formulas')}>
                {copiedScript === 'formulas' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Formulas
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                <code>{sheetsFormulas}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trigger Setup */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Trigger Setup Instructions
            </CardTitle>
            <CardDescription>How to configure automated script execution</CardDescription>
          </div>
          <Button onClick={() => copyToClipboard(triggerSetup, 'triggers')}>
            {copiedScript === 'triggers' ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Copy Instructions
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{triggerSetup}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Required Scopes */}
      <Card>
        <CardHeader>
          <CardTitle>Required OAuth Scopes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Google Services</h4>
              <ul className="text-sm space-y-1">
                <li><Badge variant="outline" className="mr-2">https://www.googleapis.com/auth/spreadsheets</Badge></li>
                <li><Badge variant="outline" className="mr-2">https://www.googleapis.com/auth/gmail.send</Badge></li>
                <li><Badge variant="outline" className="mr-2">https://www.googleapis.com/auth/analytics.readonly</Badge></li>
                <li><Badge variant="outline" className="mr-2">https://www.googleapis.com/auth/script.external_request</Badge></li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">External APIs</h4>
              <ul className="text-sm space-y-1">
                <li>• Facebook Marketing API (ads_read permission)</li>
                <li>• TikTok Marketing API (Ad Account report)</li>
                <li>• Slack Webhook (incoming-webhook)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
