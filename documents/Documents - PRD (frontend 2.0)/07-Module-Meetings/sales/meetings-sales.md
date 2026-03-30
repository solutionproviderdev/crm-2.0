# PRD: Meeting Intelligence

**Route:** `/meetings`  
**Component:** `Meetings.tsx`  
**Access:** Sales (primary), Management (oversight)  
**Primary Users:** Sales representatives (conducting meetings), Managers (coaching review)

---

## 📌 Purpose

The Meeting Intelligence module tracks all client meetings from scheduling to AI-powered analysis. It provides real-time meeting session management, transcript capture, sentiment analysis, coaching feedback, and AI-generated follow-up scripts — enabling sales teams to continuously improve conversion rates.

---

## 🖥️ Page Layout

```
[ Page Header: "Meeting Intelligence" + status counters ]
[ KPI Cards (4) ]
[ Meeting Sessions List ]
[ Selected Meeting Detail Panel (multi-tab) ]
```

---

## ⚡ Features

### 1. Page Header Counters
- **Total:** all sessions count
- **Completed:** completed status count
- **Upcoming:** scheduled status count

---

### 2. KPI Cards (4 Cards)

| Card | Metric | Icon | Color Logic |
|------|--------|------|-------------|
| Avg Meeting Score | Average `meetingScore` (analyzed mtgs only) | Star | ≥70 = green, ≥50 = amber, <50 = red |
| Avg Win Probability | Average `winProbability%` (analyzed only) | Target | Same thresholds |
| Meetings This Week | `totalMeetings` | Calendar | Blue |
| Quotations Requested | Count of `outcome === 'quotation_requested'` | FileText | Purple |

---

### 3. Meeting Sessions List

**Sorting:** Scheduled first → then completed (newest first)

**Each session card shows:**
- Meeting type badge: 🏠 Site Visit / 🏢 Office Visit / 💻 Virtual
- Client name (large, bold)
- Service interest pill + property type pill
- Location (MapPin icon)
- Sales person name
- Scheduled date/time
- Duration (if completed)
- Status badge

**Status Badges:**
| Status | Badge |
|--------|-------|
| `scheduled` | 📅 Upcoming (blue) |
| `in_progress` | 🔴 Live (green, animated pulse) |
| `completed` | ✓ Completed (gray) |
| `cancelled` | ✕ Cancelled (red) |

**Live Timer:** When `in_progress` and `activeSessionId` matches, shows `⏱ Xm Ys` counting up in real-time

---

### 4. Action Buttons per Status

| Status | Actions |
|--------|---------|
| `scheduled` | **▶ Start Meeting** + **Edit** |
| `in_progress` | **⏹ End Meeting** |
| `completed` (with analysis) | Score/Win% badge + **View Analysis** button |
| `completed` (without analysis) | **⚡ Generate AI Analysis** button |

---

### 5. Meeting Session Management

#### Start Meeting
- Changes status from `scheduled` → `in_progress`
- Sets `startedAt` to current timestamp
- Starts live elapsed timer

#### End Meeting
- Changes status to `completed`
- Sets `endedAt`, calculates `durationMinutes` from elapsed seconds
- Stops timer, resets `activeSessionId`

---

### 6. Meeting Detail Panel (Multi-tab)

Opened by clicking **"View Analysis"** on any completed meeting.  
Auto-scrolls into view when opened.

**Detail Header:** Client name + meeting type badge + X close button

**Tabs:** Overview | Transcript | AI Analysis | Coaching | Next Steps

---

#### Tab 1: Overview

**Left: Client Details card**
- Name, Phone, Service Interest, Property Type, Budget Range

**Right: Meeting Details card**
- Sales Person, Location, Scheduled At, Duration
- Outcome badge (color-coded):
  - Quotation Requested (green)
  - Follow-up Needed (amber)
  - Deal Closed (teal)
  - Not Interested (red)
  - Pending Decision (blue)
  - No Show (gray)

**Manager Note section:**
- Yellow-tinted textarea (`#FFFBEB` background)
- Pre-filled with existing `managerNote`
- "Save Note" button (amber)

---

#### Tab 2: Transcript

