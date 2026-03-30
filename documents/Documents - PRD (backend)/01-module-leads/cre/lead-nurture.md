# Module 01 — Leads | CRE (Customer Relations Executive) View

## Purpose

The CRE is the **primary point of contact** for customers. They handle all inbound and outbound communications, nurture leads through messaging, assign reminders, schedule follow-ups, and keep the lead status updated until a meeting is fixed.

---

## CRE Responsibilities

| Responsibility               | Description                                              |
|------------------------------|----------------------------------------------------------|
| Monitor incoming messages     | From Facebook Messenger and WhatsApp                    |
| Reply to customers            | Via the built-in messaging interface                    |
| Update lead status            | Move leads through the early lifecycle stages           |
| Schedule reminders            | Set time-based alerts for follow-up actions             |
| Schedule follow-ups           | Log planned calls, with status tracking                 |
| Add comments/notes            | Document customer interactions and progress             |
| Fix meetings                  | Hand off to Sales Executive by scheduling a meeting     |
| Collect phone numbers         | Parse numbers from chat and update lead profile         |

---

## Pages & Features (CRE)

### 1. My Leads (Assigned to Me)

- Filtered view of leads where `creName = current user`
- **Sorted by:** last message time, urgency
- **Filters:** Status, source (FB, WA), unread messages
- **Quick actions per lead:**
  - Mark as read / unread
  - Change status
  - Open chat
  - Add reminder
  - Fix meeting

### 2. Lead Detail — Communication Tab

Displays full conversation history:

| Section        | Content                                       |
|----------------|-----------------------------------------------|
| Messages       | Full chat thread (FB or WhatsApp)             |
| Call Logs      | Incoming/Outgoing calls with duration         |
| Comments       | Internal notes with optional image attachments |

**Actions:**
- Reply via messenger/WhatsApp
- Upload image in reply
- Toggle AI bot on/off for this lead
- Mark message as seen (`messagesSeen`)

### 3. Lead Detail — Reminders Tab

- **View:** List of all reminders with status badges
- **Create Reminder:** Set date/time → system notifies 10 min before
- **Update Status:** Mark as `Complete` / `Missed` etc.
- Reminder statuses: `Pending`, `Complete`, `Missed`, `Late Complete`

### 4. Lead Detail — Follow-Ups Tab

- **Create Follow-Up:** Set time, type (`Call` or `Meeting`)
- **Track Status:** `Pending`, `Complete`, `Missed`, `Late Complete`
- If type is `Meeting`, linked to actual Meeting record
- 10-minute advance notification supported

### 5. Add Comment / Note

- Free-text comment with optional image upload
- Stored with author name and timestamp
- Visible to all staff assigned to lead

### 6. Fix Meeting (Hand Off)

- **Action:** Create a meeting entry linked to this lead
- **Inputs:** Date, Time Slot, Sales Executive assignment, Visit Charge
- **Lead status** automatically moves to `Meeting Fixed`

### 7. Update Lead Status

CRE can move the lead through early stages:

| From         | To Options                                        |
|--------------|---------------------------------------------------|
| `New`        | `No Response`, `Need Support`, `Ongoing`, etc.    |
| `Ongoing`    | `Follow Up`, `Meeting Fixed`, `Close`             |
| `Follow Up`  | `Ongoing`, `Meeting Fixed`, `Close`               |

---

## Notifications Received (CRE)

| Event                              | Notification Trigger                      |
|------------------------------------|-------------------------------------------|
| New message from customer (FB/WA)  | Real-time socket + push notification      |
| Reminder 10 minutes before due     | Automated cron job trigger                |
| Follow-up 10 minutes before due    | Automated cron job trigger                |
| New lead assigned to me            | Push notification via Firebase FCM        |

---

## AI Bot Interaction (CRE)

- CRE can enable/disable `aiBotReply` per lead
- When enabled, OpenAI assistant responds to customer messages automatically
- CRE can monitor the AI conversation and intervene at any time
- AI assistant is linked via `aiBotConfig.assistantId` and `aiBotConfig.threadId`
