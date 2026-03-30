# PRD: CRE & Sales Performance Center (CRE Dashboard)

**Route:** `/cre-dashboard`  
**Component:** `CREDashboard.tsx`  
**Access:** Management (primary), Admin  
**Primary Users:** Managers, Directors

---

## 📌 Purpose

The CRE Performance Center gives management a comprehensive, real-time view of every CRE's call performance, conversion funnel, coaching needs, and accountability metrics. It enables data-driven coaching decisions and identifies at-risk team members instantly.

---

## 🖥️ Page Layout

```
[ Page Header + Time Period Selector ]
[ Team KPI Summary Row (5 cards) ]
[ Coaching Alerts Panel ]
[ Performance Leaderboard Table ]
[ Individual CRE Drill-Down Panel (on selection) ]
```

---

## ⚡ Features

### 1. Time Period Selector
- Tabs: **This Week** | **This Month** | **Custom**
- Current Status: UI toggle only — filtering not implemented (future)

---

### 2. Team KPI Summary Cards (5 Cards)

| Card | Metric | Threshold Colors |
|------|--------|-----------------|
| Team Avg Call Score | Average `avgCallScore` across all CREs | ≥75 = green, ≥65 = amber, <65 = red |
| Calls This Week | Sum of `callsThisWeek` | Shows delta vs last week (e.g., "+5 from last week") |
| Meetings Booked | Sum of `totalMeetingsBooked` | Green number |
| Avg Response Time | Average `avgResponseTimeMinutes` | ≤15m = green, ≤30m = amber, >30m = red |
| Follow-up Compliance | Average `followupComplianceRate%` | ≥85% = green, ≥70% = amber, <70% = red |

---

### 3. Coaching Alerts Panel

**Purpose:** Proactively surfaced alerts for CREs needing manager attention.

**Alert Levels:**
| Level | Criteria | Visual |
|-------|---------|--------|
| ✅ Good | All metrics healthy | Green success banner |
| ⚠ Needs Attention | Warning thresholds crossed | Amber left-border card |
| 🚨 Critical | Severe performance issues | Red left-border card |

**Alert Card Content:**
- CRE avatar circle (color-coded: red=critical, amber=warning)
- CRE name + role badge + alert badge (CRITICAL / NEEDS ATTENTION)
- Top 2 coaching flags as amber pill badges
- Manager's existing note (truncated italic)
- **"View Profile"** button → triggers drill-down panel

---

### 4. Performance Leaderboard Table

**Sorting:** By `effectiveScore` (descending) — computed composite score  
**Rank Medals:** 🥇🥈🥉 for top 3

**Columns:**
| Column | Content |
|--------|---------|
| Rank | Medal or number |
| CRE | Avatar + name |
| Avg Call Score | `avgCallScore` |
| Meeting Rate | `meetingSetRate%` |
| Conversion | `conversionRate%` |
| Compliance | `followupComplianceRate%` |
| Resp. Time | `avgResponseTimeMinutes`m |
| Trend | 📈 Improving / ➡️ Stable / 📉 Declining |
| Alert | Green/Amber/Red dot indicator |
| Action | "Details" button → opens drill-down |

**Mobile:** Card layout instead of table (same data)

---

### 5. Individual CRE Drill-Down Panel

Appears below the leaderboard when a CRE is selected. Auto-scrolls into view.

#### Header
- CRE avatar (color: green=good, amber=warning, red=critical)
- Name, role badge, active/inactive status
- Join date
- "X Close" button

#### Tabs
- **Overview** | **Call Analytics** | **Conversion Funnel** | **Coaching**

---

#### Tab: Overview

**Left Column:**
- Contact Phone
- Performance Trend badge (Improving/Stable/Declining)
- **Manager Note Editor:**
  - Textarea for coaching note
  - Pre-filled with existing `managerNote`
  - "Save Note" button (amber)

