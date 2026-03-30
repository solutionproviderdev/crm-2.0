# Module 01 — Leads | Admin View

## Purpose

The Leads module is the **core of the CRM**. It captures potential customers from multiple channels and tracks them through the entire sales lifecycle — from initial inquiry to final project handover and payment collection.

---

## User Role: Admin

Admins have **full read/write access** to all leads across all staff members.  
They can assign/reassign CREs and Sales Executives, delete leads, and view financial summaries.

---

## Lead Sources (Channels)

| Source       | How Leads Arrive                                   |
|--------------|----------------------------------------------------|
| **Facebook** | Automatically created from Facebook Messenger messages received on connected pages |
| **WhatsApp** | Automatically created from incoming WhatsApp messages |
| **Phone**    | Manually created by CRE after a phone call         |
| **Web**      | Manually created from website enquiries            |

---

## Lead Data Model

### Core Fields

| Field              | Type         | Description                                     |
|--------------------|--------------|-------------------------------------------------|
| `CID`              | String       | Auto-generated unique Customer ID (e.g. `FB-24MAR26-001`) |
| `name`             | String       | Customer full name (required)                   |
| `phone`            | [String]     | Array of phone numbers (multiple supported)     |
| `source`           | Enum         | `Facebook`, `WhatsApp`, `Web`, `Phone`          |
| `status`           | Enum         | See lifecycle stages below                      |
| `address`          | Object       | Division, District, Area, Address, Geo-coords   |
| `profilePicture`   | String       | URL to customer profile photo                   |

### Assignment Fields

| Field            | Description                                        |
|------------------|----------------------------------------------------|
| `creName`        | Assigned CRE (Customer Relations Executive)         |
| `salesExqName`   | Assigned Sales Executive                           |
| `lastAssigned`   | Timestamp of last assignment change                |

### Channel-Specific Info

**Facebook:**
```
pageInfo.pageId, pageInfo.pageName, pageInfo.fbSenderID, pageInfo.pageProfilePicture
```

**WhatsApp:**
```
whatsAppInfo.jid, whatsAppInfo.pushName, whatsAppInfo.verifiedBizName, whatsAppInfo.profilePicture
```

### Project Info

| Field               | Values                                             |
|---------------------|----------------------------------------------------|
| `projectStatus.status` | `Ongoing`, `Ready`, `Renovation`              |
| `projectStatus.subStatus` | `Roof Casting`, `Brick Wall`, `Plaster`, `Pudding`, `Two Coat Paint`, `Tiles Complete`, `Final Paint Done`, `Handed Over`, `Staying in the Apartment`, `Interior Work Complete` |
| `projectLocation`   | `Inside`, `Outside`                                |
| `requirements`      | Array of text strings describing customer needs    |

### Finance

| Field              | Description                                        |
|--------------------|----------------------------------------------------|
| `clientsBudget`    | Customer's stated budget                           |
| `projectValue`     | Estimated project value                            |
| `soldAmount`       | Actual sold amount                                 |
| `soldDate`         | Date of sale confirmation                          |
| `totalPayment`     | Total amount paid so far                           |
| `totalDue`         | Outstanding balance                                |
| `payments`         | Array of payment records (see below)               |

**Payment Record:**

| Field           | Values                                                                        |
|-----------------|-------------------------------------------------------------------------------|
| `amount`        | Payment amount                                                                |
| `paymentMethod` | `Cash`, `Cheque`, `Bank Transfer`, `Bkash`, `Nagad`, `Rocket`, `SSL E-Commerce` |
| `paymentDate`   | Date of payment                                                               |
| `paymentStatus` | `Paid`, `Unpaid`                                                              |
| `paymentNote`   | Optional note                                                                 |

---

## Lead Lifecycle — Status Stages

The lead `status` field tracks the full journey of a lead through 24 stages:

```
New → No Response / Need Support / Message Rescheduled / Number Collected / Number Provided
    ↓
Call Reschedule / Ongoing / Close / Follow Up
    ↓
Meeting Fixed → Meeting Complete
    ↓
Quotation Sent → Prospect → Lost
    ↓
Sold → Measurement Done → Material Ordered → Material Received
    ↓
Making → Ready for Installation → Out for Installation → Installation Completed
    ↓
Handed Over
```

### Full Status List (24 stages)

