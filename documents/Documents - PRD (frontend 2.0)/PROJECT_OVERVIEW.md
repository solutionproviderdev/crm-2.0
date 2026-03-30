# Solution Provider CRM — Project Overview & Technical Reference

---

## 🏢 Product Summary

**Brand Name:** Solution Provider  
**Tagline:** "Advance Intelligent Interior Design Software / We Provide Solutions to Make Things Easier"  
**Contact:** 01949-654499

### Business Purpose
A fully integrated CRM and operations management system for a premium interior design company in Dhaka, Bangladesh. The system covers:
- Lead generation and qualification pipeline
- CRE (sales agent) performance tracking and coaching
- Meeting scheduling, AI-based meeting analysis, and follow-up automation
- Project lifecycle management from deal-won to final handover
- Factory production tracking
- Marketing analytics

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Routing | React Router DOM v6 |
| State Management | React `useState` (local component state) |
| Charts | Recharts (BarChart, LineChart, PieChart) |
| UI Components | Custom Tailwind CSS (utility-first classes inline) |
| Icons | Lucide React |
| AI Integration | Google Gemini API (`@google/genai` — `gemini-3.1-pro-preview`) |
| Build Tool | Vite |
| Language | TypeScript |

---

## 👥 User Roles & Access

```typescript
export const UserRole = ['CRE', 'Sales', 'Admin', 'Management'] as const;
```

| Role | Description | Key Modules |
|------|-------------|-------------|
| `CRE` | Customer Relationship Executive — first contact, calls, lead qualification | Leads, AI Assistant |
| `Sales` | Sales Rep — site visits, meetings, quotations | Meetings, Projects |
| `Admin` | System administrator | Full access + Meta Leads |
| `Management` | Owner / Director level oversight | Dashboard, CRE Dashboard, Reports, Marketing |

---

## 📊 Lead Pipeline (Status Flow)

```
New Lead
  → Attempted Contact
  → Contacted
  → Qualified
  → Consultation Scheduled
  → Site Visit Done
  → Design Discussion
  → Quotation in Preparation
  → Quotation Sent
  → Follow-up After Quotation
  → Negotiation
  → Deal Won / Deal Lost / Nurture
```

---

## 🏗️ Project Stage Flow

```
Design Approval
  → Material Selection
  → Production Started
  → Factory Progress
  → Delivery Scheduled
  → Installation Running
  → Final Handover
```

---

## 🏭 Factory Order Status Flow

```
Order Received → Cutting → Assembly → Finishing → Ready for Delivery
```

---

## 📋 Data Models

### Lead
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID (e.g. `L-1001`) |
| `name` | string | Client name |
| `phone` | string | Phone number |
| `location` | string | Address/area |
| `budgetRange` | string | Budget bracket |
| `propertyType` | enum | Apartment, House, Office, Shop, Commercial, Kitchen Only |
| `serviceInterest` | enum | Full Interior, Kitchen Cabinet, Wardrobe, Custom Furniture, Office Interior, Folding Door, Renovation, Design Only |
| `source` | enum | Meta Ads, Google, Website, Referral, Organic |
| `assignedCRE` | string | Assigned CRE name |
| `status` | LeadStatusType | Current pipeline stage |
| `followUpDate` | string | ISO datetime for next follow-up |
| `notes` | string | Free-text notes |
| `lastInteraction` | string | ISO datetime of last interaction |
| `urgencyLevel` | enum | Low, Medium, High |
| `decisionMakerStatus` | string | Decision Maker / Influencer / Joint Decision |
| `leadTemperature` | enum | Cold, Warm, Hot |
| `qualificationScore` | number | 0–100 |
| `conversionProbability` | number | 0–100 (%) |
| `priorityTag` | enum | High, Medium, Low |
| `riskFlag` | string\|boolean | Risk description or false |
| `expectedDealValue` | number | Expected deal amount in BDT |

### MetaLead (Raw Facebook Ad Lead)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Internal ID |
| `metaFormId` | string | Meta Lead Form ID |
| `campaignName` | string | Facebook campaign name |
| `adSetName` | string | Ad set name |
| `fullName` | string | Prospect name |
| `phone`, `email` | string | Contact details |
| `location` | string | Area |
| `serviceInterest`, `propertyType`, `budgetRange` | string | Intake form data |
| `message` | string\|null | Optional message |
| `importStatus` | enum | pending, imported, duplicate, failed |
| `importedLeadId` | string\|null | Linked CRM lead ID after import |
| `assignedCREId`, `assignedCREName` | string\|null | Auto-assigned CRE |
| `assignmentScore` | number\|null | CRE effective score at assignment time |

### MeetingSession
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Session ID |
| `leadId` | string | Linked lead |
| `salesUserId`, `salesUserName` | string | Sales rep |
| `clientName`, `clientPhone` | string | Client details |
| `serviceInterest`, `propertyType`, `budgetRange` | string | Project details |
| `meetingType` | enum | site_visit, office_visit, virtual |
| `status` | enum | scheduled, in_progress, completed, cancelled |
| `outcome` | enum | quotation_requested, follow_up_needed, deal_closed, not_interested, pending_decision, no_show |
| `transcriptClient`, `transcriptSales` | string\|null | Meeting transcripts |
| `analysis` | MeetingAnalysis\|null | AI-generated analysis |
| `managerNote` | string\|null | Manager coaching note |

### MeetingAnalysis
| Field | Description |
|-------|-------------|
| `clientRequirements` | List of stated needs |
| `clientPainPoints` | Pain points identified |
| `clientBudgetSignal` | confirmed / hinted / avoided / unknown |
| `clientDecisionReadiness` | ready / needs_time / needs_family / unclear |
| `clientSentiment` | positive / neutral / negative / mixed |
| `clientObjections` | List of objections raised |
| `salesStrengths` | What the rep did well |
| `salesLackings` | Where the rep fell short |
| `meetingScore` | 0–100 meeting quality score |
| `winProbability` | 0–100 probability of winning deal |
| `suggestedNextStep` | Recommended next action |
| `aiGeneratedFollowUpScript` | WhatsApp/call script |

### CREProfile
Performance tracking model with:
- **Call KPIs:** `callQualityScore`, `avgCallScore`, `callsThisWeek`, `avgCallDuration`
- **Conversion:** `totalLeadsAssigned`, `totalContacted`, `totalQualified`, `totalMeetingsBooked`, `totalDealsWon`
- **Follow-up Discipline:** `followupComplianceRate`, `avgResponseTimeMinutes`, `snoozedRemindersCount`, `missedFollowupsCount`
- **Coaching:** `topCoachingFlags`, `improvementTrend`, `managerNote`
- **Trend Data:** `weeklyCallScores[]`, `weeklyCallCounts[]`

---

## 📱 Application Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Login` | Authentication page |
| `/dashboard` | `Dashboard` | Main KPI overview |
| `/leads` | `Leads` | CRM & Lead Management |
| `/meta-leads` | `MetaLeads` | Meta Ad Lead Import Center |
| `/cre-dashboard` | `CREDashboard` | CRE Performance Center |
| `/meetings` | `Meetings` | Meeting Intelligence |
| `/projects` | `Projects` | Project Management |
| `/factory` | `Factory` | Factory & Production |
| `/reports` | `Reports` | Daily Reports |
| `/ai-assistant` | `AIAssistant` | AI-powered tools |
| `/marketing` | `Marketing` | Marketing Analytics |
