# PRD Module Index

> **Complete Product Requirements Document for the CRM Application**  
> Generated: March 2026 | Version 1.1 (Expanded)

---

## Quick Reference

| File | Module | Description |
|------|--------|-------------|
| [00_overview.md](./00_overview.md) | Overview | System overview, tech stack, lead flow, key business logic |
| [01_user_roles.md](./01_user_roles.md) | Roles | Admin, CRE, Sales Executive, Operator — permissions & pages |

---

## Module Files

| Module | File | Key Pages Covered |
|--------|------|--------------------|
| **M1 — Lead Management** | [lead_management.md](./modules/M1_lead_management/lead_management.md) | Admin Lead Mgmt, CRE Lead Mgmt, Operator Lead Center, Follow-Up 3-panel workspace |
| **M1 — Project Status System** | [project_status_system.md](./modules/M1_lead_management/project_status_system.md) | Call Action Modal, 10-point construction sub-statuses, React Flow pipeline diagram |
| **M2 — CRE Module** | [cre_module.md](./modules/M2_cre_module/cre_module.md) | CRE Dashboard, Lead Center, Follow-Up Chart, AI Voice, Meeting Slots |
| **M3 — Sales Module** | [sales_module.md](./modules/M3_sales_module/sales_module.md) | Sales Dashboard, All Meetings, Today's Meetings, Follow-Up Dashboard (4 status cards) |
| **M3 — Sales Info & Finance** | [sales_info_finance.md](./modules/M3_sales_module/sales_info_finance.md) | Lead Detail (6 tabs), Finance tracking, Payment history, Add Payment, Create Meeting 4-tab modal, Admin Finance overview |
| **M4 — Meetings Module** | [meetings_module.md](./modules/M4_meetings_module/meetings_module.md) | Meeting Slot Management, Create Meeting, Status Tracking |
| **M5 — Quotation Module** | [quotation_module.md](./modules/M5_quotation_module/quotation_module.md) | Create Quotation, Product-Series cascade, Transportation pricing (৳5,500/৳15,500), Discount toggle, Print (A4) |
| **M6 — Product Module** | [product_module.md](./modules/M6_product_module/product_module.md) | Product Catalog, Series Config, Specs, Catalog-Quotation Link |
| **M7 — User & Auth Module** | [user_auth_module.md](./modules/M7_user_auth_module/user_auth_module.md) | Login, User Management, Profile, Create User, Departments, Roles |
| **M8 — Settings Module** | [settings_module.md](./modules/M8_settings_module/settings_module.md) | Lead Distribution (CRE weight/manual override), WhatsApp, Facebook, AI, Saved Messages, Media Reply Rules |
| **M9 — Utility Module** | [utility_module.md](./modules/M9_utility_module/utility_module.md) | Meta Ads Analytics, Geographic Map, ElitBuzz SMS |
| **M10 — Admin Tools** | [admin_tools.md](./modules/M10_admin_tools/admin_tools.md) | Dashboard, Cabinet Calculation, 2D Layout Designer |

---

## Application Stats Summary

| Stat | Count |
|------|-------|
| **User Roles** | 4 (Admin, CRE, Sales Executive, Operator) |
| **Route Namespaces** | 4 (`/admin`, `/cre`, `/sales`, `/operator`) |
| **Total Modules** | 10 |
| **Total PRD Documents** | 15 |
| **Total Pages/Views** | ~35+ unique page routes |
| **Settings Sections** | 8 |
| **Lead Statuses** | 11+ distinct states |
| **Project Sub-Statuses** | 10 construction phases |
| **Meeting Statuses** | 6 states |
| **Follow-Up Statuses** | 4 (Pending, Complete, Late Complete, Missed) |

---

## Folder Structure (Final)

```
Documents - PRD/
│
├── 00_overview.md              → System overview & architecture
├── 01_user_roles.md            → Role-based access & permissions
├── INDEX.md                    → This file (master index)
│
└── modules/
    ├── M1_lead_management/
    │   ├── lead_management.md          → Admin/CRE/Operator lead mgmt + Follow-Up workspace
    │   └── project_status_system.md   → Call Action Modal + project construction tracking
    ├── M2_cre_module/
    │   └── cre_module.md
    ├── M3_sales_module/
    │   ├── sales_module.md             → Dashboard + meetings + follow-up dashboard
    │   └── sales_info_finance.md       → Lead detail tabs, finance/payment, meeting creation
    ├── M4_meetings_module/
    │   └── meetings_module.md
    ├── M5_quotation_module/
    │   └── quotation_module.md         → Full quotation form with transportation & discount logic
    ├── M6_product_module/
    │   └── product_module.md
    ├── M7_user_auth_module/
    │   └── user_auth_module.md
    ├── M8_settings_module/
    │   └── settings_module.md
    ├── M9_utility_module/
    │   └── utility_module.md
    └── M10_admin_tools/
        └── admin_tools.md
```
