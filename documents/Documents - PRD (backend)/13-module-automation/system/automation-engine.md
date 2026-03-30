# Module 13 — Automation Engine | System-Level

## Purpose

The Automation Engine is the **brain of the CRM**. It runs a series of scheduled background jobs (cron tasks) that keep the system healthy, ensure leads are assigned to the right people, detect customer phone numbers automatically, fire reminders and follow-up notifications, and remove data quality issues — all without any manual intervention.

---

## Scheduled Jobs (All Times: Asia/Dhaka)

| Frequency    | Job                            | What It Does |
|--------------|-------------------------------|---|
| Every 2 min  | **Facebook Conversation Sync** | Fetches latest Facebook conversations from the Meta API and updates lead records with new messages in real-time |
| Every 2 min  | **Upcoming Reminders**         | Checks reminders due in the next 10 minutes and fires a push notification to the assigned CRE |
| Every 2 min  | **Upcoming Sales Follow-Ups**  | Same as above but for Sales Follow-Up records — alerts Sales Executives of pending calls/meetings |
| Every 2 min  | **Auto-Message Sender**        | Sends automated WhatsApp/FB messages to leads who match configured rules (e.g., no reply in X hours) — uses `autoMessageSentCount` to prevent spamming |
| Every 5 min  | **Duplicate Lead Detection**   | Groups leads by `pageId + fbSenderID`, identifies duplicates, and deletes all but the oldest record |
| Every 5 min  | **Name-Based CRE Assignment**  | Parses Facebook assignment messages (e.g., "assigned this conversation to [CRE Name]") and syncs the `creName` field on the lead |
| Every 5 min  | **Phone Number Detection**     | Scans new leads' message content for valid Bangladeshi phone numbers (using `libphonenumber-js`). Supports both English and Bengali numerals. If found, adds to `phone[]` and updates status to `Number Provided`. Notifies CRE via push notification. |
| Every 5 min  | **Re-Assign on Not Replied**   | Detects leads assigned to a CRE who hasn't replied within the configured time window, and escalates / reassigns |
| Every 5 min  | **Re-Assign on Not Seen**      | Detects leads where messages are unread for too long and reassigns to another available CRE |
| Every 10 min | **Assign Unassigned Leads**    | Finds leads with no CRE assigned and distributes them via a round-robin or performance-based algorithm |
| Every 10 min | **Missed Reminder Check**      | Marks reminders that have passed their scheduled time as `Missed` |
| Every 10 min | **Product-Ad Linking**         | Scans lead messages for keywords that match configured product ads, linking the ad to the lead's `productAds` array |
| Every 10 min | **Duplicate Message Cleanup**  | Finds duplicate messages within lead conversations (by `messageId`) and removes redundant copies |

---

## Startup Tasks (On Server Boot)

The following tasks run **once** immediately when the server starts:

| Task                       | Purpose                                                      |
|----------------------------|--------------------------------------------------------------|
| `reschedulePendingReminders` | Re-queues any reminders that were in a `Pending` state when the server last shut down |
| `nameBasedLeadAssign`      | Ensures CRE assignments from Facebook are up-to-date immediately on boot |
| `checkProductAdForLeadMessages` | Links product ads to any leads received during server downtime |
| `reAssignOnNotReplied`     | Immediate check for stale unresponded leads                  |
| `reAssignOnNotSeen`        | Immediate check for unread conversations                     |
| `findDuplicateLeads`       | Cleans up any duplicates created during server downtime      |
| `detectAndUpdateCollectedNumbers` | Catches phone numbers from messages received during downtime |
| `getPerformanceBasedCRE`   | Loads current CRE performance metrics for smart assignment   |

---

## Phone Number Detection Logic (Detail)

This is one of the most critical automation features:

1. System scans all `New` status leads
2. For each lead, it reads customer-sent messages (not staff messages)
3. It strips all non-numeric characters from the message content
4. It converts Bengali/Bangla numerals (০–৯) to English (0–9)
5. It validates the number using `libphonenumber-js` for Bangladesh (`BD`)
6. If a valid 14-digit BD number is found:
   - It's added to `lead.phone[]`
   - Lead status is updated from `New` to `Number Provided`
   - The assigned CRE receives a push notification
7. Entire process streams leads as a cursor to avoid memory overload

---

## CRE Auto-Assignment Logic

Two complementary strategies:

### 1. Facebook Name-Based Assignment
- Reads Facebook automated system messages like `"[Page] assigned this conversation to [Person Name]"`
- Maps Facebook display names to CRM user accounts using a configurable name map
- Updates `creName` on the lead without manual input

### 2. Round-Robin / Performance-Based Assignment
- Finds leads where `creName` is null (unassigned)
- Uses `getPerformanceBasedCRE()` to pick the CRE with the best current workload/performance balance
- Assigns and notifies the CRE via Firebase push notification

---

## Re-Assignment Escalation

| Rule                  | Trigger                                                  | Action                              |
|-----------------------|----------------------------------------------------------|-------------------------------------|
| Not Replied           | Assigned CRE has not sent any message within threshold   | Reassign to another CRE             |
| Not Seen              | Messages are unread for longer than the threshold window | Reassign, notify team lead           |

---

## Auto-Messaging

When a lead qualifies for auto-message (based on rules configured in Settings):
1. System checks `autoMessageSentCount` to prevent sending more than the allowed number
2. Sends a templated WhatsApp/Facebook message
3. Increments `autoMessageSentCount`
4. Logs the message in the lead's `messages[]` with `isAutomatedMessage = true`
