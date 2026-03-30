# PRD: CRM & Lead Management

**Route:** `/leads`  
**Component:** `Leads.tsx`  
**Access:** CRE (primary), Sales, Management  
**Primary Users:** CRE (daily use), Management (oversight)

---

## 📌 Purpose

The CRM & Lead Management page is the operational core of the sales process. CREs manage their lead pipeline here — viewing, filtering, triaging, calling, and recording follow-up actions. The page supports two viewing modes: a **Kanban board** and a **list table**, and includes a rich **lead detail drawer**.

---

## 🖥️ Page Layout

```
[ Page Header: "CRM & Lead Management" | View Toggle | Filter | + New Lead ]
[ Kanban Board OR List Table ]
[ Lead Detail Drawer (slide-in panel from right) ]
```

---

## ⚡ Features

### 1. View Toggle (Kanban / List)
- **Kanban View** (default): Column-based board grouped by lead status
- **List View:** Full table with all leads
- Toggle buttons use `LayoutGrid` / `List` icons
- State persists per session (local state)

---

### 2. Filter Button
- Currently shows a "Filter" label with Filter icon
- **Current Status:** UI only — filter modal/logic not implemented (future feature)

---

### 3. New Lead Button
- Button: "+ New Lead" (indigo background)
- **Current Status:** UI only — creation form not implemented (future feature)

---

### 4. Kanban Board View

**Columns:** Dynamically generated for each `LeadStatus` enum value:
```
New Lead | Attempted Contact | Contacted | Qualified | Consultation Scheduled |
Site Visit Done | Design Discussion | Quotation in Preparation | Quotation Sent |
Follow-up After Quotation | Negotiation | Deal Won | Deal Lost | Nurture
```

**Empty Column Behavior:** Columns are hidden if empty, except: `New Lead`, `Contacted`, `Deal Won` (always visible)

**Lead Card (Kanban):** Each card shows:
- Client name
- **⚠ Stale Badge** (amber) — if last interaction > 48 hrs and status not Deal Won/Lost
- Property type + service interest
- Budget range + Lead temperature badge (🔥 Hot / 🌡 Warm / ❄ Cold)
- Next follow-up date (amber, Calendar icon)
- Assigned CRE avatar initial + name
- Lead source badge (META in Facebook blue, or source name)

**Clicking a card** → opens Lead Detail Drawer

---

### 5. List View (Table)

**Columns:**
| Column | Content |
|--------|---------|
| Lead Details | Name, phone, META/Stale badges |
| Status & Temp | Status badge, temperature indicator |
| Interest & Budget | Service interest, budget range |
| Assigned CRE | Avatar initial + name |
| Next Follow-up | Follow-up date (amber) or "Not set" |

**Clicking a row** → opens Lead Detail Drawer

---

### 6. Stale Lead Detection

```typescript
const isStale = (lead: Lead) => {
  if (lead.status === 'Deal Won' || lead.status === 'Deal Lost') return false;
  const diffHours = (now - lastInteraction) / (1000 * 60 * 60);
  return diffHours > 48;
};
```

- Stale leads shown with amber border (Kanban) or amber badge (List)
- Alerts CREs to leads needing immediate follow-up

---

### 7. Lead Temperature Indicator
| Temperature | Icon | Color |
|-------------|------|-------|
| Hot | 🔥 Flame | Red (`text-red-500`) |
| Warm | 🌡 ThermometerSun | Amber (`text-amber-500`) |
| Cold | ❄ Snowflake | Blue (`text-blue-500`) |

---

### 8. Lead Detail Drawer (Right Slide Panel)

Opened when: clicking any card (Kanban) or row (List).  
Closed when: clicking X button or backdrop.

#### Drawer Header
- Lead name + Lead ID
- Status badge
- **📞 "Call from App" button** (green) — initiates a call

#### Call from App Feature
- Triggers `window.location.href = tel:{phone}` (device phone dialer)
- Creates a new `Call` record with current timestamp in local state
- Shows **"Call in progress..."** indicator with animated pinging dot while active
- Shows **"End Call"** red button while call is active
- On end: calculates duration, stores `endedAt`, shows "Call ended. AI analysis pending..."
- Message auto-dismisses after 5 seconds

#### Lead Intelligence Section
```
[ Qualification Score (0-100) | Conversion Probability (%) ]
[ Priority Tag (High/Medium/Low) | Lead Temperature ]
[ ⚠ Risk Flag (if present) ]
```

#### Call History Section
- Lists all calls filtered by `lead.id`
- Each call shows:
  - Date/time of call
  - Role badge (CRE / Sales)
  - Outcome badge (color-coded: meeting_booked → green, followup → blue, no_answer → gray, etc.)
  - Call Score (`X/100`) or "Pending analysis"
  - Client Talk Ratio (`X%`)
  - Sentiment indicators and coaching flags (amber badges)

#### Project Requirements Section
| Field | Value |
|-------|-------|
| Property Type | e.g., Apartment |
| Service | e.g., Full Interior |
| Budget Range | e.g., 15L - 20L |
| Expected Value | ৳ amount |
| Urgency | Low / Medium / High |
| Decision Maker | Decision Maker / Influencer / Joint Decision |

#### Contact Info Section
- Phone (with Phone icon)
- Location (with MapPin icon)

#### Status & Tracking Section
- Assigned CRE
- Lead Source (META badge or text)
- Next Follow-up date
- Last Interaction datetime

#### Notes Section
- Free-text notes in a gray box

---

## 🎯 User Actions by Role

| Action | CRE | Sales | Management |
|--------|-----|-------|------------|
| View Kanban board | ✅ | ✅ | ✅ |
| Toggle to List view | ✅ | ✅ | ✅ |
| Click lead card/row | ✅ | ✅ | ✅ |
| Call from App | ✅ | ✅ | — |
| End active call | ✅ | ✅ | — |
| View Call History | ✅ | ✅ | ✅ |
| View Lead Intelligence | ✅ | ✅ | ✅ |
| Create new lead | (future) | — | — |
| Filter leads | (future) | (future) | (future) |

---

## 🚨 Business Rules

1. **Stale threshold:** 48 hours without interaction = stale
2. **Stale exclusions:** `Deal Won` and `Deal Lost` statuses never go stale
3. **Call tracking:** Each "Call from App" creates a new `Call` record. Duration calculated on "End Call".
4. **Lead source META:** Facebook-sourced leads display a distinct Facebook-blue "META" badge

---

## ✅ Acceptance Criteria

- [ ] Kanban view shows correct columns from `LeadStatus` enum
- [ ] Stale leads (> 48 hrs no interaction) show amber border/badge
- [ ] Lead detail drawer opens on click, closes on backdrop or X
- [ ] "Call from App" triggers phone dial and starts tracking
- [ ] Call duration calculated correctly when "End Call" clicked
- [ ] Call history shows in drawer filtered by lead
- [ ] Lead temperature displayed with correct icon and color