**If transcript available:**
- Two-column layout: Client (blue-tinted, C badge) | Sales Rep (green-tinted, S badge)
- Word count shown below each transcript
- **Talk Ratio Calculator:** Calculates word-based ratio: Client % vs Sales %
- Visual bar showing ratio split
- Ideal target: "Client 40–50%, Sales 50–60%"

**If no transcript:**
- Empty state: Mic icon + message
- "Paste Transcript Manually" button (for completed sessions)

---

#### Tab 3: AI Analysis

**If analysis available:**

**Top Row (2 cards):**
- Client Requirements — list with green checkmarks
- Client Pain Points — amber pill badges

**Stats Row (4 metric cards):**
| Metric | Values |
|--------|--------|
| Budget Signal | Confirmed ✓ / Hinted ~ / Avoided ✗ / Unknown ? |
| Decision Readiness | Ready / Needs Time / Needs Family / Unclear |
| Client Sentiment | 😊 Positive / 😐 Neutral / 😟 Negative / 🔄 Mixed |
| Win Probability | Circular progress indicator with color |

**Objections Raised:**
- Red tinted box with pill badges for each objection (AlertTriangle icon)

**If no analysis:**
- Empty state with "⚡ Generate AI Analysis" button

---

#### Tab 4: Coaching

**If analysis available:**

**Left: Sales Strengths**
- Green bordered cards with CheckCircle2 icon for each strength

**Right: Sales Lackings & Fixes**
- Left-border red cards for each lacking
- Each card includes:
  - ⚠ Lacking label
  - "Suggested Fix:" with contextual script in Bangla/English

**Fix Script Examples:**
| Lacking | Fix |
|---------|-----|
| "budget" | "আপনার budget range টা কি roughly ঠিক আছে?..." |
| "next step date" | "আপনি কি এই সপ্তাহের মধ্যে একটা date fix করতে পারবেন?" |
| "bad experience" | "আমি বুঝতে পারছি আপনার concern. আমরা কিভাবে handle করি সেটা দেখাই?" |

**Meeting Score bar:**
- Labeled "Meeting Score" with 0-100 bar
- ≥70 = green, ≥50 = amber, <50 = red

**If no analysis:** Empty state message

---

#### Tab 5: Next Steps

**If analysis available:**

**Recommended Next Step Section:**
- Dark teal card (`#0F6A5B`)
- `suggestedNextStep` text
- `⏱ suggestedNextStepTiming` badge in gold

**Action Buttons:**
- 📋 **Copy Next Step** — copies text to clipboard
- 💬 **Send to WhatsApp** — opens `wa.me/{phone}?text=Hi {name},`
- 📅 **Schedule Follow-up**

**AI Follow-up Script Section:**
- If script not yet generated: textarea + "🤖 Generate Follow-up Script" button
- If generated:
  - Script shown in teal-header card
  - **Copy** + **WhatsApp Send** buttons with encoded script URL

---

## 🎯 User Actions by Role

| Action | Sales | Management | CRE | Admin |
|--------|-------|------------|-----|-------|
| View meetings list | ✅ | ✅ | — | — |
| Start meeting | ✅ | — | — | — |
| End meeting | ✅ | — | — | — |
| View transcript | ✅ | ✅ | — | — |
| View AI analysis | ✅ | ✅ | — | — |
| View coaching tab | ✅ | ✅ | — | — |
| Generate follow-up script | ✅ | ✅ | — | — |
| Write manager note | — | ✅ | — | — |
| Copy/send to WhatsApp | ✅ | ✅ | — | — |

---

## 🤖 AI Integration

- **Follow-up Script Generation:** Simulated (mock) — in production, powered by Gemini API
- **Meeting Analysis:** Pre-stored structured data; in production, generated from audio transcript via STT + Gemini

---

## ✅ Acceptance Criteria

- [ ] Sessions sorted: scheduled first, then completed newest-first
- [ ] Live timer increments while session `in_progress`
- [ ] Start/End meeting updates status and timestamps correctly
- [ ] Analysis tab shows all 4 metric cards with correct indicators
- [ ] Coaching tab generates contextual fix scripts per lacking
- [ ] Talk ratio calculated from transcript word counts
- [ ] WhatsApp link uses correct phone number and encoded message
- [ ] Generate Follow-up Script populates the script section
- [ ] Manager note saves in session state
