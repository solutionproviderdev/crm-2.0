# Module 06 — Messaging | Admin Overview

## Purpose

Admins can **oversee all communication channels**, manage integrations, and configure automation rules. Unlike CREs who work in the inbox, Admins configure the messaging infrastructure.

---

## Admin Capabilities

| Capability                        | Description                                             |
|-----------------------------------|---------------------------------------------------------|
| View all conversations             | Access messaging for any lead (not just assigned)       |
| Monitor bot activity               | See which leads have AI bots active                     |
| Configure Facebook pages           | Connect/disconnect pages via Settings                   |
| Configure WhatsApp accounts        | Manage WA sessions via Settings                         |
| Set up saved message templates     | Create quick-reply library for all CREs                 |
| Configure media reply automation   | Set up automated media responses                        |
| View message statistics            | Total messages sent/received per channel                |

---

## Webhook Management

### Facebook Webhook

- Receives events: messages, message reads, deliveries
- **Route:** `POST /webhook/facebook`
- On new message:
  1. Find or create Lead by `fbSenderID`
  2. Append message to lead's `messages` array
  3. Notify CRE via Socket.IO
  4. Trigger AI bot if enabled

### WhatsApp Webhook

- **Route:** `POST /whatsapp/`
- Baileys socket events handled via `src/bot/` handlers
- On new message:
  1. Find Lead by WhatsApp JID (phone number)
  2. Create Lead if not found
  3. Append message to lead
  4. Notify CRE via Socket.IO

---

## Message Broadcasting

- **Route:** `POST /whatsAppMessage/`
- Send bulk WhatsApp messages to multiple leads
- Used for marketing campaigns or mass follow-ups

---

## Map Data (Lead Location Mapping)

- **Route:** `GET /mapData/`
- Administrators can view lead distribution on a map
- Data: lead address (division, district, area) with geocoordinates
- Used for territory management and SE routing
