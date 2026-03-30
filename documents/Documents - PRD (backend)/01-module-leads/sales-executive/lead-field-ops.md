# Module 01 — Leads | Sales Executive View

## Purpose

The Sales Executive handles all **field-related activities** after a meeting is fixed. They manage on-site visits, update meeting outcomes, log call activities, and move leads through the post-meeting production stages.

---

## Sales Executive Responsibilities

| Responsibility                  | Description                                                 |
|---------------------------------|-------------------------------------------------------------|
| Attend scheduled meetings        | Go to customer's location at agreed time slot               |
| Update meeting status            | Log outcome (Complete, Sold, Follow-Up, etc.)               |
| Track meeting location           | GPS check-in when leaving and arriving                      |
| Update lead post-meeting status  | Move lead to `Sold`, `Quotation Sent`, `Lost`, etc.         |
| Manage sales follow-ups          | Log and track post-meeting follow-up calls/meetings         |
| View assigned leads              | Access leads where `salesExqName = current user`            |

---

## Pages & Features (Sales Executive)

### 1. My Leads

- Filtered to `salesExqName = current user`
- Shows leads from `Meeting Fixed` → `Handed Over`
- **Group by** status stage
- **Actions per lead:** Open detail, update status, add follow-up

### 2. Lead Detail — Sales Tab

- Full lead info including address for site visits
- Finance section: budget, project value, payment entries
- Project status: `Ongoing/Ready/Renovation` with sub-status

### 3. Lead Detail — Follow-Ups (Sales)

- `salesFollowUp` records for this lead
- Type: `Call` or `Meeting`
- Status: `Pending`, `Complete`, `Missed`, `Late Complete`
- Create new follow-up with scheduled time

### 4. Update Lead Status (Post-Meeting Stages)

| Status                   | Triggered After                           |
|--------------------------|-------------------------------------------|
| `Sold`                   | Sale confirmed at or after meeting        |
| `Quotation Sent`         | Quotation sent to customer                |
| `Prospect`               | Customer is seriously considering         |
| `Lost`                   | Deal failed                               |
| `Measurement Done`       | Site measurement completed                |
| `Material Ordered`       | Materials ordered from vendors            |
| `Material Received`      | Materials received at workshop            |
| `Making`                 | Production in progress                    |
| `Ready for Installation` | Order ready                               |
| `Out for Installation`   | Team dispatched for installation          |
| `Installation Completed` | Installation done                         |
| `Handed Over`            | Project handed over to customer           |

### 5. Finance Management — Recording Payments

- Add payment entries per lead after `Sold`
- Supported methods: `Cash`, `Cheque`, `Bank Transfer`, `Bkash`, `Nagad`, `Rocket`, `SSL E-Commerce`
- System tracks: `totalPayment`, `totalDue` automatically

---

## Notifications Received (Sales Executive)

| Event                         | Notification Method            |
|-------------------------------|-------------------------------|
| New meeting assigned to me    | Push notification (Firebase)  |
| Meeting today reminder        | Cron-based notification       |
| Follow-up due in 10 minutes   | Automated pre-notification    |
