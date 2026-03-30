# CRM Application — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Date:** March 2026  
> **Status:** Active  
> **Stack:** React (Vite), TypeScript, Redux Toolkit, MUI, TailwindCSS

---

## 1. Product Overview

This is a full-featured **Customer Relationship Management (CRM)** system built for a real estate / interior design business. It manages the complete sales pipeline from lead acquisition through project completion, with WhatsApp-based messaging integration, AI-powered features, meeting scheduling, product quotation generation, and comprehensive analytics.

The application is tailored for a **Bangladeshi real estate market context**, with multi-language support (Bengali/English) and local business workflow patterns.

---

## 2. Core Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Lead Management** | Full lead lifecycle from acquisition to conversion |
| 2 | **CRE (Customer Relationship Executive)** | Dedicated CRE dashboard, lead center, follow-ups |
| 3 | **Sales** | Sales dashboard, meetings, follow-ups, pipeline management |
| 4 | **Meetings** | Scheduling, time-slot management, meeting tracking |
| 5 | **Quotations** | Client quotation generation with product specs and printing |
| 6 | **Product Management** | Product catalog with specs, series, and pricing |
| 7 | **User & Auth Management** | Users, departments, roles, permissions |
| 8 | **Settings** | Lead distribution, WhatsApp/Facebook, AI assistants, messaging |
| 9 | **Utility Tools** | Meta Ads analytics, geographic map, ElitBuzz SMS integration |
| 10 | **Admin Tools** | Cabinet calculation, 2D layout designer, performance dashboards |

---

## 3. User Roles & Access

| Role | Route Prefix | Description |
|------|-------------|-------------|
| **Admin** | `/admin/` | Full access to all modules, settings, analytics |
| **Operator** | `/operator/` | Lead center access, monitoring |
| **CRE** | `/cre/` | Lead management, follow-ups, meetings, AI voice |
| **Sales Executive** | `/sales/` | Sales dashboard, meetings, follow-up, quotations |

---

## 4. Folder Structure of This PRD

```
Documents - PRD/
├── 00_overview.md                  ← This file
├── 01_user_roles.md                ← Detailed roles & permissions
├── modules/
│   ├── M1_lead_management/
│   │   ├── admin_lead_management.md
│   │   ├── cre_lead_management.md
│   │   └── lead_center_operator.md
│   ├── M2_cre_module/
│   │   ├── cre_dashboard.md
│   │   ├── cre_lead_center.md
│   │   ├── cre_follow_up.md
│   │   └── cre_ai_voice.md
│   ├── M3_sales_module/
│   │   ├── sales_dashboard.md
│   │   ├── sales_meetings.md
│   │   ├── sales_follow_up.md
│   │   └── sales_quotation.md
│   ├── M4_meetings_module/
│   │   ├── meeting_slot.md
│   │   └── meetings_overview.md
│   ├── M5_quotation_module/
│   │   └── create_quotation.md
│   ├── M6_product_module/
│   │   └── product_management.md
│   ├── M7_user_auth_module/
│   │   ├── login.md
│   │   ├── user_management.md
│   │   ├── department_management.md
│   │   └── role_management.md
│   ├── M8_settings_module/
│   │   ├── profile_settings.md
│   │   ├── lead_settings.md
│   │   ├── facebook_settings.md
│   │   ├── whatsapp_login.md
│   │   ├── ai_integration.md
│   │   ├── assistants.md
│   │   ├── saved_messages.md
│   │   └── media_type_reply.md
│   ├── M9_utility_module/
│   │   ├── ads_page.md
│   │   ├── map_page.md
│   │   └── elitbuzz_integrate.md
│   └── M10_admin_tools/
│       ├── admin_dashboard.md
│       ├── cabinet_calculation.md
│       └── 2d_layout_designer.md
```

---

## 5. Key Technology Decisions

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | React 18 + Vite | Fast builds, HMR |
| Language | TypeScript | Strict typing throughout |
| State Management | Redux Toolkit (RTK Query) | API caching, optimistic updates |
| UI Framework | MUI v6 + TailwindCSS | MUI for tables/forms, Tailwind for layout |
| Charts | Recharts + MUI X Charts | Dashboard analytics |
| Date Handling | Day.js + MUI Date Pickers | Localized date input |
| Messaging | WhatsApp Business API | Lead communication channel |
| AI | Custom AI integration (OpenAI-based) | Assistants, voice transcription |
| Print | react-to-print | Quotation PDF generation |
| Auth | JWT + Redux auth slice | Role-based route guards |

---

## 6. Lead Status Flow

```
New → Number Collected → Ongoing → Meeting Fixed → Meeting Complete → Sold
         ↓                ↓              ↓
    No Response      Call Reschedule  Meeting Canceled
         ↓
    Message Reschedule
         ↓
      Closed
```

---

## 7. Key Business Logic

- **Lead Assignment:** Leads are automatically distributed to CRE agents via a weighted algorithm based on performance scores. Manual override is available per-CRE.
- **WhatsApp Integration:** Leads arriving via Facebook/Meta ads are routed through WhatsApp for initial contact.
- **Task Queue (Operator View):** The Operator Lead Center shows prioritized task queues (Hot Leads → New Leads → Follow-ups → Previous Replies → Expiring).
- **Project Tracking:** Active clients can have a "Project Status" (e.g. Ongoing, Material Received, Project in Production, Project Complete, Handed Over) that visualizes post-sale or active project progression.
- **Quotation Generator:** Creates formatted A4 quotations for cabinet/interior projects linked to a lead. Supports print with ink-saving mode.
- **Meeting Slot System:** Time slots can be blocked/unblocked per executive for meeting scheduling.
- **Performance Scoring:** CRE agents are scored based on meeting conversion rates, influencing automatic lead assignment ratios.
