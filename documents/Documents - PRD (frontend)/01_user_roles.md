# User Roles & Permissions

## Role Overview

The CRM application defines four primary user access levels, each with a distinct routing namespace, UI layout, and set of permitted actions.

---

## 1. Admin

**Route:** `/admin/...`  
**Layout:** `AdminLayout`  
**Type Identifier:** `type === "Admin"` in user profile

### Description
The Admin is the super-user of the system. They have visibility into all teams, departments, and can configure every aspect of the CRM including lead distribution algorithms, WhatsApp settings, AI assistants, and product/quotation management.

### Accessible Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/admin/dashboard` | Performance overview of all CREs, date-wise lead data |
| User Management | `/admin/users/all-users` | View/filter all users, toggle active/inactive |
| User Profile | `/admin/users/:userId` | View individual user profile details |
| Create User | `/admin/users/create-user` | Register new system users |
| Departments | `/admin/users/departments` | View and manage departments |
| Roles | `/admin/users/roles` | View all roles |
| Create Role | `/admin/users/create-role` | Define new roles with permissions |
| Lead Management | `/admin/lead-management` | Full lead list with CRE assignment capability |
| Lead Follow-Up | `/admin/lead-followUp` | Follow-up list for admin review |
| Lead Center | `/admin/lead-center` | Chat interface for leads |
| Sales/Meetings | `/admin/sales` | View sales meetings |
| Sales Follow-Up | `/admin/sales-follow-up` | Review sales team follow-ups |
| All Meetings | `/admin/all-meetings` | Full meetings list across all executives |
| Product Management | `/admin/product-management` | Product catalog management |
| Create Product | `/admin/product-management/create-product` | Add/edit products |
| Cabinet Calculation | `/admin/cabinet-calculation` | Cabinet area calculation tool |
| Quotation | `/admin/quotation` | Blank quotation creation |
| 2D Layout Designer | `/admin/2d-layout` | Interior 2D layout planning tool |
| Meeting Slot | `/admin/meeting-slot` | Meeting time slot management |
| Settings > Profile | `/admin/settings/profile` | Profile settings |
| Settings > Lead | `/admin/settings/lead-settings` | Lead distribution control |
| Settings > Facebook | `/admin/settings/facebook` | Facebook/Meta ads integration |
| Settings > Assistants | `/admin/settings/assistants` | AI assistant configuration |
| Settings > AI Integration | `/admin/settings/AI-Integration` | OpenAI/AI API settings |
| Settings > WhatsApp Login | `/admin/settings/whatsapp-login` | WhatsApp Business API login |
| Settings > Media Reply | `/admin/settings/media-type-reply-management` | Media response type rules |
| Settings > Saved Messages | `/admin/settings/saved-messages` | Saved reply templates |
| Utility > Ads | `/admin/utility/ads` | Meta product ads analytics |
| Utility > Map | `/admin/utility/map` | Geographic lead/meeting map |
| Utility > ElitBuzz | `/admin/utility/elitbuzz` | SMS gateway integration |

### Key Permissions
- Can toggle any user's active/inactive status
- Can assign leads to any CRE via bulk or individual actions
- Can configure lead assignment weight/manual override per CRE
- Can create/edit products and quotations
- Full settings access including WhatsApp, Facebook, AI configuration

---

## 2. CRE (Customer Relationship Executive)

**Route:** `/cre/...`  
**Layout:** `CRELayout`  
**Department:** CRE Department  
**Role:** CRE

### Description
CREs are the primary point of contact for incoming leads. They handle lead communication via WhatsApp/chat, collect contact numbers, arrange meetings with sales executives, and manage follow-ups.

### Accessible Pages

| Page | Route | Purpose |
|------|-------|---------|
| CRE Dashboard | `/cre/dashboard` | Personal performance stats, meeting overview |
| Lead Center | `/cre/lead-center` | Chat-based interface for assigned leads |
| Lead Center Chat | `/cre/lead-center/:leadId` | Individual lead conversation |
| Lead Management | `/cre/lead-management` | Manage assigned leads with filters |
| Meeting Slot | `/cre/meeting` | View/book meeting slots for leads |
| AI Voice | `/cre/AiVoice` | AI voice transcription tool |

