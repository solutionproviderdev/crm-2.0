# Module 3 Supplement — Sales Lead Detail & Finance Management

This document extends Module 3 (Sales Module) with full documentation of the **Sales Info Details page** and the embedded **Finance / Payment Tracking** sub-system.

---

## 3.7 Sales Info Details — Lead Detail View

**Source File:** `src/components/meeting/SalesInfoDetails.tsx`  
**Route:** `/admin/sales/:leadId`, `/sales/all-meetings/:leadId`  
**Access:** Sales Executive, Admin

### Purpose
The single most comprehensive lead view in the CRM. Once a meeting is conducted (or at any point in the sales lifecycle), the Sales Executive uses this page to manage all aspects of a lead: general info, meeting history, finance, follow-up, and comments.

### Page Layout — Multi-Tab Structure (`MultipleBarTabs`)
The `SalesInfoDetails` page uses a **tab-based layout** with the following sections:

| Tab | Component | Content |
|-----|-----------|---------|
| **General** | `GeneralInformation` | Lead identity, requirements, location, CRE reference |
| **Meeting** | `MeetingsSection` / `MeetingDetail` | Meeting history and individual meeting details |
| **Finance** | `FinanceDetailsTable` | Financial summary and full payment history |
| **Follow-Up** | `SalesFollowUp` (salesDetails ver.) | Post-meeting follow-up tracker |
| **Comments** | `CommentTab` | All comments and notes on the lead |
| **Call Log** | `CallLog` | Log of call interactions |

---

### 3.7.1 General Information Tab (`GeneralInformation.tsx`)

**Displays:**
- Client name (with back navigation button)
- Phone, source, CRE agent name
- Full address (Area, District, Division)
- Project requirements text
- Project location text
- Location Map placeholder area

**Actions:**
- **Create Quotation** (blue button) — navigates to `/quotation/create/:leadId`, pre-filling client data
- **CRE Status selector** (`CreStatus`) — allows updating the lead's communication status inline

---

### 3.7.2 Finance Details Tab (`FinanceDetailsTable.tsx`)

#### Finance Summary Cards
Displays a grid of key financial metrics for the project:

| Field | Color | Description |
|-------|-------|-------------|
| Project Value | Gray | Estimated/quoted total project value |
| Client's Budget | Gray | Client's initial stated budget |
| Sold Amount | Gray | The agreed final sale amount |
| Sold Date | Gray | Date of sale confirmation |
| Total Due | Red | Outstanding balance remaining |
| Total Payment | Green | Total amount received to date |

#### Payment History Table
Full sortable table of all recorded payments:

| Column | Description |
|--------|-------------|
| Method | Payment method (Cash, Bank Transfer, Card, Mobile Banking) |
| Amount | Payment amount in BDT |
| Date | Date payment was made |
| Status | **Paid** (green) or **Pending** (yellow) |
| Note | Optional note associated with the payment |

#### Add Payment Modal
Triggered via **"Add Payment"** button. Opens a dialog with:
- **Payment Method:** Cash / Bank Transfer / Card / Mobile Banking
- **Amount:** Numeric input
- **Payment Date:** Date picker (defaults to today)
- **Status:** Paid / Pending
- **Note:** Optional free-text remark

When saved, uses `useAddPaymentMutation` (RTK Query) to update the finance record.

---

### 3.7.3 Meeting Detail Component (`MeetingDetail.tsx`)

Rendered inside the Meeting tab for each individual meeting:
- Meeting date (formatted: "March 3, 2025")
- Time slot
- Sales Executive name
- Visit charge (if applicable)
- Meeting status badge (color-coded: Sold=green, Pending=yellow, Default=gray)

---

## 3.8 Admin Finance Overview — Meeting/Sales Page (`Meeting.tsx`)

**Source File:** `src/pages/Meeting.tsx`  
**Route:** `/admin/sales`  
**Access:** Admin

### Purpose
Provides an aggregated financial dashboard across all meetings for the admin. It surfaces the total financial snapshot and allows filtering.

### Finance Stats Cards (`FinanceStatsCards.tsx`)
Shows aggregate totals across all filtered leads:
| Stat | Description |
|------|-------------|
| Total Count | Number of leads with finance data |
| Total Project Value | Sum of all project values |
| Total Payment | Sum of all payments received |
| Total Due | Sum of all outstanding balances |
| Sold Count | Leads with status "Sold" |

### Filters Available (Top Row)
- **Status filter** — dynamically populated from API `filterData.statusOptions`
- **Sales Team filter** — dropdown with profile pictures of sales executives
- **CRE filter** — dropdown with profile pictures of CRE agents
- **Date Range picker** — defaults to current month

When filters change, query parameters update and data refetches automatically.

### Meeting Toggle View (`MeetingToggleView.tsx`)
- Card-based or list-based display of meetings (toggle switch)
- Each `MeetingCard.tsx` shows key info with status badge
- Skeleton loading state for all cards during data fetch

---

## 3.9 Create Meeting Modal (`CreateMeeting.tsx`)

**Source File:** `src/pages/CreateMeeting.tsx`  
**Access:** Admin, CRE (launched from various scheduling entry points)

### Purpose
A 4-tab dialog modal to create a new meeting in the system.

### Tab 1: Lead Info
| Field | Required | Description |
|-------|----------|-------------|
| Lead Name | ✅ | The lead's name |
| Requirement | ✅ | Client's interior/project requirements |

### Tab 2: Meeting Info
| Field | Required | Description |
|-------|----------|-------------|
| Date | ✅ | Date of the meeting |
| Time | ✅ | Time of the meeting |
| Location | ✅ | Meeting location type (Inside / Outside) |

### Tab 3: Project Info
| Field | Required | Description |
|-------|----------|-------------|
| Project Status | ✅ | Ongoing / Complete / Pending / Canceled |
| Sales Team | ✅ | Sales executive assigned to the meeting |

### Tab 4: Additional Info
| Field | Required | Description |
|-------|----------|-------------|
| Visit Charge | — | Consultation/visit fee amount |
| Rating | — | Meeting quality rating (numeric) |
| Sales Final | ✅ | Outcome: Prospect / Done / Follow Up / Closed |
| Status | ✅ | Execution status: Pending / Complete / Rescheduled / Canceled |
