# Module 4 — Meetings Module

The Meetings module handles scheduling, time-slot block management, and tracking of physical site-visit meetings between clients and Sales Executives, arranged by CRE agents.

---

## 4.1 Meeting Slot Management

**Source File:** `src/pages/MeetingsSlot.tsx`  
**Route:** `/admin/meeting-slot`, `/cre/meeting`  
**Access:** Admin, CRE

### Purpose
Enables CREs and Admins to view and manage available meeting time slots for Sales Executives. When booking a meeting for a lead, the CRE picks an open slot from this interface.

### Features

| Feature | Description |
|---------|-------------|
| **Time Slot Grid** | Visual calendar-style grid of available slots by date and executive |
| **Block/Unblock Slots** | Admin can mark time slots as unavailable |
| **Book a Slot** | CRE selects slot to reserve for a lead |
| **View Bookings** | See which slots are already booked and by whom |
| **Executive Filter** | Filter the slot view by sales executive |
| **Date Navigation** | Browse slots by week or day |

### Slot States
- **Available** — Open for booking
- **Booked** — Reserved for a specific lead/meeting
- **Blocked** — Marked unavailable by Admin

### Meeting Slot Creation Flow
1. CRE opens Lead Management or Lead Center
2. Finds a lead ready for a meeting (status: Ongoing / Number Collected)
3. Opens meeting slot selector
4. Selects date and time slot
5. Selects Sales Executive
6. Confirms booking → lead status updates to "Meeting Fixed"
7. Sales Executive receives notification of new meeting

---

## 4.2 Meeting Overview (Admin & Operator Views)

**Source File:** `src/pages/Meeting.tsx`  
**Route:** `/admin/sales`  
**Access:** Admin

### Purpose
Admin view of all scheduled meetings across the system with sub-route to individual meeting details.

### Features
- Full paginated meetings list
- Filter by Sales Executive, date range, status
- Click meeting → navigates to `SalesInfoDetails` page

---

## 4.3 Create Meeting

**Source File:** `src/pages/CreateMeeting.tsx`  
**Access:** Internal component (used via modals/forms)

### Purpose
Form to create a new meeting entry. Used when scheduling a meeting directly.

### Form Fields
- Lead selection (autocomplete)
- Sales Executive selection
- Date picker
- Time slot selection (from available slots)
- Notes / Special instructions

---

## 4.4 Meeting Statuses

| Status | Description |
|--------|-------------|
| Scheduled | Meeting created and confirmed |
| Complete | Meeting was conducted |
| Rescheduled | New date/time has been set |
| Postponed | Temporarily delayed |
| Canceled | Meeting will not occur |
| No Show | Client did not appear |

---

## 4.5 Meeting Notifications

- Sales Executive receives a **push notification** when a new meeting is booked for them
- CRE receives a notification when meeting status is updated by Sales Executive
- Admin receives summary notifications for the day's meetings

---

## 4.6 Monthly Meeting Overview

**Component:** `MonthlyMeetingOverview`  
Used on CRE Dashboard and Admin Dashboard.

### Features
- Month selector dropdown
- Bar chart: scheduled vs completed per day
- Data generated per day for 30-day period
- Helps track meeting completion rates over time

---

## 4.7 Meeting Status Breakdown

**Component:** `MeetingStatusBreakdown`  
Displayed on CRE Dashboard sidebar.

- Shows counts for each meeting status (Complete, Rescheduled, Postponed, Canceled)
- Compact summary card format

---

## 4.8 Free & Online Meeting Stats

**Component:** `FreeOnlineMeetingStats`  
Displayed on CRE Dashboard sidebar.

- **Free Service Meetings:** Count of meetings for free/consultation service requests
- **Online Meetings:** Count of virtual/video call meetings
- Displayed as fractional progress (e.g., "3/7" completed of allocated quota)
