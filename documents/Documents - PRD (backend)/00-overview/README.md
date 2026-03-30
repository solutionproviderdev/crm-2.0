# EaseIT CRM — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Date:** March 2026  
> **Project:** EaseIT CRM Backend System  
> **Stack:** Node.js · Express · MongoDB · Socket.IO · Firebase · OpenAI

---

## Table of Contents

| #  | Module                     | Description                                             |
|----|----------------------------|---------------------------------------------------------|
| 01 | [Leads](../01-module-leads/)              | Lead lifecycle management — from inquiry to handover    |
| 02 | [Meetings](../02-module-meetings/)        | Meeting scheduling, tracking and location monitoring   |
| 03 | [Quotations](../03-module-quotations/)    | Product-based quotation builder and pricing tool       |
| 04 | [Products](../04-module-products/)        | Product catalogue with series, materials, and pricing  |
| 05 | [Inventory](../05-module-inventory/)      | Vendor management and purchase orders                  |
| 06 | [Messaging](../06-module-messaging/)      | Omni-channel messaging (Facebook, WhatsApp, Web)       |
| 07 | [Dashboard](../07-module-dashboard/)      | Analytics, KPIs, and performance dashboards            |
| 08 | [Settings](../08-module-settings/)        | System configuration, AI, and integrations             |
| 09 | [Auth & Users](../09-module-auth/)        | User management, roles, and permissions                |
| 10 | [Marketing](../10-module-marketing/)      | Product ads and discount coupons                       |
| 11 | [Map Data](../11-module-map-data/)        | Geographic territories and visit charges               |
| 12 | [Project Stages](../12-module-project-management/) | Post-sale installation tracking              |
| 13 | [Automation Engine](../13-module-automation/)       | Scheduled background jobs and smart CRE assignment |
| 14 | [Notifications](../14-module-notifications/)        | Push and real-time in-app alerts (Firebase + Socket) |

---

## System Overview

EaseIT CRM is a full-featured Customer Relationship Management system tailored for a **furniture / interior design business** in Bangladesh. It manages the full sales lifecycle — from initial lead capture via Facebook Messenger or WhatsApp, through meetings and quotations, to order fulfilment and payment collection.

### Core Business Flow

```
Lead Capture (FB/WA/Phone/Web)
    ↓
CRE Assignment & Nurturing (messages, reminders, follow-ups)
    ↓
Meeting Scheduling & Completion
    ↓
Quotation Generation
    ↓
Sale Confirmed → Finance Tracking (payments, dues)
    ↓
Production Stages (Measurement → Making → Installation)
    ↓
Handover
```

---

## User Roles

| Role               | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **Admin**          | Full system access — manages users, settings, all modules                  |
| **Sales Executive (SE)**  | Manages field meetings, visits, lead status updates post-meeting    |
| **CRE (Customer Relations Executive)** | Front-line communicators; handles messaging, follow-ups, reminders |
| **Operator**       | Limited system access based on department permissions                      |

---

## Key Integrations

| Integration         | Purpose                                              |
|---------------------|------------------------------------------------------|
| Facebook Messenger  | Receive and send messages from Facebook pages        |
| WhatsApp (Baileys)  | WhatsApp messaging via multi-device API              |
| OpenAI (GPT)        | AI-assisted automated replies via Assistants API     |
| Firebase (FCM)      | Push notifications to mobile devices                 |
| ElitBuzz            | SMS notifications                                    |
| Socket.IO           | Real-time messaging and notification delivery        |

---

## Folder Structure of This PRD

```
Documents - PRD/
├── 00-overview/
│   └── README.md                  ← This file
├── 01-module-leads/
│   ├── admin/
│   │   └── lead-management.md
│   ├── cre/
│   │   └── lead-nurture.md
│   └── sales-executive/
│       └── lead-field-ops.md
├── 02-module-meetings/
│   ├── admin/
│   │   └── meeting-management.md
│   └── sales-executive/
│       └── meeting-field.md
├── 03-module-quotations/
│   ├── admin/
│   │   └── quotation-management.md
│   └── sales-executive/
│       └── quotation-create.md
├── 04-module-products/
│   └── admin/
│       └── product-catalog.md
├── 05-module-inventory/
│   └── admin/
│       └── inventory-management.md
├── 06-module-messaging/
│   ├── admin/
│   │   └── messaging-overview.md
│   └── cre/
│       └── messaging-inbox.md
├── 07-module-dashboard/
│   ├── admin/
│   │   └── admin-dashboard.md
│   └── cre/
│       └── cre-dashboard.md
├── 08-module-settings/
│   └── admin/
│       └── system-settings.md
├── 09-module-auth/
│   └── admin/
│       └── user-management.md
├── 10-module-marketing/
│   └── admin/
│       └── marketing-management.md
├── 11-module-map-data/
│   └── admin/
│       └── map-management.md
├── 12-module-project-management/
│   └── admin/
│       └── project-stages.md
├── 13-module-automation/
│   └── system/
│       └── automation-engine.md
└── 14-module-notifications/
    └── all-users/
        └── notifications.md
```
