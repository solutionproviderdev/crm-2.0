# Module 06 (Supplement) — Conversation Center | CRE

## Purpose

The Conversation Center is the **inbox** within the CRM — a dedicated view that aggregates all lead conversations for quick triage and response. Unlike the general lead list, this is focused entirely on the messaging layer: seeing messages, replying, searching, and managing AI bot behavior per lead.

---

## Inbox Views

| View                | Endpoint                              | Description                                                 |
|---------------------|---------------------------------------|-------------------------------------------------------------|
| All Conversations   | `GET /leads/conversation/`           | All leads sorted by most recent customer message            |
| Follow-Up Inbox     | `GET /leads/conversation/followup`   | Leads whose latest interaction requires a follow-up action  |
| Unseen Conversations| `GET /leads/conversation/unseen`     | All conversations where `messagesSeen = false`              |

---

## Search

- **Endpoint:** `GET /leads/conversation/search/:phrase`
- Searches across **name** and **phone number**
- Supports partial matching for fast lookup during live chats

---

## Per-Lead Conversation Actions

| Action                  | Endpoint                                       | Description                                         |
|-------------------------|------------------------------------------------|-----------------------------------------------------|
| Get all messages        | `GET /leads/conversation/:leadId/messages`     | Full message thread for a lead (FB or WA)           |
| Send message            | `POST /leads/conversation/:leadId/messages`    | Reply to a lead via their active channel (FB or WA) |
| Mark messages as seen   | `PUT /leads/conversation/:id/mark-messages-seen` | Sets `messagesSeen = true`                        |
| Toggle AI Bot Reply     | `PUT /leads/conversation/:id/toggle-ai-bot-reply` | Flips the `aiBotReply` flag on/off per lead     |

---

## Conversation Statistics

- **Endpoint:** `GET /leads/conversation/conversationstat`
- Returns aggregate counts of:
  - Unread (unseen) conversations
  - "Need to Call" leads
  - Conversations awaiting CRE response
- Used as **badges/counters** in the sidebar navigation

---

## Message Sending Validation Rules

| Field       | Rule                                                       |
|-------------|------------------------------------------------------------|
| `content`   | Required, cannot be empty                                  |
| `channel`   | Determined automatically by lead's `source` (FB or WA)    |
| `leadId`    | Must reference an existing, active lead                    |

---

## Google Sheets Export

- **Endpoint:** `GET /leads/sheet`
- Generates a report of leads by name and exports data to Google Sheets
- Used for offline analysis and sharing with management
