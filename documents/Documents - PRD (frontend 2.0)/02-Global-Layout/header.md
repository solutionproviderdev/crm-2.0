# PRD: Global Header

**Component:** `Header.tsx`  
**Location:** Persistent — top bar of all authenticated pages  
**Access:** All authenticated users  
**Current User Role Shown:** Management (hardcoded for demo)

---

## 📌 Purpose

The global header provides:
1. **Global Search** across leads, projects, and clients
2. **Notification Center** for urgent alerts and new lead assignments
3. **User Identity Display** showing the logged-in user's name and role

---

## 🖥️ Layout (Horizontal Bar)

```
[ Search Input (flex-1) ]         [ 🔔 Bell + Badge ]  |  [ 👤 User Avatar + Name + Role ]
```

- **Height:** 64px (`h-16`)
- **Background:** White with bottom border
- **Z-index:** 10 (above content, below modals)

---

## ⚡ Features

### 1. Global Search Bar
- **Placeholder:** "Search leads, projects, or clients..."
- **Icon:** `Search` (lucide) pinned left inside input
- **Style:** Rounded, ring-bordered input (`max-w-md`)
- **Current Status:** UI only — search logic is not yet implemented (future feature)

---

### 2. Notification Bell

#### Bell Button
- Icon: `Bell` (Lucide), 24x24
- **Badge:** Red rounded pill showing total active notification count
- Clicking the bell toggles the notification dropdown panel

#### Notification Dropdown Panel
- **Width:** 384px (`w-96`)
- **Max height:** 384px with scroll overflow
- **Position:** `absolute right-0`, drops below bell
- **Closing:** Click outside closes it (implicit — no overlay)

#### Notification Types

**Type A: 📥 New Meta Lead Assigned**
- **Source:** Auto-generated from `mockMetaLeads` where `importStatus === 'imported'`
- **Content:** Lead name, service interest, location, campaign name, assigned CRE
- **Severity:** Always `High` (red badge: "High Priority")
- **Timestamp:** "Just now"
- **Action:** Links to `/leads` with external link icon

**Type B: ⏰ Follow-up Reminder**
- **Source:** Hardcoded mock data; in production, driven by overdue follow-up logic
- **Content:** Lead name, status, last interaction time, urgency message
- **Severity:** `high` (red) or `medium` (amber)
- **High Severity Example:** "New lead untouched for > 15 minutes. Immediate action required."
- **Medium Severity Example:** "Follow-up required. No status change in 48 hours."
- **Action:** Links to `/leads`

#### Snooze Functionality
- Each reminder notification has a **"Snooze"** button
- Clicking opens an inline text input: "Reason for snoozing..."
- User enters a reason, clicks **"Save"** → notification dismissed from active list
- **X button** cancels snooze without saving

#### Notification Grouping
- Notifications are split into two groups:
  1. **"📥 New Meta Leads"** (green-tinted section)
  2. **"⏰ Follow-up Reminders"** (white section)
- Each group has a section header with count

---

### 3. User Profile Display

| Element | Content |
|---------|---------|
| Avatar | `UserCircle` icon (slate-400) |
| User Name | "Admin User" (demo hardcoded) |
| Role | Current role type (e.g., "Management") |

---

## 🔔 Notification Data Model

```typescript
interface Notification {
  id: number | string;
  type?: 'reminder' | 'new_lead_assigned';
  leadId?: string;
  leadName?: string;
  status?: string;
  lastInteraction?: string;
  message: string;
  snoozed: boolean;
  snoozeReason?: string;
  showSnoozeInput?: boolean;
  severity?: 'high' | 'medium' | 'low';
  title?: string;
  timestamp?: string;
  actionLink?: string;
  assignedTo?: string | null;
}
```

---

## 🎯 User Actions Matrix

| Action | Who Performs It | Outcome |
|--------|-----------------|---------|
| Open/close notifications | All users | Dropdown toggle |
| View Meta Lead notification | All users | Link to `/leads` |
| Snooze a reminder | CRE, Sales | Notification hidden; reason stored |
| Search (future) | All users | Filter leads/projects/clients |

---

## ✅ Acceptance Criteria

- [ ] Bell badge shows count of all active (non-snoozed) notifications
- [ ] New imported Meta Leads appear as notifications automatically
- [ ] High-severity reminders shown in red; medium in amber
- [ ] Snooze requires a typed reason before saving
- [ ] Snoozed notifications disappear from active list
- [ ] "Assigned to" CRE name shown on Meta Lead notifications
