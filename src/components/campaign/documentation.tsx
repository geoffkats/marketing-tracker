'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  FileText, 
  Copy, 
  Check, 
  BookOpen,
  ListChecks,
  Video,
  HelpCircle,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

export function Documentation() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Content copied to clipboard!')
    setTimeout(() => setCopied(null), 2000)
  }

  const sopDocument = `# May Code Camp – Tracking System SOP

## Standard Operating Procedure
**Campaign:** May Code Camp 2026  
**Period:** 4 – 21 May 2026  
**Organization:** Code Academy Uganda  
**Last Updated:** May 2026

---

## 1. Overview & Purpose

This document provides the standard operating procedures for the May Code Camp marketing campaign tracking system. The system is designed to:

- Centralize all campaign assets and tracking links
- Automate data collection from multiple marketing platforms
- Provide real-time KPI monitoring and reporting
- Alert stakeholders when metrics exceed defined thresholds

### System Components

| Component | Purpose | Access |
|-----------|---------|--------|
| Google Drive Folder | Asset storage | All stakeholders |
| Dashboard Spreadsheet | KPI tracking & reporting | Marketing (edit), Leadership (view) |
| Apps Scripts | Automation | Marketing Manager only |
| Alert System | Notifications | Automatic |

---

## 2. Folder & File Naming Conventions

### Google Drive Structure

\`\`\`
/May Code Camp Marketing
├── 0_Assets (shared folder)
│   ├── Images/          → Hero banners, ads, social graphics
│   ├── Videos/          → Promo videos, stories, reels
│   ├── Copy/            → Email copy, ad copy, scripts
│   └── Contracts/       → Influencer contracts, vendor agreements
├── 1_UTM Links          → Spreadsheet with all tracking URLs
├── 2_Reporting          → Dashboard spreadsheet
└── 3_Archive            → Old assets, previous versions
\`\`\`

### Naming Convention

**Assets:** \`[Campaign]_[Type]_[Description]_v[Version].[ext]\`  
Example: \`MayCodeCamp_Hero_Banner_1920x1080_v2.png\`

**UTM Content:** \`[ad_format]_[audience]_[variation]\`  
Example: \`hero_banner_18-25_A\`

---

## 3. Step-by-Step Guides

### 3.1 Adding a New Asset

1. **Prepare the file**
   - Ensure file follows naming convention
   - Verify it's the correct version
   - Remove any confidential metadata

2. **Upload to Google Drive**
   - Navigate to correct subfolder in \`0_Assets\`
   - Upload file or drag-and-drop
   - Get shareable link (right-click → Share → Copy link)

3. **Register in Assets Sheet**
   - Open Dashboard Spreadsheet → Assets tab
   - Click "Add Asset" or add new row
   - Fill in: Asset ID, Type, File Name, Drive Link, Owner, Version, Status

4. **Set Permissions**
   - Right-click file → Share
   - Add appropriate groups (marketing-team, leadership, etc.)
   - Set permission level (Editor, Viewer, Commenter)

### 3.2 Generating a UTM Link

1. **Open UTM Parameters Sheet**
   - Go to Dashboard Spreadsheet → UTM Parameters tab

2. **Use the UTM Builder Menu**
   - Click "UTM Builder" → "Generate URL" from menu bar

3. **Fill in Required Fields**
   - **Channel:** Select from dropdown (FB, IG, TT, Google, Email, SMS, LinkedIn)
   - **Source:** Traffic source (e.g., facebook, instagram)
   - **Medium:** Marketing medium (e.g., paid_social, cpc, email)
   - **Content:** Ad identifier (e.g., hero_banner_18-25)
   - **Term:** (Optional) Keywords for search ads
   - **Final URL:** Landing page URL

4. **Generate and Copy**
   - Click "Generate" in the dialog
   - UTM URL is automatically created and saved
   - Copy the URL for use in your ad platform

### 3.3 Requesting a New Data Source

1. **Identify the Platform**
   - Document the platform name and data needed
   - Check if API access is available

2. **Obtain API Credentials**
   - Request access token/API key from platform
   - Store credentials securely (never in code!)

3. **Configure in Script Properties**
   - Open Apps Script editor
   - File → Project properties → Script properties
   - Add key-value pair for credentials

4. **Deploy Updated Script**
   - Add the ingestion function to \`runDailySync()\`
   - Test with manual run
   - Set up trigger if successful

### 3.4 Interpreting the Executive Summary

**Key Metrics at a Glance:**

| Metric | Meaning | Target |
|--------|---------|--------|
| Total Registrations | Sign-ups for Code Camp | 500 |
| Total Spend | Money spent on ads | ≤ 5,000,000 UGX |
| CPA | Cost per registration | ≤ 10,000 UGX |
| CTR | Click-through rate | ≥ 3% |
| ROAS | Return on ad spend | ≥ 2.5x |

**Status Indicators:**
- ✅ Green = On track (meeting target)
- ⚠️ Amber = Needs attention (close to or exceeding threshold)
- 🔴 Red = Critical (exceeded threshold, action required)

### 3.5 Modifying Alert Thresholds

1. **Open Alert Settings Sheet**
   - Navigate to Dashboard → Alert Settings tab

2. **Edit Threshold Value**
   - Find the metric row
   - Update the Threshold column

3. **Add/Remove Recipients**
   - Edit Recipient Emails column (comma-separated)
   - Optionally add Slack channel

4. **Enable/Disable Alert**
   - Toggle the Active switch
   - Alert will be evaluated on next hourly check

---

## 4. Troubleshooting Checklist

### Script Errors

- [ ] Check script execution log (Apps Script → Executions)
- [ ] Verify API credentials haven't expired
- [ ] Check if API rate limits exceeded
- [ ] Ensure spreadsheet IDs are correct
- [ ] Verify script has necessary permissions

### Missing Data

- [ ] Check if data source is connected (Data Sources tab)
- [ ] Verify last sync timestamp
- [ ] Check for API errors in execution log
- [ ] Ensure date range includes expected data
- [ ] Check if filters are hiding data

### Alerts Not Sending

- [ ] Verify alert is active (Alert Settings)
- [ ] Check recipient email format
- [ ] Verify MailApp permissions
- [ ] Check if alert is in cooldown period (4 hours)
- [ ] Test with manual script run

### UTM Links Not Tracking

- [ ] Verify URL is correct in ad platform
- [ ] Check landing page has GA4 installed
- [ ] Ensure UTM parameters aren't being stripped
- [ ] Verify case sensitivity matches

---

## 5. Access & Permissions Matrix

| Role | Who | Assets | Dashboard | Scripts |
|------|-----|--------|-----------|---------|
| Owner | marketing-manager@codeacademyug.org | Full | Full | Full |
| Editor | marketing-team@codeacademyug.org | Edit | Edit | Run only |
| Viewer | leadership@codeacademyug.org | View | View | None |
| Commenter | external agency | Comment | Comment | None |

---

## 6. Support Contacts

- **System Owner:** marketing-manager@codeacademyug.org
- **Technical Support:** tech@codeacademyug.org
- **Campaign Lead:** campaigns@codeacademyug.org

---

*Document Version: 1.0*  
*Created: April 2026*  
*Next Review: May 2026*`

  const onboardingChecklist = `# May Code Camp Tracking System - Onboarding Checklist

## New Team Member Setup

Complete this checklist to get full access to the campaign tracking system.

---

### ✅ Access Setup (Day 1)

- [ ] **Google Drive Access**
  - [ ] Request access to "May Code Camp Marketing" folder
  - [ ] Verify you can view all subfolders
  - [ ] Test upload to your assigned folder

- [ ] **Dashboard Access**
  - [ ] Open Dashboard Spreadsheet
  - [ ] Verify edit permissions (or view-only if leadership)
  - [ ] Bookmark the spreadsheet

- [ ] **Communication Channels**
  - [ ] Join #marketing-alerts Slack channel
  - [ ] Add email to relevant Alert Settings
  - [ ] Confirm test notification received

---

### ✅ Training (Day 2-3)

- [ ] **Watch Training Video**
  - [ ] Complete 2-minute walkthrough video
  - [ ] Review this SOP document

- [ ] **Hands-On Practice**
  - [ ] Upload a test asset to your folder
  - [ ] Register asset in Assets sheet
  - [ ] Generate a test UTM link
  - [ ] Review Executive Summary

- [ ] **Understand Data Flow**
  - [ ] Review Data Sources configuration
  - [ ] Understand where metrics come from
  - [ ] Know how to check last sync times

---

### ✅ Campaign Preparation (Day 4-5)

- [ ] **Platform Setup**
  - [ ] Verify access to assigned ad platforms
  - [ ] Confirm UTM parameters are configured correctly
  - [ ] Test tracking with a sample link

- [ ] **Asset Preparation**
  - [ ] Review approved creative assets
  - [ ] Understand version control process
  - [ ] Know approval workflow for new assets

- [ ] **Alert Configuration**
  - [ ] Understand alert thresholds
  - [ ] Know escalation procedures
  - [ ] Have contact info for technical support

---

### ✅ Go-Live Checklist

- [ ] All access permissions verified
- [ ] Training completed and signed off
- [ ] First asset uploaded and registered
- [ ] First UTM link generated
- [ ] Test alert received
- [ ] Dashboard bookmarked
- [ ] Questions answered by system owner

---

## Quick Reference Card

| Task | Location | Steps |
|------|----------|-------|
| Add Asset | Drive → 0_Assets | Upload → Register in sheet |
| Create UTM | Dashboard → UTM tab | Menu → Fill form → Generate |
| Check KPIs | Dashboard → Executive Summary | View auto-updated metrics |
| View Alerts | Dashboard → Alert Log | See triggered alerts |
| Update Alert | Dashboard → Alert Settings | Edit threshold/recipients |

---

## Key Contacts

| Role | Name | Email |
|------|------|-------|
| System Owner | [Name] | marketing-manager@codeacademyug.org |
| Campaign Lead | [Name] | campaigns@codeacademyug.org |
| Tech Support | [Name] | tech@codeacademyug.org |

---

*Onboarding completed: ____________ (date)*  
*Signed off by: ____________ (manager)*`

  const videoScript = `# Video Walkthrough Script
## May Code Camp Tracking System Overview
**Duration:** ~2 minutes

---

### [0:00-0:15] INTRO

**Visual:** Dashboard homepage with campaign branding

**Narrator:** 
"Welcome to the May Code Camp Marketing Dashboard. This system tracks all your campaign assets, UTM links, and key performance metrics in one place."

---

### [0:15-0:45] ASSETS MANAGEMENT

**Visual:** Navigate to Assets tab, show folder structure

**Narrator:** 
"All your creative assets live here in Google Drive, organized by type. The Assets sheet keeps track of every file, its version, and approval status. To add a new asset, simply upload to the correct folder, then register it here with the drive link."

**Action:** Demonstrate adding an asset

---

### [0:45-1:15] UTM BUILDER

**Visual:** Navigate to UTM Parameters tab, use the menu

**Narrator:** 
"Creating trackable links is easy. Go to the UTM tab, click the UTM Builder menu, and select Generate URL. Fill in the channel, source, medium, and a descriptive content name. The system creates a properly formatted UTM link that's automatically tracked in Google Analytics."

**Action:** Generate a sample UTM link

---

### [1:15-1:45] DASHBOARD & ALERTS

**Visual:** Show Executive Summary with live metrics

**Narrator:** 
"The Executive Summary gives you a real-time view of campaign performance. Total registrations, spend, CPA, and ROAS are all calculated automatically from your ad platforms. If any metric exceeds its threshold, the system sends email alerts to the configured recipients."

**Action:** Show an alert notification example

---

### [1:45-2:00] CLOSING

**Visual:** Return to dashboard overview

**Narrator:** 
"That's your quick overview. Check out the full SOP document for detailed procedures, and reach out to the marketing team if you have questions. Happy campaigning!"

**End card:** Contact information and documentation link

---

## Production Notes

**Equipment needed:**
- Screen recording software (Loom, OBS, or Camtasia)
- High-quality microphone
- Stable internet connection

**Preparation:**
- Prepare sample data in dashboard
- Clear browser cache for clean recording
- Close unnecessary applications
- Enable "Do Not Disturb" mode

**Post-production:**
- Add campaign branding to intro/outro
- Include chapter markers if platform supports
- Add captions for accessibility
- Export at 1080p minimum`

  const troubleshootingGuide = `# Troubleshooting Guide

## Common Issues & Solutions

### 1. Script Execution Errors

**Error: "Authorization required"**
- Cause: Script lacks necessary permissions
- Solution: Run the script manually once, accept permission prompts

**Error: "API rate limit exceeded"**
- Cause: Too many API calls in short period
- Solution: Wait 1 hour, reduce sync frequency if persistent

**Error: "Invalid credentials"**
- Cause: API token expired or revoked
- Solution: Regenerate token in platform, update Script Properties

### 2. Data Discrepancies

**Issue: Numbers don't match platform dashboard**
- Possible causes:
  - Different date ranges
  - Different attribution models
  - API delay (up to 24 hours)
- Solution: Wait 24 hours, verify date ranges match

**Issue: Missing data for specific date**
- Check: Was sync script running that day?
- Check: Were there any API errors in execution log?
- Solution: Manually run sync for missing dates

### 3. UTM Tracking Issues

**Issue: GA4 shows (not set) for UTM parameters**
- Cause: UTM stripped by redirect or browser
- Solution: Use UTM validation tool, check for redirects

**Issue: Wrong source/medium attributed**
- Cause: Multiple UTMs or campaign overlap
- Solution: Use unique content IDs, check last-click attribution

### 4. Alert Issues

**Issue: Not receiving alerts**
- Check: Is alert active in Alert Settings?
- Check: Is email spelled correctly?
- Check: Check spam/promotions folders
- Check: Is alert in 4-hour cooldown?

**Issue: Too many alerts**
- Cause: Thresholds too sensitive
- Solution: Adjust thresholds or increase cooldown

### 5. Access Issues

**Issue: Can't edit spreadsheet**
- Cause: View-only permission
- Solution: Request edit access from owner

**Issue: Can't run scripts**
- Cause: Not authorized to run scripts
- Solution: Owner must share script with edit access

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| E001 | Spreadsheet not found | Verify SPREADSHEET_ID |
| E002 | Sheet tab missing | Create missing tab |
| E003 | API auth failed | Check credentials |
| E004 | Rate limit hit | Wait and retry |
| E005 | Invalid data format | Check data structure |

---

## Escalation Path

1. **Level 1:** Check this troubleshooting guide
2. **Level 2:** Review Apps Script execution logs
3. **Level 3:** Contact marketing-team@codeacademyug.org
4. **Level 4:** Escalate to tech@codeacademyug.org

**Response SLAs:**
- P1 (System down): 1 hour
- P2 (Data missing): 4 hours  
- P3 (Minor issue): 24 hours`

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sop" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sop">SOP Document</TabsTrigger>
          <TabsTrigger value="checklist">Onboarding</TabsTrigger>
          <TabsTrigger value="video">Video Script</TabsTrigger>
          <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="sop" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Standard Operating Procedure
                </CardTitle>
                <CardDescription>Complete SOP for the tracking system</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(sopDocument, 'sop')}>
                {copied === 'sop' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto">
                  {sopDocument}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Onboarding Checklist
                </CardTitle>
                <CardDescription>New team member setup guide</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(onboardingChecklist, 'checklist')}>
                {copied === 'checklist' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Checklist
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto">
                {onboardingChecklist}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Walkthrough Script
                </CardTitle>
                <CardDescription>2-minute Loom recording script</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(videoScript, 'video')}>
                {copied === 'video' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Script
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto">
                {videoScript}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshoot" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Troubleshooting Guide
                </CardTitle>
                <CardDescription>Common issues and solutions</CardDescription>
              </div>
              <Button onClick={() => copyToClipboard(troubleshootingGuide, 'troubleshoot')}>
                {copied === 'troubleshoot' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Guide
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto">
                {troubleshootingGuide}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Download Templates</CardTitle>
          <CardDescription>CSV templates for bulk import</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Assets Template (CSV)
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              UTM Parameters Template (CSV)
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Raw Data Template (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
