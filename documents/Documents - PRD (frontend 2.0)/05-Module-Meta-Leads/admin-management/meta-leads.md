# PRD: Meta Lead Import Center

**Route:** `/meta-leads`  
**Component:** `MetaLeads.tsx`  
**Access:** Admin, Management  
**Primary Users:** Admin (daily), Management (oversight)

---

## 📌 Purpose

The Meta Lead Import Center is the gateway for all Facebook/Meta Ads leads entering the CRM system. It shows a live feed of leads captured from Meta Lead Ad forms, allows reviewing, duplicate-checking, and one-click importing with intelligent auto-assignment to the best-performing CRE.

---

## 🖥️ Page Layout

```
[ Page Header: "Meta Lead Import Center" + subtitle ]
[ Stats Row: Total | Pending | Imported | Duplicates ]
[ Filter Bar: Status Tabs | Search | Date Filter ]
[ Lead Table (Desktop) / Lead Cards (Mobile) ]
[ Lead Preview Modal ]
```

---

## ⚡ Features

### 1. Stats Summary Row (4 Cards)

| Card | Metric | Color Accent | Data |
|------|--------|--------------|------|
| Total Received Today | All leads | Teal (`#0F6A5B`) | `metaLeads.length` |
| Pending Import | `importStatus === 'pending'` | Gold (`#D9A441`) | Count |
| Imported to CRM | `importStatus === 'imported'` | Forest green | Count |
| Duplicates Detected | `importStatus === 'duplicate'` | Red (`#C94C4C`) | Count |

---

### 2. Filter Bar

#### Status Tabs (segmented control)
- **All** | **Pending** | **Imported** | **Duplicate** | **Failed**
- Active tab highlighted with `#0F6A5B` bottom border
- Filters the table/list in real-time

#### Search Input
- Searches by: **Full Name** or **Phone Number**
- Real-time filtering via `useMemo`
- Search icon pinned to left of input

#### Date Filter (Dropdown)
- Options: **Today** | **This Week** | **Custom**
- **Current Status:** UI only — date filter logic not applied (future feature)

---

### 3. Desktop Lead Table

**Columns:**
| Column | Content |
|--------|---------|
| Time | Formatted time of lead creation |
| Name & Location | Full name + location |
| Campaign | Campaign name badge (gray) |
| Service Interest | Color-coded service pill (teal, green, blue, etc.) |
| Budget | Budget range text |
| Status | Import status badge |
| Assigned CRE | CRE name or `—` |
| Actions | Context-sensitive buttons |

**Action Buttons by Status:**
| Status | Available Actions |
|--------|------------------|
| `pending` | **Import & Assign** (indigo) + **Preview** (outline) |
| `imported` | **View in CRM** (outline, ExternalLink icon) |
| `duplicate` | ⚠ Duplicate label + **Preview** (outline) |
| `failed` | — (no action) |

---

### 4. Mobile Lead Cards
- Compact card layout for small screens
- Shows: Name, campaign name, service pill, budget, status badge
- Same action buttons as desktop but stacked layout

---

### 5. Import & Auto-Assign Logic

When user clicks **"Import & Assign"**:

**Step 1: Duplicate Check**
```typescript
const isDuplicate = crmLeads.some(crmLead => crmLead.phone === lead.phone);
```
- If duplicate found → mark as `duplicate`, show warning toast
- Prevents creating multiple leads for same phone number

**Step 2: Auto-Assign to Best CRE**
```typescript
const assignmentDetails = getAssignmentDetails(); // Sorted by effectiveScore
const topCRE = assignmentDetails[0]; // Assign to #1 ranked CRE
```
- Assignment is **score-based** — CRE with highest `effectiveScore` gets the lead

**Step 3: Create CRM Lead**
- New `Lead` object created from `MetaLead` data
- Default values: `status: 'New Lead'`, `urgencyLevel: 'Medium'`, `leadTemperature: 'Warm'`, `qualificationScore: 50`

**Step 4: Update Meta Lead Record**
- `importStatus` → `'imported'`
- `importedLeadId` → new lead ID
- `assignedCREId` / `assignedCREName` / `assignmentScore` → set

**Step 5: Toast Notification**
- ✅ Success: `"Lead imported and assigned to {CRE name}"`
- ⚠ Duplicate: `"This phone already exists in CRM."`
- Auto-dismisses after 3 seconds

---

### 6. Lead Preview Modal

Opened when: clicking **"Preview"** (pending or duplicate leads)  
Shows a detailed preview **before** importing:

**Lead Details section:**
- Full Name, Phone, Email, Location

**Project Details section:**
- Service Interest, Property Type, Budget Range

**Campaign Source section (3-column):**
- Campaign Name, Ad Set Name, Form ID

**Message from Client:** (if provided) — shown in indigo-tinted box

**Assignment Preview:** (only for `pending` leads)
- Table of all CREs sorted by `effectiveScore`
- Top CRE highlighted with checkmark
- Shows: `"Will be assigned to: {CRE name} (Score: X)"`

**Footer Actions:**
- Close button
- Import & Assign button (only for pending leads)

---

## 🔒 Service Color Coding

| Service | Badge Color |
|---------|-------------|
| Kitchen Cabinet | Teal |
| Full Interior | Green |
| Wardrobe | Blue |
| Office Interior | Gray |
| Other | Yellow |

---

## 🎯 User Actions by Role

| Action | Admin | Management | CRE | Sales |
|--------|-------|------------|-----|-------|
| View Meta Leads table | ✅ | ✅ | — | — |
| Filter by status/search | ✅ | ✅ | — | — |
| Preview lead details | ✅ | ✅ | — | — |
| Import & Assign | ✅ | ✅ | — | — |
| View assignment scoring | ✅ | ✅ | — | — |

---

## 🚨 Business Rules

1. **Phone number** is the duplicate check key — no two CRM leads can share a phone
2. **Auto-assignment** is always based on highest `effectiveScore` at time of import
3. **Meta notifications** appear in Header bell when Meta leads are `imported`
4. Sidebar badge shows **pending** count (unprocessed leads waiting for review)

---

## ✅ Acceptance Criteria

- [ ] Stats cards update dynamically based on lead statuses
- [ ] Status tab filter updates table in real-time
- [ ] Search works for name and phone
- [ ] Import process: checks duplicate → assigns → creates lead → updates status → shows toast
- [ ] Duplicate leads show warning toast and are marked `duplicate` (not imported)
- [ ] Preview modal shows assignment scoring table
- [ ] Toast message auto-dismisses after 3 seconds
- [ ] Mobile card layout renders correctly
