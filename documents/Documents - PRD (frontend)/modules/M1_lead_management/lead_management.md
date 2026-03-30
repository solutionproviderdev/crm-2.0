# Module 1 — Lead Management

## Overview

Lead Management is the central hub for tracking every lead from acquisition to conversion. It is used by both Admin and CRE users, with different levels of control and visibility.

---

## 1.1 Admin Lead Management

**Source File:** `src/pages/cre/CRELeadManagement.tsx` (shared component)  
**Route:** `/admin/lead-management`  
**Access:** Admin only  

### Purpose
Gives admins a complete view of all leads in the system with full filtering capability, batch CRE assignment, and a follow-up chart. Admins can see leads from all CREs and reassign them.

### Features

| Feature | Description |
|---------|-------------|
| **Date Range Filter** | Filter leads by creation date (default: today) |
| **Status Filter** | Filter by lead status (New, Number Collected, Ongoing, etc.) |
| **Source Filter** | Filter by lead source (Facebook, WhatsApp, Manual, etc.) |
| **CRE Filter** | Filter leads assigned to a specific CRE agent |
| **Product Ad Filter** | Filter by the Meta/Facebook product ad that generated the lead |
| **Sales Executive Filter** | Filter by assigned sales executive |
| **Search** | Text search by lead name/phone |
| **Card View** | Display leads as information cards |
| **List View** | Table-based lead view for compact browsing |
| **Bulk Selection** | Checkbox-select multiple leads |
| **Bulk CRE Assignment** | Assign selected leads to any CRE via dropdown |
| **Create Lead** | Manually create a new lead |
| **Inline Chat** | Open a chat pop-up for any lead without leaving the page |
| **Pagination** | 10/20/50 leads per page, with Previous/Next navigation |
| **Status Bar Chart** | Visual breakdown of leads by status over the date range |
| **CRE Follow-Up Chart** | Embedded `CREFollowUp` chart showing status distribution |

### Lead Card Data
- Lead name, phone, source
- Assigned CRE badge
- Lead status badge (color-coded)
- Date/time of creation
- Source ad name
- Select checkbox for bulk actions
- Chat action button

### User Actions
1. Select a date range → lead list updates
2. Apply filters (status, source, CRE, ad, sales)
3. Search by name
4. Toggle between Card and List view
5. Select one or more leads → "Assign to CRE" dropdown appears
6. Choose a CRE from the dropdown → batch assignment executes
7. Click chat icon → floating `ChatWindow` opens for that lead
8. Click "Create Lead" → `CreateLead` form modal opens
9. Navigate pages with Previous/Next buttons

---

## 1.2 CRE Lead Management

**Source File:** `src/pages/cre/CRELeadManagement.tsx`  
**Route:** `/cre/lead-management`  
**Access:** CRE users  

### Purpose
CRE agents see only their own assigned leads. The interface is identical to Admin Lead Management but auto-filters by the logged-in CRE's ID. CREs cannot see the CRE dropdown selector (it is disabled).

### Differences from Admin
- CRE filter dropdown is **disabled** (locked to current user)
- No bulk assignment capability for other CREs
- Lead count reflects only the CRE's own workload

---

## 1.3 Operator Lead Center

**Source File:** `src/pages/LeadCenter.tsx`  
**Route:** `/operator/lead-center`  
**Access:** Operator role  

### Purpose
A real-time task management interface. The Operator sees a prioritized queue of leads and manages response tasks. This is designed for high-volume, time-sensitive lead handling.

### Four-Panel Layout
1. **Left Panel:** Task queue (categorized and sorted)
2. **Center Top:** Currently selected lead details + chat
3. **Center Chat:** Conversation thread for selected lead
4. **Right Panel:** Lead profile + notes

### Task Queue Sections (Priority Order)

| Section | Color | Description |
|---------|-------|-------------|
| Hot Leads | Orange | Replied within last 10 minutes |  
| New Leads | Green | Fresh, never-touched leads |
| Follow-Ups | Red | Scheduled follow-ups due |
| Previous Replies | Blue | Leads who replied to earlier messages |
| Expiring Soon | Gray | Tasks with imminent SLA countdown |

