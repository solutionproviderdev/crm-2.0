# Module 3 — Sales Module

The Sales module is the personal workspace for Sales Executives. It covers pipeline management, meeting tracking, follow-ups, and quotation creation.

---

## 3.1 Sales Dashboard

**Source File:** `src/pages/sales/SalesDashboard.tsx`  
**Route:** `/sales/dashboard`  
**Access:** Sales Executive

### Purpose
Shows the Sales Executive's personal performance metrics, monthly goals, meeting data, pipeline, and recent activity.

### Page Sections

#### Header Card
- Profile picture and name (from logged-in user)
- Incentive Amount (৳) in top-right
- Performance Score (calculated via conversion × collection rate formula)

#### Stats Grid (6 columns)
| Stat | Icon | Color |
|------|------|-------|
| Total Project Value | DollarSign | Purple |
| Follow Up (count + value) | Clock | Slate |
| Prospects (count + value) | Users | Orange |
| Sold (count + value) | CheckCircle2 | Blue |
| Total Paid | CheckCircle2 | Emerald |
| Total Due | AlertCircle | Red |

#### Main Content Grid (3 columns)
1. **Monthly Goals Panel**
   - Sales Target: progress bar showing achieved % of target
   - Collection Target: progress bar showing collected %
   
2. **Recent Activity Panel**
   - Timeline of actions with icons and timestamps
   - Shows: lead created, status changed, meeting set, reminder set, comment added
   - Max 30 most recent items

3. **Conversion Funnel Panel**
   - Visual funnel: Meetings → Prospects → Sold → Measured → Handover
   - Shows conversion rate % between stages
   - Overall conversion rate displayed prominently

#### Weekly Meetings Chart
- Bar chart (Recharts) comparing scheduled vs completed meetings
- X-axis: Mon–Sun
- Two bar series: Scheduled (slate) and Completed (emerald)

#### Tabs Section
**Sales Pipeline tab:**
- Action Items showing cold leads, payment delays, incomplete leads (with alert badges)
- Contextual alerts with count and description

**Insights & Tips tab:**
- Tips and recommendations for improving performance

### Performance Score Formula
```
conversionRate = (sold / meetings) × 100
collectionRate = (paidValue / soldValue) × 100
performanceScore = conversionRate × 0.6 + collectionRate × 0.4
incentiveAmount = round(performanceScore × 1000)
```

---

## 3.2 Sales All Meetings

**Source File:** `src/pages/sales/SalesAllMeeting.tsx`  
**Route:** `/sales/all-meetings`, `/admin/all-meetings`  
**Access:** Sales Executive, Admin

### Purpose
Complete paginated list of all meetings for the executive (or all executives for Admin). Supports rich filtering.

### Features
- Filter by date range
- Filter by meeting status (Complete, Reschedule, Cancel, etc.)
- Search by lead name or phone
- View meeting details including CRE who arranged it
- Click meeting → opens `SalesInfoDetails` detail page
- Pagination support

### Meeting Data Displayed
- Lead name, phone, address
- Assigned CRE name
- Meeting date and time slot
- Meeting status badge (color-coded)
- Notes/comments count

---

## 3.3 Sales Today's Meetings

**Source File:** `src/pages/sales/SalesTodayMeeting.tsx`  
**Route:** `/sales/today-meeting`  
**Access:** Sales Executive

### Purpose
Focused view of only today's scheduled meetings. Helps the executive prepare for their day.

### Features
- Auto-filtered to current date
- Meeting list with time slots sorted chronologically
- Quick status update (Complete, Reschedule, Cancel) inline
- Click to view full lead/meeting details

---

## 3.4 Sales Follow-Up

**Source File:** `src/pages/sales/SalesFollowUp.tsx`  
**Route:** `/sales/follow-up`, `/admin/sales-follow-up`  
**Access:** Sales Executive, Admin

### Purpose
Manages post-meeting follow-up tasks via a comprehensive dashboard that tracks task completions, missed opportunities, and upcoming engagements. The interface focuses on pipeline progression towards closing the sale.

### Sub-Components & Features
**1. Status Summary Cards:**
Displays the total counts for follow-ups classified as:
- **Pending:** Awaiting action
- **Complete:** Successfully executed actions
- **Late Complete:** Overdue but finished
- **Missed:** Failed follow-up opportunities

**2. Follow-Up Lead Cards (`FollowUpCard.tsx`):**
- Displays the client's name, assigned CRE, meeting details, and exact follow-up deadlines
- Allows updating the lead's status directly from the card (e.g., Prospect, Sold, Handover, Measurement)
- Quick-action buttons: "Call Now", "Open Chat", "Mark Complete"

**3. Integrated Chat Window (`ChatWindow.tsx`):**
- By clicking the chat icon on a follow-up card, a floating chat window opens.
- The Sales Executive can view the lead's message history to understand the exact context before making a call or responding.

**4. Filtering:**
- Filter by date range (Today by default)
- Filter by Status (Pending, Complete, Late Complete, Missed)
- Admin can filter by Sales Executive

---

## 3.5 Sales Info Details

**Source File:** `src/components/meeting/SalesInfoDetails.tsx`  
**Route:** `/sales/:leadId`, `/admin/sales/:leadId`  
**Access:** Sales Executive, Admin

### Purpose
Full detail view of a lead from the Sales Executive's perspective. Shows all meeting information, client details, history, and actions.

### Sections
- Client Info (name, phone, address, project location)
- Meeting Info (date, slot, CRE who referred, status)
- Lead Status & Communication History
- Notes & Comments
- Action buttons (Update Status, Add Comment, Create Quotation link)

---

## 3.6 Sales Quotation Access

**Route:** `/sales/quotation`  
**Access:** Sales Executive

Provides access to the Quotation Creation page. See Module 5 (Quotation) for full documentation.
