# Module 07 — Dashboard | Admin View

## Purpose

The Dashboard module provides **real-time analytics and KPI tracking** for administrators. It consolidates data from leads, meetings, and CRE performance to give a comprehensive business overview.

---

## Dashboard Widgets & Data Points

### 1. Lead Overview

- **API:** `GET /dashboard/lead-overview`
- Total leads by status (pipeline summary)
- Leads by source (Facebook, WhatsApp, Phone, Web)
- New leads added today / this week / this month

### 2. CRE Performance Overview

- **API:** `GET /dashboard/cre-performance`
- For each CRE:
  - Total leads assigned
  - Leads replied vs. unreplied
  - Follow-ups completed vs. missed
  - Reminders completed vs. missed
  - Response time averages

### 3. CRE Individual Performance

- **API:** `GET /dashboard/cre-performance/:creId`
- Drill down into a single CRE's detailed stats
- Historical trend of KPIs

### 4. CRE Incentive

- **API:** `GET /dashboard/:creId/cre-incentive`
- Calculates incentive earned based on performance benchmarks

### 5. Meeting Analytics

- **API:** `GET /dashboard/meetings`
- Meetings by status for current week/month
- Per Sales Executive breakdown

### 6. Meeting Bar Chart

- **API:** `GET /dashboard/meeting-barchart`
- Day-wise and weekday-wise meeting distribution
- Useful for identifying peak scheduling days

### 7. Monthly Meeting Data

- **API:** `GET /dashboard/monthly-meeting-data`
- Month-by-month meeting counts
- Status breakdown per month

### 8. Date-Wise Lead Data

- **API:** `GET /dashboard/date-wise-lead-data`
- Lead intake trend by day
- Useful for spotting campaign performance spikes

### 9. Follow-Up Statistics

- **API:** `GET /dashboard/follow-up-stats`
- Total pending / completed / missed follow-ups
- Breakdown by CRE

### 10. Notifications Panel

- **API:** `GET /dashboard/notifications`
- System-wide alerts:
  - Unread messages
  - Pending reminders
  - Missed follow-ups
  - Meetings today

---

## Data Access Rules

| Widget                    | Roles with Access      |
|---------------------------|------------------------|
| All CRE performance       | Admin only             |
| Individual CRE performance| Admin + that CRE       |
| Meeting analytics         | Admin + Sales Executive|
| Lead overview             | Admin + CRE            |
| Notifications             | All roles              |

---

## Filters Available

| Filter          | Description                                |
|-----------------|--------------------------------------------|
| Date Range      | Custom start/end date for most widgets     |
| CRE             | Filter by specific CRE                     |
| Sales Executive | Filter meeting data by SE                  |
| Source          | Filter leads by channel                    |