| Status                  | Stage             | Description                                   |
|-------------------------|-------------------|-----------------------------------------------|
| `New`                   | Acquisition       | Lead just received, not yet contacted         |
| `No Response`           | Acquisition       | Customer hasn't replied yet                   |
| `Need Support`          | Acquisition       | Needs special handling                        |
| `Message Rescheduled`   | Acquisition       | Follow-up message scheduled                   |
| `Number Collected`      | Qualification     | Phone number retrieved from messages          |
| `Number Provided`       | Qualification     | Customer provided a number                    |
| `Call Reschedule`       | Qualification     | Call needs to be rescheduled                  |
| `Ongoing`               | Engagement        | Active conversation in progress               |
| `Close`                 | Engagement        | Conversation thread ended                     |
| `Follow Up`             | Engagement        | Scheduled for follow-up contact               |
| `Meeting Fixed`         | Meeting           | Meeting appointment confirmed                 |
| `Meeting Complete`      | Meeting           | Meeting happened                              |
| `Quotation Sent`        | Sales             | Formal quotation delivered to client          |
| `Prospect`              | Sales             | Potential buyer actively considering          |
| `Lost`                  | Sales             | Deal lost                                     |
| `Sold`                  | Post-Sale         | Sale confirmed                                |
| `Measurement Done`      | Production        | On-site measurement completed                 |
| `Material Ordered`      | Production        | Raw materials ordered from vendors            |
| `Material Received`     | Production        | Materials arrived at workshop                 |
| `Making`                | Production        | Manufacturing in progress                    |
| `Ready for Installation` | Production       | Order complete and ready to deliver           |
| `Out for Installation`  | Production        | Installation team en-route                    |
| `Installation Completed`| Production        | Installation finished                         |
| `Handed Over`           | Completed         | Project officially handed over to client      |

---

## Features & User Actions (Admin)

### 1. View All Leads

- **Path:** `GET /lead/`
- **UI:** Paginated list/board view of all leads
- **Filters:** status, source, assigned CRE/SE, date range, project location
- **Actions:** Open lead detail, assign staff, change status, delete

### 2. Lead Detail Page

- **Path:** `GET /lead/:id`
- **Sections:**
  - Contact info (name, phone, address, profile picture)
  - Communication history (messages, call logs)
  - Comments & notes log
  - Reminders & follow-ups
  - Meetings linked to this lead
  - Finance summary (budget, sold, payments, dues)
  - Project status and location

### 3. Create New Lead (Manual)

- **Path:** `POST /lead/`
- **Action:** Admin/CRE manually registers a lead from phone or walk-in
- **Inputs:** Name, phone, source, address, assigned staff
- **Auto-generated:** CID based on source and date

### 4. Update Lead Status

- **Path:** `PUT /lead/:id`
- **Action:** Move lead to any of the 24 lifecycle stages
- **Supported file upload:** Up to 3 images (e.g., measurement photos)

### 5. Assign / Reassign CRE

- **Path:** `PUT /lead/:id/creName`
- **Action:** Change which CRE is responsible for this lead

### 6. Add Tags

- **Path:** `PUT /lead/:id/tags`
- **Action:** Tag/label leads for custom filtering

### 7. Add Comment

- **Path:** `POST /lead/comment/:id`
- **Action:** Add a text note with optional image attachments
- **Visible to:** All staff assigned to the lead

### 8. Fix Meeting

- **Path:** `PUT /lead/fixMeeting/:id`
- **Action:** Schedule a meeting linked to this lead (delegates to Meeting module)

### 9. Reschedule Meeting

- **Path:** `PUT /lead/rescheduleMeeting/:id`
- **Action:** Reschedule an existing pending meeting

### 10. Delete Lead

- **Path:** `DELETE /lead/:id`
- **Action:** Permanently removes lead and all associated data

---

## Sub-Features Within Leads

### Reminders

Each reminder has:
- `time` — Scheduled datetime
- `status` — `Pending`, `Complete`, `Missed`, `Late Complete`
- Automated notification sent 10 minutes before (`tenMinNotificationSent`)

### Follow-Ups (Sales Follow Up)

Each follow-up has:
- `time` — Scheduled datetime
- `status` — `Pending`, `Complete`, `Missed`, `Late Complete`
- `type` — `Call` or `Meeting`
- `meetingId` — Link to Meeting record if type is `Meeting`
- 10-minute pre-notification support

### Call Logs

| Field            | Description                              |
|------------------|------------------------------------------|
| `recipientNumber`| Phone number of caller/receiver          |
| `callType`       | `Incoming` or `Outgoing`                 |
| `status`         | `Missed` or `Received`                   |
| `callDuration`   | Duration in seconds                      |
| `timestamp`      | Exact date/time of call                  |

### AI Bot Settings

| Field               | Description                                      |
|---------------------|--------------------------------------------------|
| `aiBotReply`        | Toggle AI auto-reply for this lead               |
| `aiBotConfig`       | OpenAI `assistantId` and `threadId` for this lead |
| `botResponded`      | Whether the bot has replied                      |
| `repliedFromSystem` | Whether system sent any message                  |

---

## CID Auto-Generation Logic

Customer IDs are auto-generated with the format:

```
{SOURCE_CODE}-{DDMMMYY}-{SEQ}
```

Examples:
- `FB-24MAR26-001` — First Facebook lead on 24 March 2026
- `WA-24MAR26-003` — Third WhatsApp lead on 24 March 2026

| Source    | Code |
|-----------|------|
| Facebook  | `FB` |
| WhatsApp  | `WA` |
| Phone     | `PH` |
| Web       | `WB` |