**Right Column — Quick Stats Grid:**
| Card | Metric |
|------|--------|
| Open Leads | `openLeadsCount` |
| Total Assigned | `totalLeadsAssigned` |
| Deals Won | `totalDealsWon` |
| Missed Follow-ups | `missedFollowupsCount` (red if > 3) |

---

#### Tab: Call Analytics

**Daily Call Score Bar Chart (CSS-based):**
- 7 bars (Mon–Sun) representing `weeklyCallScores[]`
- Bar colors: ≥80 = teal, ≥65 = amber, <65 = red
- Dashed average line across chart
- Hover tooltip shows score

**Stats Row:**
- Avg Score: `avgCallScore`
- Total Calls: `callsThisWeek`
- Avg Duration: formatted from `avgCallDuration` seconds
- vs Last Week: delta in call count (+/- with color)

**Daily Call Volume Bar Chart:**
- 7 bars for `weeklyCallCounts[]`
- Bars colored `#1F8A70` (forest green)
- Hover tooltip shows count

---

#### Tab: Conversion Funnel

**Horizontal funnel visualization (5 stages):**
1. Leads Assigned
2. Contacted
3. Qualified
4. Meetings Booked
5. Deals Won

Each stage shows:
- Bar width proportional to `totalLeadsAssigned` ratio
- Count number
- Drop-off % from previous stage (red badge if > 30%)

**Summary line:** "Overall conversion: X% of leads assigned → deals won"

---

#### Tab: Coaching

**Identified Coaching Areas:**
- Each `topCoachingFlags` entry becomes a card
- Left border: amber
- Header: flag label (e.g., "does not confirm budget early")
- **Suggested Fix:** AI-like script suggestion in Arabic/English for the specific flag

**Coaching Fix Examples:**
| Flag | Fix Script |
|------|-----------|
| `budget` | "আপনার একটা rough budget range কি আছে?" |
| `talk ratio` | "Ask open-ended questions. Target client talks 40-50%" |
| `urgency` | "আপনি কি চাচ্ছেন কাজটা কবে নাগাদ শেষ হোক?" |
| `snooze` | "Review follow-up list every morning at 9 AM." |

**Discipline & Compliance Section:**
- Follow-up Compliance Rate progress bar (green/amber/red)
- Snoozed reminders count
- Missed follow-ups count (red if > 3)

---

## 🎯 User Actions by Role

| Action | Management | Admin | CRE | Sales |
|--------|------------|-------|-----|-------|
| View team KPIs | ✅ | ✅ | — | — |
| View coaching alerts | ✅ | ✅ | — | — |
| View leaderboard | ✅ | ✅ | — | — |
| Open CRE drill-down | ✅ | ✅ | — | — |
| Write manager note | ✅ | — | — | — |
| View call analytics | ✅ | ✅ | — | — |
| View conversion funnel | ✅ | ✅ | — | — |
| View coaching flags | ✅ | ✅ | — | — |

---

## 🚨 Business Rules

1. **Alert Level Thresholds:**
   - Critical: `avgCallScore < 65` OR `followupComplianceRate < 60` OR `missedFollowupsCount > 5`
   - Warning: `avgCallScore < 75` OR `followupComplianceRate < 75`
   - Good: All metrics within acceptable range

2. **Assignment Priority:** CREs with higher `effectiveScore` get new leads first (tied to Meta Lead auto-assign)

3. **Coaching Scripts:** Contextual fixes provided in Bangla + English for each identified flag pattern

---

## ✅ Acceptance Criteria

- [ ] Team KPIs show correct aggregated totals/averages
- [ ] Coaching alerts correctly identify critical vs warning CREs
- [ ] Leaderboard sorted by `effectiveScore`, top 3 have medal icons
- [ ] Clicking "Details" or "View Profile" opens drill-down and scrolls to it
- [ ] Call analytics chart renders 7-day bars with color thresholds
- [ ] Conversion funnel shows drop-off % between stages
- [ ] Manager note saves and persists during session
- [ ] Coaching tab shows fix scripts for each flag
