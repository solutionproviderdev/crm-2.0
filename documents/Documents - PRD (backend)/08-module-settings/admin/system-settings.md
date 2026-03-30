# Module 08 — Settings | Admin View

## Purpose

The Settings module is the **system configuration hub** for the CRM. It manages integrations, AI configuration, messaging automation, Facebook page connections, WhatsApp account setup, and lead control rules.

---

## Sub-Modules Overview

| Sub-Module            | Route                              | Description                              |
|-----------------------|------------------------------------|------------------------------------------|
| Facebook Integration  | `/settings/facebook`               | Connect Facebook pages for messaging     |
| Lead Control          | `/settings/lead`                   | Auto-assign and lead routing rules       |
| AI Assistants         | `/settings/assistants`             | OpenAI assistant configuration           |
| AI Integration        | `/settings/ai-integration`         | Enable/configure AI for leads            |
| Saved Messages        | `/settings/saved-messages`         | Quick reply template library             |
| Media Reply           | `/settings/media-reply`            | Automated media responses                |
| ElitBuzz Integration  | `/settings/elitbuzz-integration`   | SMS notification setup                   |

---

## 8.1 Facebook Integration

### Purpose
Connect one or more Facebook Business Pages to receive and respond to Messenger conversations.

### Features

| Feature                       | Description                                              |
|-------------------------------|----------------------------------------------------------|
| Add Facebook Page             | Connect page via Meta API (page access token, page ID)  |
| View connected pages          | List all linked pages with status                        |
| Page profile pictures         | Sync and display page profile photos in lead cards       |
| Webhook configuration         | Receive real-time message events from Facebook           |
| Disconnect page               | Remove a page from the CRM                               |

### Data Stored (Settings Schema)

```json
{
  "name": "facebook",
  "settingsData": {
    "page": [
      {
        "pageId": "...",
        "pageName": "...",
        "pageAccessToken": "...",
        "pageProfilePicture": "..."
      }
    ]
  }
}
```

---

## 8.2 Lead Control Settings

### Purpose
Configure rules for automatic lead assignment and routing.

### Features

| Feature                    | Description                                              |
|----------------------------|----------------------------------------------------------|
| Auto-assign CRE            | Round-robin or rule-based CRE assignment for new leads  |
| Lead routing rules         | Assign based on source (Facebook page, WA number, etc.) |
| Auto-message count limit   | `autoMessageSentCount` tracking before handover          |

---

## 8.3 AI Assistants

### Purpose
Configure OpenAI Assistants used for AI-powered auto-reply on leads.

### Features

| Feature                    | Description                                              |
|----------------------------|----------------------------------------------------------|
| View all assistants         | List configured OpenAI assistants                       |
| Create assistant            | Register an OpenAI assistant in the system               |
| Activate / deactivate       | Toggle `active` flag per assistant                       |
| Configure instructions      | Set system prompt / personality for the assistant        |
| Configure tools             | Enable `code_interpreter`, `file_search`, `function` tools |
| Configure tool resources    | Attach vector store files, code interpreter files        |
| Temperature / top_p         | Tune AI response creativity settings                     |

### Assistant Schema Fields

| Field              | Description                                               |
|--------------------|-----------------------------------------------------------|
| `id`               | OpenAI assistant ID (unique)                              |
| `name`             | Display name                                              |
| `description`      | What this assistant does                                  |
| `model`            | OpenAI model (e.g. `gpt-4o`, `o1-mini`)                  |
| `instructions`     | System prompt                                             |
| `tools`            | Array of enabled tool types                               |
| `temperature`      | Creativity — lower = more deterministic                   |
| `top_p`            | Nucleus sampling                                          |
| `reasoning_effort` | Effort level for reasoning models                         |
| `active`           | Whether this assistant is currently in use                |

---

## 8.4 Saved Messages (Quick Reply Templates)

### Purpose
Build a library of commonly used reply templates that CREs can send with one click.

### Features

| Feature              | Description                               |
|----------------------|-------------------------------------------|
| Create template       | Save a message text with a label name     |
| View all templates    | List templates for quick selection        |
| Edit template         | Update text content                       |
| Delete template       | Remove unused templates                   |

### Schema Fields

| Field       | Description                      |
|-------------|----------------------------------|
| `title`     | Template name/label              |
| `content`   | Message body text                |
| `category`  | Grouping label (optional)        |

---

## 8.5 Media Reply Automation

### Purpose
Configure automatic media (image/file) responses that are sent when specific triggers occur.

### Features

| Feature              | Description                                           |
|----------------------|-------------------------------------------------------|
| Create media rule     | Define trigger condition + media to send              |
| View rules            | List all active media reply rules                    |
| Activate / deactivate | Toggle rule on/off                                   |
| Delete rule           | Remove rule                                          |

### Schema Fields

| Field         | Description                              |
|---------------|------------------------------------------|
| `trigger`     | Condition that fires this reply          |
| `mediaUrl`    | URL of the image/file to send            |
| `caption`     | Optional caption for the media           |
| `active`      | Whether rule is currently active         |

---

## 8.6 WhatsApp Account Management

WhatsApp connection is separate from settings but managed by admins:

| Feature                      | Description                                          |
|------------------------------|------------------------------------------------------|
| Connect WhatsApp account      | Scan QR code to link account via Baileys             |
| View connection status        | Check if WA socket is active                         |
| Reconnect / Disconnect        | Manage the active session                            |
| Multiple account support      | `WhatsAppAccountSchema` supports multiple sessions   |

### WhatsApp Account Schema (Summary)

| Field             | Description                               |
|-------------------|-------------------------------------------|
| `jid`             | WhatsApp JID (phone identifier)           |
| `sessionData`     | Stored authentication session             |
| `isActive`        | Is this account currently active?         |
| `connectedAt`     | Connection timestamp                      |

---

## 8.7 ElitBuzz Integration (SMS)

### Purpose
Send SMS notifications to customers via ElitBuzz API.

### Features

| Feature               | Description                                 |
|-----------------------|---------------------------------------------|
| Configure API key      | Store ElitBuzz API credentials              |
| Set sender ID          | SMS sender display name                     |
| View integration status| Check if integration is active              |

---

## Access Control

All settings pages are **Admin only**. No CRE or Sales Executive access.