### Key Permissions
- Can view only their own assigned leads (filtered automatically)
- Can update lead status (New → Number Collected → Ongoing → Meeting Fixed, etc.)
- Can set meetings for leads with sales executives
- Can use AI voice transcription for note-taking
- Cannot assign leads to other CREs

### CRE Dashboard Metrics
- Total Assigned Leads, Number Collected, Meeting Set, Meeting Complete
- Follow-up count, No Response, Meeting Canceled, Sold
- Salary earned (based on meetings set), Incentive amount
- Conversion funnel visualization
- Recent activity log

---

## 3. Sales Executive

**Route:** `/sales/...`  
**Layout:** `SalesLayout`  
**Department:** Sales  
**Role:** Sales Executive

### Description
Sales Executives handle physical client meetings arranged by CREs. They manage their pipeline, track follow-ups, and generate quotations for interested clients.

### Accessible Pages

| Page | Route | Purpose |
|------|-------|---------|
| Sales Dashboard | `/sales/dashboard` | Personal pipeline metrics, monthly goals |
| All Meetings | `/sales/all-meetings` | Complete list of all their meetings |
| Lead Detail | `/sales/:leadId` | Detailed view of a lead/meeting record |
| Follow Up | `/sales/follow-up` | Post-meeting follow-up management |
| Today's Meetings | `/sales/today-meeting` | Meetings scheduled for today |
| Quotation | `/sales/quotation` | Create quotations for clients |

### Key Permissions
- Can view only their own assigned meetings/leads
- Can update meeting status (Complete, Reschedule, Cancel, etc.)
- Can create and print client quotations
- Can log follow-up activities
- Cannot access lead communication (WhatsApp/chat)

### Sales Dashboard Metrics
- Total Project Value, Follow-up count, Prospects, Sold count
- Total Paid, Total Due
- Monthly Goals: Sales Target, Collection Target (progress bars)
- Conversion Funnel: Meetings → Prospects → Sold → Measured → Handover
- Weekly Meetings Overview (bar chart)
- Performance Score & Incentive Amount
- Sales Pipeline & Insights tabs
- Recent Activity log (lead creation, status changes, meetings set)

---

## 4. Operator

**Route:** `/operator/...`  
**Layout:** `OperatorLayout`  
**Description:** Monitors incoming leads and provides support-level access.

### Accessible Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/operator/dashboard` | Overview dashboard |
| Lead Center | `/operator/lead-center` | Full lead center task queue |

### Key Permissions
- Can view incoming leads in the task queue
- Can accept or reject available leads
- Can complete tasks with comment updates
- Cannot modify user accounts or settings

### Operator Lead Center Features
- **Task Queue Sections:**
  - Hot Leads (recently replied within 10 min)
  - New Leads (fresh inquiries)
  - Follow-ups (scheduled follow-up tasks)
  - Previous Replies (leads who responded earlier)
  - Expiring Soon (SLA countdown timer)
- Accept/Reject incoming leads
- Chat interface for selected lead
- Complete task with mandatory completion comment
- Lead status management (New, In Progress, Follow Up, Closed, Converted)
- Real-time countdown timer per task

---

## 5. Authentication Flow

- All routes require authenticated user token
- Unauthenticated users are redirected to `/authentication/login`
- `LoggedInRoute` wrapper guards all protected routes
- `LoggedOutRoute` wrapper only allows access when not authenticated
- **Role-based routing** is enforced at the top level (separate route trees per role)
- User type `"Admin"` unlocks the admin-specific dashboard views (e.g., AllCREPerformanceCard instead of personal PerformanceCard)

---

## 6. Shared Features (All Roles)

- Profile settings page access
- Notification system (browser push notifications via device token)
- Recent activity log viewing (own activities)
- Dark/light mode support (via CSS variable theming)
