# Module 06 — Messaging | CRE View

## Purpose

The Messaging module is the **communication hub** for the CRM. It handles real-time messaging across Facebook Messenger and WhatsApp, and provides CREs with a unified inbox to manage all conversations with leads.

---

## Supported Channels

| Channel             | Integration Method                             |
|---------------------|------------------------------------------------|
| **Facebook Messenger** | Meta Webhook → automatic lead creation and message sync |
| **WhatsApp**        | Baileys multi-device API → WebSocket connection |

---

## Messaging Inbox (CRE)

### Inbox View

- Shows all leads with recent message activity
- **Sorted by:** most recent customer message time (`lastCustomerMessageTime`)
- **Unread indicator:** `messagesSeen = false`
- **Filter options:**
  - All / Unread / Read
  - By channel (FB / WA)
  - My leads only / All leads

### Conversation Thread

Each lead has a full message history stored in the `messages` array:

| Field                | Description                                    |
|----------------------|------------------------------------------------|
| `messageId`          | Platform-specific message ID                   |
| `content`            | Message text                                   |
| `senderId`           | Sender ID from the platform                    |
| `sentByMe`           | `true` if sent by CRM staff, `false` if customer |
| `fileUrl`            | Array of attached media URLs                   |
| `isSticker`          | Whether the message is a sticker              |
| `isAiMessage`        | Whether this was sent by AI bot               |
| `isAutomatedMessage` | Whether from automated sequence              |
| `date`               | Exact timestamp                               |

### Sending Messages

- **Facebook:** Post reply via Facebook Graph API using page access token
- **WhatsApp:** Send via Baileys socket connection (text, images, documents)
- File upload supported for media attachments

---

## Real-Time Features

- **Socket.IO** pushes new messages to the CRE's browser in real time
- Message list updates instantly without page refresh
- Unread count badges update in real time

---

## AI Bot Auto-Reply

| Setting             | Description                                        |
|---------------------|----------------------------------------------------|
| `aiBotReply`        | Toggle per-lead AI auto-reply                      |
| `assistantId`       | OpenAI Assistant assigned to this lead             |
| `threadId`          | Conversation thread maintained in OpenAI           |
| `botResponded`      | Whether the bot already replied to latest message  |

When AI bot is ON:
1. Customer sends a message
2. System forwards message to OpenAI thread
3. AI generates response and sends it back to customer
4. Message is stored with `isAiMessage = true`
5. CRE can view all AI messages and intervene at any time

---

## Saved Messages (Quick Replies)

CREs can save commonly used reply templates:

- **API:** `GET /settings/saved-messages/`
- **Create:** `POST /settings/saved-messages/`
- Used in the messaging UI for quick one-click replies

---

## Media Reply Settings

Automated media (images, videos) replies based on triggered conditions:

- **API:** `GET /settings/media-reply/`
- **Create/Update:** `POST /settings/media-reply/`
- Used to send product images or brochures automatically

---

## Call Logs (WhatsApp Voice Calls)

Each lead tracks call metadata:

| Field            | Description                              |
|------------------|------------------------------------------|
| `callType`       | `Incoming` or `Outgoing`                 |
| `status`         | `Missed` or `Received`                   |
| `callDuration`   | Duration string                          |
| `recipientNumber`| Phone number involved                    |
| `timestamp`      | When the call happened                   |

---

## Features List

| Feature                          | Description                                         |
|----------------------------------|-----------------------------------------------------|
| Unified inbox                    | All Facebook + WhatsApp conversations in one view   |
| Real-time messaging              | Socket.IO live updates                              |
| Media sharing                    | Send/receive images and documents                   |
| AI bot toggle                    | Enable/disable AI auto-reply per lead               |
| Mark as read/unread              | Track seen status                                   |
| Saved messages (quick replies)   | Pre-saved response templates                        |
| Media reply automation           | Auto-send images on trigger                         |
| Call log tracking               | Log voice call activity per lead                    |
| Lead auto-creation               | New leads created automatically from first message  |
