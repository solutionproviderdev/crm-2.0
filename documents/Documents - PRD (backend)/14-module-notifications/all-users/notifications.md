# Module 14 — Notifications | All Users

## Purpose

The Notifications module provides a **cross-platform push and in-app notification system** backed by Firebase Cloud Messaging (FCM). Every important event in the CRM — lead assignments, messages received, reminders due, follow-ups due, phone numbers collected — triggers a notification to the relevant staff member.

---

## Notification Types

| Notification Type           | Recipient      | Trigger                                                     |
|-----------------------------|----------------|-------------------------------------------------------------|
| New Lead Assigned           | CRE            | Lead's `creName` is set or changed                          |
| Phone Number Collected      | CRE            | Auto-cron detects a BD phone number in a lead's message     |
| Reminder Due (10-min alert) | CRE            | A reminder on any of their leads is 10 minutes away         |
| Reminder Missed             | CRE            | A reminder passed without being marked complete             |
| Sales Follow-Up Due         | Sales Executive| A follow-up call/meeting is 10 minutes from its scheduled time |
| Sales Follow-Up Missed      | Sales Executive| A follow-up time passed without being resolved              |
| New Meeting Assigned        | Sales Executive| A new Meeting is created and linked to their account        |
| New Inbound Message         | CRE            | A customer sends a message on FB or WhatsApp                |

---

## Notification Delivery Channels

| Channel               | Technology       | Use                                                          |
|-----------------------|-----------------|--------------------------------------------------------------|
| **Push Notification** | Firebase FCM     | Sent to mobile app (Android/iOS) via device token           |
| **Real-Time Socket**  | Socket.IO        | In-browser pop-up/badge update without page refresh          |

---

## API Endpoints

| Action                         | Endpoint                                    | Description                                         |
|--------------------------------|---------------------------------------------|-----------------------------------------------------|
| Send notification to one user  | `POST /notifications/send`                  | Admin triggers a manual push notification           |
| Send to multiple users         | `POST /notifications/send-to-multiple`      | Broadcast to a list of user IDs                     |
| Get my notifications           | `GET /notifications/:userId`                | Retrieve all notifications for a user               |
| Mark one as read               | `POST /notifications/mark-as-read`          | Dismiss a specific notification                     |
| Mark all as read               | `POST /notifications/mark-all-as-read/:userId` | Bulk-dismiss all notifications for a user        |

---

## Notification Schema

| Field        | Type     | Description                                            |
|--------------|----------|--------------------------------------------------------|
| `userId`     | ObjectId | The staff member receiving the notification            |
| `title`      | String   | Short headline (e.g. "New Lead Assigned")              |
| `body`       | String   | Detail text                                            |
| `type`       | String   | Category: `lead`, `reminder`, `followup`, `message`   |
| `referenceId`| ObjectId | Link to related document (lead, meeting, etc.)         |
| `read`       | Boolean  | `true` once user acknowledged the notification         |
| `createdAt`  | Date     | Timestamp                                              |

---

## Device Token Management

Users can have **multiple device tokens** (multi-device support):

- `deviceTokens: [String]` — array of all registered FCM tokens
- `mobileDeviceToken: String` — primary mobile device token
- Tokens are registered automatically when a user logs in on a new device via:  
  **`PUT /auth/device-token`**
