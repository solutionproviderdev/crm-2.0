# Module 02 — Meetings | Sales Executive View

## Purpose

Sales Executives use the Meetings module to manage their daily visit schedule. They check-in when leaving, track arrival, update meeting outcomes, and handle visit charges.

---

## Pages & Features (Sales Executive)

### 1. My Meeting Schedule

- View today's and upcoming meetings assigned to me
- Shows: Customer name, address, area, time slot, visit charge
- Status indicator per meeting (Fixed / Leaved / Arrived / Ongoing)

### 2. Meeting Flow — Real-Time Status Updates

The SE updates meeting flow status in real time during a visit:

| Step | Action                         | Flow Status Set  |
|------|--------------------------------|------------------|
| 1    | Confirm attendance             | `Confirmed`      |
| 2    | Tap "I'm Leaving" (GPS logged) | `Leaved`         |
| 3    | Tap "I've Arrived" (GPS logged)| `Arrived`        |
| 4    | Start meeting                  | `Ongoing`        |
| 5    | Log outcome                    | `Completed`      |

### 3. Log Meeting Outcome

After completing a visit, SE updates the meeting status:

| Outcome           | Status Set        | Lead Status Updated To   |
|-------------------|-------------------|--------------------------|
| Sale confirmed    | `Sold`            | `Sold`                   |
| Need another visit| `Follow-Up`       | `Follow Up`              |
| Only measurement  | `Final Measurement`| `Measurement Done`      |
| Postponed         | `Postponed`       | No change                |
| Cancelled         | `Canceled`        | No change                |
| Handover visit    | `Handover & Review`| `Handed Over`           |

### 4. View Customer Info During Visit

- Full lead details accessible from meeting card
- Customer phone, address, project status, requirements
- Previous meeting history for context

### 5. Visit Charge Management

- View the `visitCharge` set for each meeting
- Charge is logged and included in financial reporting

---

## Notifications (Sales Executive)

| Event                           | Trigger                                    |
|---------------------------------|--------------------------------------------|
| New meeting assigned            | Push notification (Firebase FCM)           |
| Meeting reminder (day of)       | Automated daily cron notification          |
| Follow-up due                   | 10-minute advance notification             |
