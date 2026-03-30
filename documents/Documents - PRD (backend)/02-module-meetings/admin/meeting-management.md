# Module 02 — Meetings | Admin View

## Purpose

The Meetings module manages all client visits by Sales Executives. It handles scheduling, slot management, location tracking, and outcome logging. Every meeting is linked to a Lead record.

---

## Meeting Data Model

| Field               | Type         | Description                                              |
|---------------------|--------------|----------------------------------------------------------|
| `lead`              | ObjectId     | Reference to Lead                                        |
| `date`              | Date         | Scheduled date of meeting                                |
| `slot`              | Enum         | Time slot (e.g. `10:00 AM`, `02:00 PM`)                 |
| `salesExecutive`    | ObjectId     | Assigned Sales Executive (User ref)                      |
| `status`            | Enum         | See status stages below                                  |
| `visitCharge`       | Number       | Fee charged for the visit (BDT)                          |
| `locations`         | Object       | GPS coordinates for leaving and arrival                  |
| `meetingFlowStatus` | Enum         | Real-time tracking of meeting progression                |
| `auditFields`       | Object       | `createdBy` and `updatedBy` user references              |

### Meeting Status Stages

| Status                | Description                                           |
|-----------------------|-------------------------------------------------------|
| `Fixed`               | Meeting has been booked                               |
| `Postponed`           | Customer postponed                                    |
| `Rescheduled`         | Meeting moved to new date/slot                        |
| `Canceled`            | Meeting was cancelled                                 |
| `Complete`            | Visit happened, no immediate outcome                  |
| `Sold`                | Sale achieved during or after this meeting            |
| `Follow-Up`           | Requires another meeting/call                         |
| `Final Measurement`   | On-site measurement visit                             |
| `Handover & Review`   | Final handover visit with client review               |

### Meeting Flow Status (Real-Time Tracking)

| Flow Status | Meaning                                      |
|-------------|----------------------------------------------|
| `Confirmed` | Sales Executive confirmed attendance          |
| `Leaved`    | SE left starting point (GPS captured)         |
| `Arrived`   | SE arrived at customer location (GPS captured)|
| `Ongoing`   | Meeting currently in progress                 |
| `Completed` | Meeting finished                              |
| `Canceled`  | Meeting cancelled mid-flow                    |

### Location Tracking

Each meeting records:
- **Leaving From:** GPS coordinates + departure timestamp
- **Arrived At:** GPS coordinates + arrival timestamp

---

## Available Time Slots

Meetings can be booked in any of these hourly slots:

`10:00 AM`, `11:00 AM`, `12:00 PM`, `01:00 PM`, `02:00 PM`, `03:00 PM`, `04:00 PM`, `05:00 PM`, `06:00 PM`, `07:00 PM`, `08:00 PM`, `09:00 PM`, `10:00 PM`, `11:00 PM`, `12:00 AM`, `01:00 AM` → `09:00 AM`

---

## Features & User Actions (Admin)

### 1. View All Meetings

- **API:** `GET /meetings/`
- **Filters:** Date, Sales Executive, Status, Lead
- **Includes** full lead details (name, area, phone)

### 2. Meeting Calendar / Schedule View

- **API:** `GET /dashboard/meetings`
- **UI:** Weekly/monthly calendar view
- Bar chart view: `GET /dashboard/meeting-barchart`
- Monthly aggregate: `GET /dashboard/monthly-meeting-data`

### 3. Create Meeting

- **API:** `POST /meetings/`
- **Inputs:** Lead ID, Date, Slot, Sales Executive, Visit Charge
- Auto-links to Lead and updates lead status to `Meeting Fixed`

### 4. Update Meeting

- **API:** `PUT /meetings/:id`
- Change status, update slot/date, log outcome

### 5. Delete Meeting

- **API:** `DELETE /meetings/:id`

### 6. View Meeting Details

- **API:** `GET /meetings/:id`
- Shows linked lead info, GPS route, status history, visit charge

### 7. Meeting Analytics (Dashboard)

- Total meetings by status (Fixed, Complete, Sold, etc.)
- Daily / weekly / monthly breakdown
- Per Sales Executive performance

---

## Business Rules

- One meeting per lead per slot per date (no double-booking a SE)
- `visitCharge` is always in BDT (Bangladeshi Taka)
- When meeting status becomes `Sold`, lead status is updated to `Sold`
- GPS tracking is optional — SE can update flow status without GPS
