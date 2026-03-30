# Module 8 — Settings Module

The Settings module provides a centralized configuration area for Admins to control the CRM's operational behavior, including lead distribution rules, WhatsApp/messaging setup, AI tools, and saved communication templates.

**Layout:** `SettingsLayout` — persistent sidebar navigation between settings sections.

---

## 8.1 Profile Settings

**Source File:** `src/pages/settings/ProfileSettings.tsx`  
**Route:** `/admin/settings/profile`  
**Access:** All authenticated users

> Documented in Module 7.8. See User Auth Module for full details.

---

## 8.2 Lead Distribution Settings

**Source File:** `src/pages/settings/LeadSettings.tsx`  
**Route:** `/admin/settings/lead-settings`  
**Access:** Admin only

### Purpose
Control how new leads are automatically distributed to CRE agents, and configure messaging time rules.

### Sub-Sections

#### Global Settings (via `SettingsFields` component)

| Setting | Description |
|---------|-------------|
| **Performance Range Days** | Number of days of performance history used to calculate CRE assignment weights |
| **Message Seen Time (min)** | Time in minutes before a "message seen but not replied" reminder triggers |
| **Message Reply Time (min)** | Time in minutes before a "no reply" escalation triggers |
| **Re-Assign on Replied** | Toggle: automatically reassign lead when customer replies (to the CRE who was assigned) |
| **Re-Assign on Seen** | Toggle: reassign lead when message is seen but not replied |

#### Auto Message Settings (via `AutoMessageSettings` component)
- Configure automatic welcome/response messages sent to new leads
- Supports template variables for personalization
- Enabled/disabled toggle per message type

#### CRE Lead Distribution Table

| Column | Description |
|--------|-------------|
| **Active** | Toggle to include/exclude CRE from automatic assignment |
| **Name** | CRE agent name with profile picture |
| **Assigned** | Total leads currently assigned to this CRE |
| **Performance** | Performance score percentage |
| **Lead Assign Rate** | Percentage of new leads routed to this CRE |
| **Manual** | Toggle to enable manual override for this CRE's assignment rate |
| **Manual End Time** | Date when manual override expires (auto-reverts to performance-based rate) |

#### Manual Override Flow
1. Admin toggles "Manual" switch for a CRE
2. Backend creates a manual override record with:
   - Manual Lead Assign Rate (editable %)
   - Manual End Time (date picker)
3. CRE receives incoming leads at the override rate until the end time
4. After end time, system reverts to performance-based rate
5. Toggle off → immediately removes the override

#### Inline Editing
- Click **Edit (pencil icon)** on Lead Assign Rate → text field appears
- Click **Check icon** to confirm → API updates the rate
- Same inline edit available for Manual End Time (date picker appears)

---

## 8.3 Facebook / Meta Integration Settings

**Source File:** `src/pages/settings/FacebookSettings.tsx`  
**Route:** `/admin/settings/facebook`  
**Access:** Admin only

### Purpose
Connect the CRM to a Facebook Page / Meta Business account so leads from Facebook ads and Facebook Messenger are automatically imported.

### Features
- Facebook page connection wizard
- Access token configuration
- Page selection from connected Facebook account
- Webhook setup status indicator
- Test connection button
- Lead source mapping (Facebook Page → CRM lead source tag)

---

## 8.4 WhatsApp Login

**Source File:** `src/pages/settings/WhatsAppLogin.tsx`  
**Route:** `/admin/settings/whatsapp-login`  
**Access:** Admin only

### Purpose
Connect the CRM to a WhatsApp Business account for automated messaging, lead communication, and status updates via WhatsApp.

### Features
- QR code scanning for WhatsApp Web-style login
- Connection status indicator (Connected / Disconnected)
- Reconnect button
- Logout / disconnect button
- Phone number display of connected account

---

## 8.5 AI Integration Settings

**Source File:** `src/pages/settings/AiIntegration.tsx`  
**Route:** `/admin/settings/AI-Integration`  
**Access:** Admin only

### Purpose
Configure the AI backend connection, including API keys and model preferences.

### Features
- API key input (e.g., OpenAI API key)
- Model selection (e.g., GPT-4, GPT-3.5)
- Test connection / ping API
- Enable/disable AI features globally
- AI usage logs or status

---

## 8.6 Assistants Configuration

**Source File:** `src/pages/settings/Assistants.tsx`  
**Route:** `/admin/settings/assistants`  
**Access:** Admin only

### Purpose
Manage AI assistants used for automated lead responses, FAQs, and WhatsApp chat automation.

### Features
- List of configured AI assistants
- Name and behavior description per assistant
- Enable/disable per assistant
- Associate assistant with lead sources or departments
- Personality prompt configuration

---

## 8.7 Saved Messages Manager

**Source File:** `src/pages/settings/SavedMessagesManager.tsx`  
**Route:** `/admin/settings/saved-messages`  
**Access:** Admin only

### Purpose
Create and manage a library of pre-written response templates that CRE agents can quickly insert into conversations.

### Features
- List of saved message templates
- Create new template with title and body text
- Edit existing templates
- Delete templates
- Category/tag organization
- Template variable support (e.g., `{{client_name}}`)

---

## 8.8 Media Type Reply Management

**Source File:** `src/pages/settings/MediaTypeReplyManagement.tsx`  
**Route:** `/admin/settings/media-type-reply-management`  
**Access:** Admin only

### Purpose
Define automated reply rules based on the type of media a customer sends (e.g., image, video, document) in WhatsApp conversations.

### Features
- Rule list: "When customer sends [media type] → auto-reply with [message]"
- Supported media types: Image, Video, Audio, Document, Sticker, Location
- Toggle rules on/off
- Create/edit/delete rules

### Example Rules
- Customer sends an **Image** → auto-reply: "Thank you for the photo! Our team will review it shortly."
- Customer sends a **Voice Note** → auto-reply: "We heard your voice note and will respond soon."
- Customer sends a **Location** → auto-reply: "Thanks for sharing your location!"

---

## 8.9 Settings Layout Navigation

**Source File:** `src/layouts/SettingsLayout.tsx`

The SettingsLayout provides a persistent left sidebar with links to all settings sections:

| Menu Item | Route |
|-----------|-------|
| Profile | settings/profile |
| Lead Settings | settings/lead-settings |
| Facebook | settings/facebook |
| Assistants | settings/assistants |
| AI Integration | settings/AI-Integration |
| WhatsApp Login | settings/whatsapp-login |
| Media Type Reply | settings/media-type-reply-management |
| Saved Messages | settings/saved-messages |
