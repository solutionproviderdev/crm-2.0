# Solution Provider CRM — Product Requirements Document (PRD)

**Product:** Solution Provider Intelligent Interior CRM  
**Company:** Solution Provider (Interior Design & Implementation, Dhaka, Bangladesh)  
**Document Version:** 1.0  
**Date:** March 2026  
**Status:** Complete Reference

---

## 📌 About This System

**Solution Provider CRM** is an AI-powered, full-stack Customer Relationship Management (CRM) system purpose-built for an interior design and implementation company operating in Dhaka, Bangladesh. The system manages the complete business lifecycle — from first Meta Ad lead capture through client meetings, project production, and factory delivery.

### Core Business Context
- **Industry:** Interior Design & Custom Furniture Manufacturing
- **Geography:** Dhaka, Bangladesh (Gulshan, Banani, Dhanmondi, Mirpur, Uttara, Motijheel)
- **Services:** Full Interior, Kitchen Cabinet, Wardrobe, Custom Furniture, Office Interior, Folding Door, Renovation, Design Only
- **Factory Model:** In-house factory with RTA (Ready-To-Assemble) approach

---

## 👥 User Roles

| Role | Code | Access Level | Primary Responsibility |
|------|------|--------------|------------------------|
| **Management** | `Management` | Full access + analytics | Oversight, reporting, strategy |
| **Admin** | `Admin` | Full system access | System configuration, user management |
| **CRE** (Customer Relationship Executive) | `CRE` | Leads, calls, follow-ups | Lead qualification, first contact, booking meetings |
| **Sales** | `Sales` | Meetings, quotations, projects | Site visits, closings, project handover |

---

## 📁 PRD Document Structure

```
Documents - PRD/
├── README.md                          ← You are here (Index)
├── PROJECT_OVERVIEW.md               ← System architecture, tech stack, data models
│
├── 01-Authentication/
│   └── login.md                      ← Login page PRD
│
├── 02-Global-Layout/
│   ├── sidebar.md                    ← Navigation sidebar PRD
│   └── header.md                     ← Global header + notifications PRD
│
├── 03-Module-Dashboard/
│   └── all-roles/
│       └── dashboard.md              ← Main dashboard PRD
│
├── 04-Module-CRM-Leads/
│   ├── cre/
│   │   └── leads-cre.md             ← CRM & Lead Management (CRE view)
│   └── management/
│       └── leads-management.md      ← CRM overview (Management view)
│
├── 05-Module-Meta-Leads/
│   └── admin-management/
│       └── meta-leads.md            ← Meta Lead Import Center PRD
│
├── 06-Module-CRE-Dashboard/
│   └── management/
│       └── cre-dashboard.md         ← CRE Performance Center PRD
│
├── 07-Module-Meetings/
│   ├── sales/
│   │   └── meetings-sales.md        ← Meeting Intelligence (Sales view)
│   └── management/
│       └── meetings-management.md   ← Meeting analysis & coaching (Manager view)
│
├── 08-Module-Projects/
│   └── all-roles/
│       └── projects.md              ← Project Management PRD
│
├── 09-Module-Factory/
│   └── all-roles/
│       └── factory.md               ← Factory & Production Tracking PRD
│
├── 10-Module-Reports/
│   └── management/
│       └── reports.md               ← Daily Reporting System PRD
│
├── 11-Module-AI-Assistant/
│   └── cre-sales/
│       └── ai-assistant.md          ← AI Assistant PRD
│
└── 12-Module-Marketing/
    └── management/
        └── marketing.md             ← Marketing Tracking PRD
```

---

## 🗂️ Module Summary

| # | Module | Route | Primary Users |
|---|--------|-------|---------------|
| 1 | Login | `/` | All |
| 2 | Dashboard | `/dashboard` | All |
| 3 | CRM & Leads | `/leads` | CRE, Management |
| 4 | Meta Leads | `/meta-leads` | Admin, Management |
| 5 | CRE Dashboard | `/cre-dashboard` | Management |
| 6 | Meetings | `/meetings` | Sales, Management |
| 7 | Projects | `/projects` | All |
| 8 | Factory | `/factory` | All |
| 9 | Reports | `/reports` | Management |
| 10 | AI Assistant | `/ai-assistant` | CRE, Sales |
| 11 | Marketing | `/marketing` | Management |

---

## 🔗 Key Data Flows

```
Meta Ads → Meta Lead Import → CRM Lead → CRE Call → Meeting Booking
→ Sales Meeting → Quotation → Deal Won → Project → Factory Order → Delivery
```
