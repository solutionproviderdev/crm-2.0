# PRD: Main Dashboard

**Route:** `/dashboard`  
**Component:** `Dashboard.tsx`  
**Access:** All authenticated roles  
**Primary Users:** Management, Admin

---

## 📌 Purpose

The Dashboard is the central command view for the entire business. It provides a real-time snapshot of sales performance, lead generation, CRE team metrics, and the Meta → CRM lead pipeline. It is designed for quick management decision-making.

---

## 🖥️ Page Layout

```
[ Page Header: "Sales & Operations Dashboard" | Time Period Selector ]
[ KPI Cards Row (5 cards) ]
[ Charts Row (2 charts) ]
[ Meta → CRM Conversion Banner ]
[ Call Performance KPIs (3 cards) ]
[ CRE Performance Ranking Table ]
```

---

## ⚡ Features

### 1. Time Period Selector
- **Type:** Dropdown select
- **Options:** Last 7 Days | This Month | This Quarter
- **Current Status:** UI only (filter logic not implemented — future)
- **Position:** Top right of page header

---

### 2. KPI Summary Cards (5 Cards)

| Card | Metric | Icon | Color | Data Source |
|------|--------|------|-------|-------------|
| Total Active Leads | `142` | Users | Blue | Static mock |
| Meta Leads Today | Dynamic count | Zap | Amber | `mockMetaLeads.length` |
| Conversion Rate | `18.5%` | TrendingUp | Emerald | Static mock |
| Deals Closed (MTD) | `12` | CheckCircle | Indigo | Static mock |
| Pending Follow-ups | `24` | Clock | Amber | Static mock |

**Meta Leads Card (special behavior):**
- Shows sub-text: `{pendingCount} pending`
- Is a **clickable link** → navigates to `/meta-leads`
- All other cards are static display (not clickable)

---

### 3. Lead Generation vs Closed Deals Chart
- **Type:** Line Chart (Recharts `LineChart`)
- **X-axis:** Day of week (Mon–Sun)
- **Lines:**
  - Blue: New Leads
  - Green: Closed Deals
- **Data:** Static weekly sample data

---

### 4. Sales Funnel Drop-off Chart
- **Type:** Horizontal Bar Chart (Recharts `BarChart` — layout: vertical)
- **Y-axis:** Funnel stages (New Leads, Qualified, Consultation, Quotation, Closed)
- **Values:** 150 → 80 → 45 → 25 → 12
- **Bar Color:** Indigo (`#6366f1`)
- Shows where leads are being lost in the pipeline

---

### 5. Meta → CRM Conversion Banner
A summary banner showing today's Meta Lead processing status:

| Badge | Metric | Color |
|-------|--------|-------|
| Imported | `importedMetaLeads` count | Emerald |
| Pending | `pendingMetaLeads` count | Amber |
| Duplicates | `duplicateMetaLeads` count | Red |
| Import Rate | `(imported/total * 100)%` | Indigo |

---

### 6. CRE Call Performance Cards (3 Cards)

| Card | Metric | Calculation |
|------|--------|-------------|
| Avg Call Score | Average of all scored calls | `mockCalls.filter(c => c.callScore !== null)` |
| Meetings Booked | Count where `outcome === 'meeting_booked'` | Direct count |
| Call → Meeting Rate | `(meetings / connected calls) * 100` | Excludes `no_answer` |

**Visual Indicator:** Avg Call Score shows ArrowUpRight (green) if > 70, ArrowDownRight (red) if ≤ 70

---

### 7. CRE Performance Ranking Table

**Columns:**
| Column | Description |
|--------|-------------|
| Name | CRE name; Top performer gets green badge |
| Call Quality | `callQualityScore` |
| Meeting Rate | `meetingSetRate%` |
| Conversion | `conversionRate%` |
| Effective Score | `effectiveScore` (weighted composite) |

**Sorting:** Sorted by `effectiveScore` descending (computed via `getEffectiveScores()`)  
**Highlight:** First row (top performer) has green background tint

---

## 🎯 User Actions & Roles

| Action | Role | Description |
|--------|------|-------------|
| View dashboard | All | Default landing page after login |
| Click "Meta Leads Today" card | All | Navigate to `/meta-leads` |
| Change time period | All | (Future) filter all data by period |
| Review CRE ranking | Management | Quick performance check |

---

## ✅ Acceptance Criteria

- [ ] All KPI cards display correct calculated values
- [ ] Meta Leads card shows pending count and links to `/meta-leads`
- [ ] Charts render with proper data and tooltips
- [ ] CRE Ranking table is sorted by effective score, top performer highlighted
- [ ] ArrowUp/Down indicator shows correct direction for Avg Call Score
