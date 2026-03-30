# Module 2 — CRE Module

The CRE (Customer Relationship Executive) module is the daily work environment for CRE agents. It includes a personal dashboard, a live messaging lead center, lead management, meeting scheduling, and AI voice tools.

---

## 2.1 CRE Dashboard

**Source File:** `src/pages/cre/CREDashboard.tsx`  
**Route:** `/cre/dashboard`  
**Access:** CRE, Admin

### Purpose
Personal performance hub for the CRE. Shows metrics, lead overview funnel, meeting statistics, follow-up data, and activity logs.

### Layout
- **Header Row:** Salary earned, total salary, incentive amount (from `DashboardHeader`)
- **Main Section — Left Column (65%):**
  - Conversion Funnel (`ConversionFunnel` component)
  - Meeting card for the current month (`CREMeetingCardMeeting`)
- **Main Section — Right Column (35%):**
  - Follow-Up Stats (`FollowUpStats`)
  - Meeting Status Breakdown (`MeetingStatusBreakdown`)
  - Free & Online Meeting Stats (`FreeOnlineMeetingStats`)
  - Recent Activity List (`RecentActivityList`)

### Conversion Funnel Stages

| Stage | Color | Meaning |
|-------|-------|---------|
| Total Assigned | Blue | All leads assigned to this CRE |
| Number Collect | Blue | Numbers successfully collected |
| Number Collection Failed | Rose | Failed collection attempts |
| Number Provided | Blue | Numbers sent to sales team |
| No Response | Rose | Leads with no response |
| Follow Up | Orange | Active follow-up leads |
| Meeting Set | Blue | Meetings arranged |
| Meeting Complete | Blue | Meetings conducted |
| Meeting Canceled | Blue | Canceled meetings |
| Sold | Blue | Converted to sale |
| Close | Red | Closed/lost leads |

### Salary Calculation
- Salary earned = (number of meetings set × ৳100)
- Incentive amount is shown separately
- Displayed in BDT (৳)

### Month Filter
- Dropdown to select month for viewing historical performance

---

## 2.2 CRE Lead Center

**Source File:** `src/pages/cre/CRELeadCenter.tsx`  
**Route:** `/cre/lead-center`, `/cre/lead-center/:leadId`  
**Access:** CRE, Admin

### Purpose
A WhatsApp/messaging-style interface for CREs to communicate with their assigned leads. Opens a chat area when a lead is selected.

### Features
- List of assigned leads on the left
- `ChatArea` component opens when a lead is clicked
- Lead selection navigates to `/:leadId` sub-route
- Shows lead name, status badge, last message preview

### ChatArea Component
**Source File:** `src/pages/cre/components/ChatArea.tsx`  
- Full conversation thread
- Message send functionality
- Lead info sidebar (phone, address, notes)
- File/media attachment capability
- Status update from within chat

---

## 2.3 CRE Lead Management

> *(Also documented in M1 — Lead Management)*

**Route:** `/cre/lead-management`  
**Access:** CRE users only

- Same UI as Admin lead management
- Auto-filtered to current CRE's assigned leads
- CRE dropdown selector is disabled
- Can create leads, open chats, update statuses

---

## 2.4 CRE Follow-Up

**Source File:** `src/pages/cre/CREFollowUp.tsx`  
**Route:** Embedded within Lead Management page (chart embed)  
**Access:** Admin, CRE

### Purpose
An embedded bar chart component showing a breakdown of lead statuses over a selected date range. Helps CRE and admins visualize the follow-up pipeline distribution.

### Data Visualized
The `barchartData` shows count per lead status:
- New
- No Response
- Number Provided
- Message Rescheduled
- Number Collected
- Call Reschedule
- Ongoing
- Meeting Fixed
- Meeting Complete
- Sold
- Prospect

### Props
- `barchartData`: Array of `{ status: string, count: number }` from API

---

## 2.5 CRE AI Voice Transcription

**Source File:** `src/pages/AiVoiceTrans.tsx`  
**Route:** `/cre/AiVoice`  
**Access:** CRE

### Purpose
Allows CRE agents to record voice notes which are transcribed by AI into text. Useful for logging call summaries, follow-up notes, or meeting arrangements during phone conversations.

### Features
- **Record** audio via browser microphone
- **Transcribe** recorded audio using AI backend
- **Copy/Save** transcribed text to use as lead notes or comments
- Language support includes Bengali and English

### User Actions
1. Click "Record" button → browser requests mic access
2. Speak into microphone
3. Click "Stop" → audio sent to backend transcription API
4. Transcribed text appears in text area
5. Copy text or directly log as lead note

---

## 2.6 CRE Meeting Slot

**Source File:** `src/pages/MeetingsSlot.tsx`  
**Route:** `/cre/meeting`  
**Access:** CRE

### Purpose
Allows CRE agents to view available meeting time slots for sales executives and book a slot when arranging a meeting for a lead.

### Features
- View time slots by date
- See which slots are available, booked, or blocked
- Book a slot for a specific lead and sales executive
- View existing bookings

---

## 2.7 CRE Dashboard Sub-Components

| Component | Purpose |
|-----------|---------|
| `DashboardHeader` | Shows salary earned, total salary, incentive amount |
| `ConversionFunnel` | Visual lead stage pipeline with counts |
| `FollowUpStats` | Follow-up breakdown statistics |
| `MeetingStatusBreakdown` | Breakdown by meeting outcome |
| `FreeOnlineMeetingStats` | Counts for free-service and online meetings |
| `RecentActivityList` | Timeline of recent CRE actions |
| `CREMeetingCardMeeting` | Monthly meeting summary card |
| `MonthlyMeetingOverview` | Monthly chart of scheduled vs completed meetings |
| `DateWiseLeadDataCard` | Day-by-day lead count card (shared with Admin) |
| `WeeklyMeetingCard` | Weekly meeting filter card |

---

## 2.8 Recent Activity Types

CRE activity logs track the following event types:

| Action Code | Display Label |
|------------|--------------|
| `CREATE_LEAD` | Created a lead |
| `LEAD_STATUS_CHANGE` | Changed lead status |
| `LEAD_MEETING_SET` | Set a meeting |
| `LEAD_CREATE_AND_MEETING_SET` | Created lead and set meeting |
| `LEAD_REMINDER_SET` | Set a reminder |
| `LEAD_REMINDER_UPDATE` | Updated a reminder |
| `LEAD_ADD_COMMENT` | Added a comment |