### Task Item Data
- Customer name (avatar initials)
- Last message preview
- Time since creation
- Task type badge (Hot Lead / New Lead / Follow Up / Previous Reply)
- Lead status badge (New, Ongoing, Meeting Fix, No Response, etc.)
- Countdown timer (animated, turns amber when < 5 min, red when expired)
- Lock icon if task is not yet accessible (must complete current task first)

### Available Lead Section
- Shows the next unassigned incoming lead
- "Accept" button → adds lead to task queue
- "Reject" button → removes lead, passes to next available agent

### Complete Task Modal
- Triggered by clicking "Complete" on active task
- Shows task summary (name, status, priority, type)
- Requires a completion comment (minimum 10 characters)
- Cannot be undone once submitted
- Shows timestamp, priority, and task type summary

### Chat Area Features
- Message thread with system messages, received messages, and sent messages
- Real-time message display
- Message send input field
- Lead info panel (phone, location, notes)
- Tabs: Messages, Info, Files, Notes

### Lead Status Options (for Operator)
- `new` — New lead
- `in-progress` — Actively being worked
- `follow-up` — Scheduled for follow-up
- `closed` — No further action
- `converted` — Successfully converted to sale

### Lead Communication Status
- `new` — Initial status
- `message-reschedule` — Customer asked to message at different time
- `call-reschedule` — Customer asked for callback at different time
- `no-response` — No reply received
- `ongoing` — Active conversation
- `meeting-fix` — Meeting has been arranged
- `number-collected` — Phone number collected
- `meeting-complete` — Meeting was conducted

---

## 1.4 Follow-Up Management & Detail View

**Source Files:** `src/pages/FollowUpList.tsx`, `src/pages/FollowUp.tsx`  
**Route:** `/admin/lead-followUp`, `/admin/lead-followUp/:leadId`  
**Access:** Admin, CRE

### Purpose
To manage leads that require ongoing communication after an initial interaction, but haven't yet booked a meeting or converted. The detail view (`FollowUp.tsx`) is a specialized 3-panel workspace for rapid follow-up execution.

### Features (Follow-Up List)
- List of leads with scheduled "next reminder" times
- Quick navigation to next due tasks

### Features (Follow-Up Detail Page - `FollowUp.tsx`)
A dedicated 3-panel workspace:
1. **Left Panel (Inbox/Chat):**
   - Full message history (WhatsApp/chat)
   - "Call" button directly integrated for leads with phone numbers
   - Message input with attachments, camera, and emoji support
   - Current Lead Status (Read-only badge)
   
2. **Middle Panel (Lead Details):**
   - Renders `LeadDetails` component (client info, project location, past notes)

3. **Right Panel (Action & Comments):**
   - **Comments History:** View all previous comments/notes
   - **FollowUpButtons:** "Stop" (returns to list) and "Done" (opens Comment Modal)
   - **Comment Modal:** Finalizes the follow-up task
     - Forces user to enter a comment about the interaction
     - Updates the current reminder status to "Complete"
     - Optionally creates a *new* reminder for the next follow-up date/time
     - Auto-advances to the *next* lead in the follow-up list sequentially

### Project Status Indicators
Leads in follow-up may also have a **Project Status** (e.g., Ongoing, Ready, Renovation) if they are progressing towards a physical installation or service.

---

## 1.5 Lead Status Lifecycle

```
📥 New Lead (arrives via Facebook/WhatsApp/Manual)
        ↓
🔢 Number Collected (CRE collects phone number)
        ↓
📞 Ongoing (Active communication)
        ↓
📅 Meeting Fixed (Meeting arranged with Sales Executive)
        ↓
✅ Meeting Complete (Sales Executive conducted meeting)
        ↓
💰 Sold / Prospect / Follow Up / Closed
```

**Side branches:**
- `No Response` → follows up automatically after timeout
- `Call Reschedule` / `Message Reschedule` → back into Ongoing after new contact
- `Meeting Canceled` → reopens to Ongoing
