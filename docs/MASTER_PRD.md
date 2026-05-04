# EaseIT CRM 2.0 — Master Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-04  
**Stack:** Next.js 16.2.1 + Supabase (PostgreSQL) + TypeScript  
**Authored by:** Migration synthesis from three original MERN repos + live schema audit

---

## Document Purpose

This is the single authoritative PRD for EaseIT CRM 2.0. It reconciles the original three-repo MERN documentation (`documents/Documents - PRD (backend)/`, `documents/Documents - PRD (frontend)/`, `documents/Documents - PRD (frontend 2.0)/`) with the **actual live database schema** (`supabase/sql/currentstage.sql`) and the **actual built application** (`app/`, `components/`).

Where documentation conflicts with schema, or where schema was never built, both are recorded. **Never silently resolve a conflict — flag it.**

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ Built | Feature exists in both schema and application code |
| 🔧 In Progress | Schema exists but UI/actions incomplete, or partial |
| 📋 Schema Only | DB tables exist, no application code yet |
| ❌ Not Started | Documented in PRDs but neither schema nor code exists |
| ⚠️ Conflict | Documentation disagrees with schema or code |

---

## Table of Contents

1. [Business Context](#1-business-context)
2. [User Roles & Permission Matrix](#2-user-roles--permission-matrix)
3. [Live Database Schema](#3-live-database-schema)
4. [Module Specifications](#4-module-specifications)
   - 4.1 [User Module (HRM)](#41-user-module-hrm)
   - 4.2 [Lead Module](#42-lead-module)
   - 4.3 [Meeting Module](#43-meeting-module)
   - 4.4 [Follow-up & Reminders Module](#44-follow-up--reminders-module)
   - 4.5 [Dashboard & Analytics Module](#45-dashboard--analytics-module)
   - 4.6 [Settings Module](#46-settings-module)
   - 4.7 [Utility / Map Module](#47-utility--map-module)
   - 4.8 [Internal Chat Module](#48-internal-chat-module)
   - 4.9 [Transform Studio Module](#49-transform-studio-module)
   - 4.10 [Quotations Module](#410-quotations-module)
   - 4.11 [Product Catalog Module](#411-product-catalog-module)
   - 4.12 [Inventory Module](#412-inventory-module)
   - 4.13 [Marketing Module](#413-marketing-module)
   - 4.14 [Project Management Module](#414-project-management-module)
   - 4.15 [Notifications Module](#415-notifications-module)
   - 4.16 [Messaging Integration Module](#416-messaging-integration-module)
   - 4.17 [Automation Engine](#417-automation-engine)
5. [App Router Structure](#5-app-router-structure)
6. [Conflicts, Gaps & Ambiguities](#6-conflicts-gaps--ambiguities)
7. [Next Development Priorities](#7-next-development-priorities)

---

## 1. Business Context

EaseIT CRM is a full-featured Customer Relationship Management system built for an **interior design and furniture manufacturing business operating in Bangladesh**. It manages the complete sales pipeline from inbound lead acquisition through project handover.

### Core Business Flow

```
Lead Capture (Facebook/WhatsApp/Phone/Web)
    → CRE Assignment (auto or manual)
    → CRE Nurtures Lead (messages, reminders, follow-ups)
    → Meeting Fixed (with Sales Executive)
    → Sales Executive Attends Meeting
    → Outcome: Sold | Prospect | Lost | Quotation Sent
    → Finance: Payments recorded against sold amount
    → Production: Project stages tracked post-sale
    → Handover: Project handed over to client
```

### Business Rules (from all source PRDs)
- Leads originate from Facebook Messenger, WhatsApp, phone, website, referrals, and Instagram
- Each lead is assigned one **CRE** (Customer Relationship Executive) who manages communication
- Each lead is assigned one **Sales Executive** who attends physical meetings
- Meetings have a **visit charge** (BDT fee based on lead location/area)
- Lead IDs (CIDs) are auto-generated: `{SOURCE}-{DDMONYY}-{SEQ}` (e.g., `FB-04MAY26-003`)
- Finance tracks: client's budget, project value, sold amount, and individual payment records
- Follow-ups and reminders are time-bound tasks tied to lead lifecycle

---

## 2. User Roles & Permission Matrix

### Role Architecture

The system uses two layers of role control:
1. **`users.type`** — binary: `'Admin'` or `'Operator'`. Admin has global access.
2. **`roles.permissions` (JSONB)** — granular feature flags per role, checked in app code and some RLS policies.

### User Types in Schema

```sql
-- From migration 20260328000000_core_auth.sql
CREATE TYPE public.user_type AS ENUM ('Admin', 'Operator');
```

> ⚠️ **Conflict**: The phase1 RLS migration (`supabase/sql/phase1_migration.sql`) references a user type `'CRE'` and `'Sales'` in policy `WITH CHECK` clauses (e.g., `get_current_user_type() IN ('Admin', 'CRE', 'Sales')`). These values **do not exist** in the `user_type` enum — the enum only has `'Admin'` and `'Operator'`. The backend PRD described four roles: Admin, Sales Executive (SE), CRE, and Operator. **Resolution needed**: Either extend the enum to `'Admin' | 'CRE' | 'Sales' | 'Operator'`, or encode role membership purely via the `roles` table and check `roles.permissions` JSONB in RLS. Current behavior: all non-Admin users fall through as `'Operator'` and are treated identically by RLS.

### Intended Permission Matrix (from PRD documentation)

| Feature Area | Admin | CRE | Sales Executive | Operator |
|---|---|---|---|---|
| View all leads | ✅ | Own assigned only | Own assigned only | ❌ |
| Create lead | ✅ | ✅ | ❌ | ❌ |
| Assign CRE to lead | ✅ | ❌ | ❌ | ❌ |
| Assign Sales to lead | ✅ | ❌ | ❌ | ❌ |
| Update lead status | ✅ | ✅ (limited) | ✅ (limited) | ❌ |
| Delete lead | ✅ | ❌ | ❌ | ❌ |
| View all meetings | ✅ | Own leads only | Own meetings only | ❌ |
| Create meeting | ✅ | ✅ | ✅ | ❌ |
| Update meeting flow | ✅ | ❌ | ✅ | ❌ |
| Record payments | ✅ | ❌ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage departments/roles | ✅ | ❌ | ❌ | ❌ |
| View dashboard analytics | ✅ | Own stats | Own stats | ❌ |
| Manage site settings | ✅ | ❌ | ❌ | ❌ |
| Manage AI providers | ✅ | ❌ | ❌ | ❌ |
| Transform Studio (operate) | ✅ | ❌ | ❌ | ✅ (if permitted) |
| Transform Studio (review) | ✅ | ❌ | ❌ | ✅ (if permitted) |

### Seeded Departments & Roles

```
Administration → Super Admin (full permissions)
Sales          → Sales Executive
CRE            → (role needs to be seeded manually)
Operations     → (role needs to be seeded manually)
```

### Employee Status Enums

```sql
-- employment_status_enum
trainee | probationary | permanent | contract | part_time |
internship | resigned | terminated | retired | suspended |
on_notice_period | absconded | deceased | transferred | deputed

-- account_status_enum
active | inactive | pending | locked | archived
```

### Sentinel User

A special `[Deleted User]` record exists with ID `45ae1570-0751-441d-b93c-1690ae2eda74` to preserve referential integrity when user accounts are deleted. All FKs pointing to deleted users resolve to this sentinel rather than NULL.

---

## 3. Live Database Schema

**Source of truth:** `supabase/sql/currentstage.sql` (schema dump) + migration files.

### Complete Table Inventory

| Table | Purpose | Status |
|---|---|---|
| `users` | Employee profiles, linked to `auth.users` | ✅ Built |
| `departments` | Org unit definitions | ✅ Built |
| `roles` | Permission templates per department | ✅ Built |
| `user_documents` | HR documents (resume, NID, etc.) | 📋 Schema Only |
| `user_social_links` | Employee social profiles | 📋 Schema Only |
| `user_activity_logs` | User action audit log | 📋 Schema Only |
| `leads` | Core lead records | ✅ Built |
| `lead_comments` | Comments/notes on leads | ✅ Built |
| `lead_follow_ups` | Follow-up tasks | ✅ Built |
| `lead_meetings` | Meeting records tied to leads | ✅ Built |
| `lead_payments` | Payment records for sold leads | ✅ Built |
| `lead_call_logs` | Call history per lead | ✅ Built |
| `lead_activity_logs` | Audit trail for lead actions | ✅ Built |
| `meeting_slots` | Master time slot definitions (10AM–7PM) | ✅ Built |
| `site_settings` | Singleton branding/config row | ✅ Built |
| `divisions` | Geographic: top-level divisions | ✅ Built |
| `districts` | Geographic: districts within divisions | ✅ Built |
| `areas` | Geographic: areas with visit_charge | ✅ Built |
| `chats` | Internal chat rooms | 🔧 In Progress |
| `chat_participants` | Chat room membership | 🔧 In Progress |
| `messages` | Chat messages | 🔧 In Progress |
| `transform_ai_providers` | AI provider credentials for Transform Studio | ✅ Built |
| `transform_ai_models` | AI model definitions per provider | ✅ Built |
| `transform_presets` | Cabinet transformation presets | ✅ Built |
| `transform_jobs` | Transform job queue | ✅ Built |
| `transform_generation_steps` | Per-zone AI generation tracking | ✅ Built |

### Tables From Original PRD — NOT IN SCHEMA

| Intended Table | Source | Status |
|---|---|---|
| `quotations` | Backend PRD module 03 | ❌ Not Started |
| `quotation_items` | Backend PRD module 03 | ❌ Not Started |
| `products` | Backend PRD module 04 | ❌ Not Started |
| `product_series` | Backend PRD module 04 | ❌ Not Started |
| `vendors` | Backend PRD module 05 | ❌ Not Started |
| `purchase_orders` | Backend PRD module 05 | ❌ Not Started |
| `facebook_pages` | Backend PRD module 06/08 | ❌ Not Started |
| `whatsapp_accounts` | Backend PRD module 06/08 | ❌ Not Started |
| `conversation_messages` | Backend PRD module 06 | ❌ Not Started |
| `saved_messages` | Backend PRD module 08 | ❌ Not Started |
| `ai_assistants` | Backend PRD module 08 | ❌ Not Started |
| `media_reply_automations` | Backend PRD module 08 | ❌ Not Started |
| `project_stages` | Backend PRD module 12 | ❌ Not Started |
| `notifications` | Backend PRD module 14 | ❌ Not Started |
| `product_ads` | Backend PRD module 10 | ❌ Not Started |
| `discount_coupons` | Backend PRD module 10 | ❌ Not Started |

### Key Schema Notes

**`leads` table — critical fields:**
```sql
id             uuid PK
cid            text UNIQUE           -- Auto-generated: FB-04MAY26-001
name           text NOT NULL
status         text DEFAULT 'New'    -- Unconstrained text (see Conflicts §6.1)
source         text NOT NULL         -- Facebook|WhatsApp|Website|Referral|Instagram|Phone
phones         text[]
address        jsonb                 -- {area, district, division, fullAddress}
project_status jsonb                 -- {status, subStatus}
finance        jsonb                 -- {projectValue, soldAmount, clientsBudget, soldDate}
page_info      jsonb                 -- Facebook page metadata
whatsapp_info  jsonb                 -- WhatsApp session metadata
requirements   jsonb DEFAULT '[]'   -- Array of client requirement tags
bot_responded  boolean
ai_bot_reply   boolean
sales_executive_id uuid FK → users
cre_id         uuid FK → users
```

**`lead_finance_computed` VIEW** (defined in `supabase/sql/phase1_migration.sql`):
```sql
-- Computes live totals from lead_payments rows, avoiding stale JSONB
lead_id, project_value, sold_amount, sold_date, clients_budget,
total_payment, total_due
```

**Atomic RPCs** (in `phase1_migration.sql`):
- `complete_meeting(...)` — marks meeting complete, updates lead status + finance, logs comment, schedules follow-up
- `mark_as_sold(...)` — marks meeting Sold, updates finance, inserts initial payment, logs comment, schedules follow-up
- `expire_missed_follow_ups()` — expires all Pending follow-ups past their due time

---

## 4. Module Specifications

---

### 4.1 User Module (HRM)

**Status: ✅ Built (core); 📋 Schema Only (documents, social links, activity logs)**

#### Purpose
Manage employees, departments, roles, and authentication. All users exist within a department/role hierarchy that governs CRM permissions.

#### Database Tables
- `users` — core employee profile
- `departments` — org units (Administration, Sales, CRE, Operations seeded)
- `roles` — permission templates with JSONB `permissions` field
- `user_documents` — uploaded HR documents
- `user_social_links` — social profile URLs
- `user_activity_logs` — action history

#### App Routes (Next.js App Router)

| Route | File | Status |
|---|---|---|
| `GET /users` | `app/(protected)/users/page.tsx` | ✅ |
| `GET /users/new` | `app/(protected)/users/new/page.tsx` | ✅ |
| `GET /users/[userId]` | `app/(protected)/users/[userId]/page.tsx` | ✅ |
| `GET /users/[userId]/edit` | `app/(protected)/users/[userId]/edit/page.tsx` | ✅ |
| `GET /users/departments` | `app/(protected)/users/departments/page.tsx` | ✅ |
| `GET /users/roles` | `app/(protected)/users/roles/page.tsx` | ✅ |
| `GET /users/roles/new` | `app/(protected)/users/roles/new/page.tsx` | ✅ |
| `GET /users/roles/[id]/edit` | `app/(protected)/users/roles/[id]/edit/page.tsx` | ✅ |
| `POST /api/employees/delete` | `app/api/employees/delete/route.ts` | ✅ |

#### Server Actions
- `app/actions/users.ts` — CRUD for users
- `app/actions/departments.ts` — CRUD for departments
- `app/actions/roles.ts` — CRUD for roles, permission management

#### Components Built
- `EmployeeTable` — paginated user list
- `AddEmployeeForm` / `EditEmployeeForm` — create/update
- `DeleteEmployeeModal` — soft delete (moves to sentinel reference)
- `DepartmentCard` / `DepartmentsClient` — department list
- `RoleCard` / `RolesClient` — role list
- `CreateRoleForm` / `EditRoleForm` — role management
- `PermissionTogglePanel` — JSONB permission editor
- `UserProfileClient` — user profile view
- `BatchUserImportDialog` — CSV bulk import

#### Data Model

```typescript
// users table
{
  id: uuid                    // FK → auth.users
  type: 'Admin' | 'Operator'
  employment_status: employment_status_enum
  account_status: account_status_enum
  name: string
  nickname?: string
  email: string               // unique
  personal_phone?: string
  office_phone?: string
  gender?: 'Male' | 'Female' | 'Other'
  address?: string
  date_of_birth?: date
  department_id?: uuid        // FK → departments
  role_id?: uuid              // FK → roles
  joining_date?: date
  current_salary?: decimal
  working_procedure?: string
  profile_picture?: string    // storage path in user-media bucket
  cover_photo?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_relation?: string
  theme_preference: 'light' | 'dark' | 'system'
}
```

#### Not Yet Built (from original PRD)
- Document upload/management UI (schema exists)
- Social links management UI (schema exists)
- Activity log viewer (schema exists)
- Teams & scheduling (team assignment, daily meeting views, slot swapping)

---

### 4.2 Lead Module

**Status: ✅ Built (core management, detail, pipeline); 🔧 In Progress (advanced features)**

#### Purpose
Full lifecycle management of sales leads: capture, assignment, status tracking, comments, call logs, payments, and pipeline view.

#### Database Tables
- `leads` — core lead record
- `lead_comments` — notes/comments with optional image attachments
- `lead_follow_ups` — follow-up task records
- `lead_meetings` — meeting records per lead
- `lead_payments` — payment records
- `lead_call_logs` — call history
- `lead_activity_logs` — immutable audit trail
- `lead_finance_computed` — view for live payment totals

#### Lead Status Values (from PRD — not enforced by enum)
```
New → No Response → Number Provided → Message Rescheduled → Number Collected →
Call Reschedule → Ongoing → Meeting Fixed → Meeting Complete → Sold →
Prospect → Measured → Material Received → Project in Production →
Project Complete → Handed Over
```
> ⚠️ **Note**: `status` is `TEXT` in the live schema, not an ENUM. The first migration (`000001`) defined a `lead_status` ENUM, but migration `000002` recreated the leads table with `TEXT`. Status values are only validated in application code.

#### Lead Sources
```
Facebook | WhatsApp | Website | Referral | Instagram | Phone
```
CID prefixes: `FB` | `WA` | `WB` | `RF` | `IG` | `PH` | `UN`

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /leads` | `app/(protected)/leads/page.tsx` | ✅ |
| `GET /leads/[id]` | `app/(protected)/leads/[id]/page.tsx` | ✅ |

#### Server Actions
- `app/actions/leads/index.ts` — main exports
- `app/actions/leads/queries.ts` — fetch leads with filters
- `app/actions/leads/mutations.ts` — create, update, delete
- `app/actions/leads/pipeline.ts` — pipeline board queries
- `app/actions/leads/meetings.ts` — meeting-related mutations
- `app/actions/follow-ups.ts` — follow-up CRUD

#### Components Built
- `LeadsPageContent` / `LeadTable` / `LeadCard` — list views
- `LeadFilters` / `LeadPagination` — filtering and pagination
- `CreateLeadDialog` — new lead creation
- `BatchLeadImportDialog` — CSV bulk import
- `LeadDetailsTabs` — tab navigation on detail page
- `LeadSidebar` / `GeneralInfo` — detail panel
- `LeadStatusControl` / `StatusActionDialog` / `StatusFormSections` — status change workflows
- `MeetingFixedWizard` — guided meeting booking
- `LeadCommentsSidebar` / `LeadCallLogSidebar` — activity tabs
- `LeadFollowUpSidebar` / `LeadMeetingsSidebar` — relationship tabs
- `LeadFinanceSidebar` — payment/finance view
- `LeadPhoneNumbers` / `LeadAddressEditor` / `LeadRequirements` — detail editors
- `LeadStatusChart` — visual status distribution
- `LeadMetaAds` — ad linkage display (❌ no backend yet)
- `UserSelect` — assignee dropdown
- Pipeline components: `PipelineGridBoard`, `PipelineStageBoard`, `ClientPipelineContent`, `ProjectPipelineContent`, `ClientPipelineCard`, `ProjectPipelineCard`, `PipelineFilters`

#### Lead Activity Logging
`lib/lead-activity-logger.ts` — server-side logger. All significant actions (create, assign, status change, comment, meeting, payment) write to `lead_activity_logs`. Reads use admin client (service role); writes bypass RLS.

Action types currently logged (from code patterns):
```
lead_created | lead_assigned_cre | lead_assigned_sales | status_changed |
comment_added | meeting_fixed | meeting_completed | meeting_sold |
payment_recorded | follow_up_created | follow_up_completed
```

#### Not Yet Built (from original PRD)
- AI Bot toggle per lead (assistantId, threadId)
- Google Sheets export
- Duplicate lead detection
- Auto-assignment logic
- Name-based CRE assignment

---

### 4.3 Meeting Module

**Status: ✅ Built (slot management, meeting grid/list); 🔧 In Progress (full admin calendar, flow tracking)**

#### Purpose
Schedule and track physical site visits between Sales Executives and lead clients. Supports time slots, visit charges, real-time flow status updates, and outcome recording.

#### Database Tables
- `lead_meetings` — meeting records
- `meeting_slots` — master slot definitions (seeded: 10:00 AM – 7:00 PM, 10 slots)

#### Meeting Status Values
```
Fixed | Postponed | Rescheduled | Canceled | Complete | Sold |
Follow-Up | Final Measurement | Handover & Review
```

#### Meeting Flow Status Values
```
Confirmed | Leaved | Arrived | Ongoing | Completed | Canceled
```

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /meetings/slots` | `app/(protected)/meetings/slots/page.tsx` | ✅ |

#### Components Built
- `MeetingGrid` — calendar-style grid view of meetings
- `MeetingListView` — tabular meeting list
- `MeetingSlotGrid` — slot management UI
- `MeetingStatusMenu` — status update dropdown
- `CreateMeetingDialog` — schedule new meeting
- `DateSelector` — date picking component
- `GridComponents` / `GridHeaders` — grid layout helpers
- `MeetingSkeletons` — loading states
- `MeetingList` — compact list in lead sidebar

#### Atomic RPCs
- `complete_meeting(...)` — marks meeting complete, records project value and client budget, logs comment, creates follow-up
- `mark_as_sold(...)` — marks meeting as Sold, records financial data, inserts payment, logs comment, creates follow-up

#### Not Yet Built (from original PRD)
- Admin meeting calendar view (full calendar with all SEs)
- Meeting analytics dashboard
- Meeting flow real-time GPS tracking
- Double-booking prevention logic (partially in UI, not enforced DB-side)

---

### 4.4 Follow-up & Reminders Module

**Status: ✅ Built**

#### Purpose
Time-bound follow-up tasks and reminder management. Linked to leads. Supports Pending → Complete / Missed / Late Complete lifecycle.

#### Database Tables
- `lead_follow_ups` — follow-up records with `assigned_to` FK

#### Follow-up Status Values
```
Pending | Complete | Missed | Late Complete
```

#### Follow-up Types
```
Call | Meeting | Reminder
```

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /reminders` | `app/(protected)/reminders/page.tsx` | ✅ |

#### Server Actions
- `app/actions/follow-ups.ts`

#### Components Built
- `RemindersPageContent` — main reminders view
- `ReminderCard` — single follow-up card
- `FollowUpModal` — create/edit modal
- `ReminderSkeletons` — loading states

#### Automation
- `expire_missed_follow_ups()` RPC — intended to run via pg_cron every 15 minutes (not yet scheduled in Supabase)

---

### 4.5 Dashboard & Analytics Module

**Status: 🔧 In Progress**

#### Purpose
Summary analytics and activity feed for different user roles.

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /dashboard` | `app/(protected)/dashboard/page.tsx` | 🔧 |

#### Server Actions
- `app/actions/dashboard.ts`

#### Components Built
- `DashboardStats` — KPI cards (lead counts by status)
- `ActivityFeed` — recent `lead_activity_logs` entries

#### Not Yet Built (from original PRD)
- CRE Performance widget
- Individual Performance widget
- CRE Incentive widget
- Meeting Analytics widget
- Meeting Bar Chart / Monthly Meeting Data
- Date-Wise Lead Data
- Follow-Up Stats
- Personalized CRE dashboard view
- Filter controls (date range, per-CRE, per-SE, by source)

---

### 4.6 Settings Module

**Status: 🔧 In Progress**

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /settings` | `app/(protected)/settings/page.tsx` | ✅ |
| `GET /settings/company` | `app/(protected)/settings/company/page.tsx` | ✅ |
| `GET /settings/profile` | `app/(protected)/settings/profile/page.tsx` | ✅ |
| `GET /settings/security` | `app/(protected)/settings/security/page.tsx` | ✅ |
| `GET /settings/ai-providers` | `app/(protected)/settings/ai-providers/page.tsx` | ✅ |

#### Components Built
- `ImageUpload` — profile picture / company logo uploader

#### Database
- `site_settings` (singleton: company name, logo, brand colors)

#### What's Built
- Company name, logo, primary/secondary color editing
- User profile editing (name, phone, profile picture)
- Password change
- Transform Studio AI provider management (see §4.9)

#### Not Yet Built (from original PRD)
- Facebook page connection / webhook management
- WhatsApp account management (QR code pairing)
- AI Assistant configuration (OpenAI Assistants API)
- Saved Messages (quick reply templates) management
- Media Reply Automation setup
- ElitBuzz SMS configuration
- Lead auto-assignment rules
- Lead distribution controls

---

### 4.7 Utility / Map Module

**Status: ✅ Built**

#### Purpose
Manage the geographic hierarchy (Division → District → Area) used to determine meeting visit charges and regional analytics.

#### Database Tables
- `divisions`
- `districts`
- `areas` (includes `visit_charge` per area)

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /utility/map` | `app/(protected)/utility/map/page.tsx` | ✅ |

#### Server Actions
- `app/actions/utility/map.ts`

#### Components Built
- `MapClient` — geographic hierarchy management UI

---

### 4.8 Internal Chat Module

**Status: 🔧 In Progress**

#### Purpose
Direct messaging between internal CRM users. Not for customer-facing messaging (that is the Messaging Integration Module §4.16).

#### Database Tables
- `chats` — chat rooms (type: 'direct')
- `chat_participants` — membership per room
- `messages` — individual messages

> ⚠️ **Gap**: The `chats`, `chat_participants`, and `messages` tables appear in `currentstage.sql` but are **not present in any migration file**. They were created directly in the Supabase dashboard. A migration file should be created to track this.

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /chat` | `app/(protected)/chat/page.tsx` | 🔧 |
| `GET /chat/[chatId]` | `app/(protected)/chat/[chatId]/page.tsx` | 🔧 |

#### Server Actions
- `app/actions/chat.ts`

#### Components Built
- `ChatShell` — layout wrapper
- `ChatSidebarList` — conversation list
- `ChatWindow` — message thread view
- `NewChatDialog` — start a new conversation

#### Realtime
Messages table has `REPLICA IDENTITY FULL` and is added to `supabase_realtime` publication (per `phase1_migration.sql`).

---

### 4.9 Transform Studio Module

**Status: ✅ Built**

#### Purpose
An AI-powered kitchen cabinet visualisation tool. Design operators upload a room photo, paint cabinet zones, select a preset, and generate before/after images using AI providers (OpenAI, etc.). Jobs go through a review/approval workflow.

> **Note**: This module was **not part of the original MERN stack**. It was added fresh during the Next.js migration. Source PRD: `documents/SP_TRANSFORM_STUDIO_PRD.md`. It is a standalone sub-product used by the interior design operations team.

#### Database Tables
- `transform_ai_providers` — API credentials per provider (key encrypted at rest)
- `transform_ai_models` — model catalog with cost per image and inpainting flag
- `transform_presets` — cabinet configuration presets (system + user-created)
- `transform_jobs` — main job queue with status lifecycle
- `transform_generation_steps` — per-zone step tracking

#### Job Status Lifecycle
```
draft → queued → processing → review → approved
                           ↓
                         failed
```

#### Seeded AI Models (OpenAI provider)
```
gpt-image-1.5     $0.04/image  supports_inpainting: true
gpt-image-1       $0.04/image  supports_inpainting: true
gpt-image-1-mini  $0.02/image  supports_inpainting: true
dall-e-2          $0.018/image supports_inpainting: true
dall-e-3          —            supports_inpainting: false
```

#### Seeded System Presets
- Preset A — Matte White
- Preset B — Two-Tone Oak
- Preset C — Gloss Graphite

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /transform` | `app/(protected)/transform/page.tsx` | ✅ |
| `GET /transform/new` | `app/(protected)/transform/new/page.tsx` | ✅ |
| `GET /transform/[id]` | `app/(protected)/transform/[id]/page.tsx` | ✅ |
| `GET /settings/ai-providers` | `app/(protected)/settings/ai-providers/page.tsx` | ✅ |

#### Server Actions
- `app/actions/transform.ts`

#### Edge Functions
- `supabase/functions/transform-process-zone/index.ts` — processes a single zone
- `supabase/functions/transform-composite/index.ts` — composites all zone outputs

#### Components Built
- `ZonePainter` / `ZonePainterWrapper` — canvas-based zone selection (Fabric.js)
- `ConfigPanel` — preset and model selection
- `JobCard` — job list item
- `JobProgressTracker` — real-time generation progress (Supabase Realtime)
- `BeforeAfterSlider` — output comparison
- `RejectDialog` — reviewer rejection flow

#### Realtime
`transform_jobs` and `transform_generation_steps` are subscribed to `supabase_realtime` for live job status updates.

#### pg_cron Watchdog
`20260423000100_transform_studio_cron.sql` defines a 1-minute cron that retries jobs stuck in `'processing'` for >5 minutes. Requires `pg_cron` and `pg_net` extensions.

#### Storage Buckets
- `transform-sources` — uploaded source images (private, 20MB limit, jpeg/png/webp)
- `transform-outputs` — AI-generated output images (private, 20MB, png)

---

### 4.10 Quotations Module

**Status: ❌ Not Started**

#### Purpose (from original PRD)
Generate and manage project quotations for leads. Includes a product-based line item builder, discount/transport cost calculation, and final price computation.

#### Required Schema (not yet created)
```sql
-- quotations
id, lead_id, created_by, items JSONB, discount_coupon_id,
transportation_cost, final_price, valid_until, notes,
status (Draft|Sent|Accepted|Rejected), created_at, updated_at

-- quotation_items  
id, quotation_id, product_id, series_id, sections JSONB,
quantity, unit_price, total_price
```

#### Required App Routes
```
GET  /quotations               → list all quotations (admin) or own (SE)
GET  /quotations/new           → create quotation wizard
GET  /quotations/[id]          → quotation detail / print view
PUT  /quotations/[id]          → update quotation
POST /quotations/[id]/send     → send to client
```

---

### 4.11 Product Catalog Module

**Status: ❌ Not Started**

#### Purpose (from original PRD)
Manage a hierarchical product catalog used in quotation generation. Products have series and configuration options for materials, colors, and pricing.

#### Product Hierarchy
```
Product → Specifications → Series → Configs
```

#### Product Classes: Economy | Standard | Premium | Platinum
#### Product Applications: Kitchen Cabinet | Front Shutter | Storage Cabinet | etc.

#### Required Schema (not yet created)
```sql
products (id, name, class, application, specifications JSONB, created_at)
product_series (id, product_id, name, configs JSONB, pricing JSONB)
materials (id, type, category, color_options JSONB)
```

---

### 4.12 Inventory Module

**Status: ❌ Not Started**

#### Purpose (from original PRD)
Vendor management and purchase order tracking for raw materials used in manufacturing.

#### Required Schema (not yet created)
```sql
vendors (id, name, address, contacts JSONB, materials JSONB, rating, active, ...)
purchase_orders (id, vendor_id, items JSONB, total_amount, status, payment_status, ...)
```

---

### 4.13 Marketing Module

**Status: ❌ Not Started**

#### Purpose (from original PRD)
Track product advertising campaigns and manage promotional discount coupons used in quotations.

#### Required Schema (not yet created)
```sql
product_ads (id, product_id, title, images JSONB, stats JSONB, ...)
discount_coupons (id, code, type, amount, valid_from, valid_until, status, ...)
```

---

### 4.14 Project Management Module

**Status: ❌ Not Started (page stub exists)**

#### Purpose (from original PRD)
Track post-sale execution across 10 defined project stages from roof casting through final handover.

#### Stage Flow (from PRD)
```
1. Roof Casting
2. Brick Wall
3. Plaster
4. Pudding
5. Two Coat Paint
6. Tiles Complete
7. Final Paint Done
8. Interior Work Complete
9. Staying in Apartment
10. Handed Over
```

#### App Routes

| Route | File | Status |
|---|---|---|
| `GET /projects` | `app/(protected)/projects/page.tsx` | ❌ (stub only) |

#### Required Schema (not yet created)
```sql
project_stages (id, lead_id, current_stage_index, stages JSONB, created_at, updated_at)
```

> **Note**: The `leads.project_status` JSONB field (`{status, subStatus}`) provides a basic snapshot, but the full project stage tracker is a separate entity.

---

### 4.15 Notifications Module

**Status: ❌ Not Started**

#### Purpose (from original PRD)
Cross-platform push notifications via Firebase FCM (mobile) and Supabase Realtime (in-browser). 8 notification event types.

#### Notification Types
```
New Lead Assigned | Phone Number Collected | Reminder Due | Reminder Missed |
Sales Follow-Up Due | Sales Follow-Up Missed | New Meeting Assigned | New Inbound Message
```

#### Required Schema (not yet created)
```sql
notifications (id, user_id, title, body, type, reference_id, read, created_at)
device_tokens (id, user_id, token, platform, is_primary, created_at)
```

---

### 4.16 Messaging Integration Module

**Status: ❌ Not Started**

#### Purpose (from original PRD)
Unified inbox for customer-facing conversations via Facebook Messenger and WhatsApp (Baileys). Separate from the internal chat module.

#### Features Required
- Facebook webhook receiver (Messenger messages → leads)
- WhatsApp (Baileys) session management per account
- Unified conversation inbox (CRE view)
- AI bot toggle per lead (OpenAI Assistants)
- Saved messages (quick reply templates)
- Media reply automation (trigger-based)
- Real-time conversation updates (Socket.IO or Supabase Realtime)

#### Required Schema (not yet created)
```sql
facebook_pages (id, page_id, access_token, webhook_verified, ...)
whatsapp_accounts (id, phone, session_data, status, ...)
conversation_messages (id, lead_id, channel, direction, content, ...)
saved_messages (id, title, content, category, created_by, ...)
ai_assistants (id, openai_id, name, model, instructions, active, ...)
media_reply_automations (id, trigger_keyword, media_url, active, ...)
```

> ⚠️ **Architecture Note**: The original MERN backend used Baileys (Node.js WhatsApp library) which requires a persistent WebSocket process. This is **incompatible with serverless Next.js deployments**. WhatsApp integration will require a separate long-running service or a hosted WhatsApp Business API solution. This is a significant architectural decision that remains unresolved.

---

### 4.17 Automation Engine

**Status: ❌ Not Started**

#### Purpose (from original PRD)
Scheduled cron jobs for CRM automation workflows.

#### Required Automations
| Job | Frequency | Status |
|---|---|---|
| Expire missed follow-ups | Every 15 min | 📋 RPC exists, not scheduled |
| Facebook conversation sync | Every 2 min | ❌ |
| WhatsApp message sync | Every 2 min | ❌ |
| Upcoming reminders notification | Every 2 min | ❌ |
| Auto-message sender | Every 2 min | ❌ |
| Duplicate lead detection | Every 5 min | ❌ |
| Name-based CRE assignment | Every 5 min | ❌ |
| Phone number detection (Bengali support) | Every 5 min | ❌ |
| Re-assignment on no reply | Every 5 min | ❌ |
| Assign unassigned leads | Every 10 min | ❌ |
| Missed reminder check | Every 10 min | ❌ |
| Duplicate message cleanup | Every 10 min | ❌ |

> **Note**: The Transform Studio cron (`transform-retry-stuck-jobs`, 1-minute) is already defined and deployed.

---

## 5. App Router Structure

### Current Route Map

```
app/
├── (auth)/
│   └── login/                        ✅ Login page + server action
├── (protected)/
│   ├── layout.tsx                    ✅ Auth guard + shell layout
│   ├── dashboard/                    🔧 KPI cards + activity feed
│   ├── leads/
│   │   ├── page.tsx                  ✅ List + pipeline views
│   │   └── [id]/page.tsx             ✅ Lead detail with tabs
│   ├── meetings/
│   │   └── slots/page.tsx            ✅ Slot management
│   ├── reminders/                    ✅ Follow-ups & reminders
│   ├── projects/                     ❌ Stub only
│   ├── clients/                      ❌ Stub only
│   ├── chat/
│   │   ├── page.tsx                  🔧 Chat list
│   │   └── [chatId]/page.tsx         🔧 Chat thread
│   ├── users/
│   │   ├── page.tsx                  ✅ Employee list
│   │   ├── new/page.tsx              ✅ New employee
│   │   ├── [userId]/
│   │   │   ├── page.tsx              ✅ Profile view
│   │   │   └── edit/page.tsx         ✅ Edit form
│   │   ├── departments/              ✅ Department management
│   │   └── roles/                    ✅ Role + permission management
│   ├── settings/
│   │   ├── page.tsx                  ✅ Settings menu
│   │   ├── company/                  ✅ Branding (name, logo, colors)
│   │   ├── profile/                  ✅ Own profile
│   │   ├── security/                 ✅ Password change
│   │   └── ai-providers/             ✅ Transform Studio providers
│   ├── transform/
│   │   ├── page.tsx                  ✅ Job list
│   │   ├── new/page.tsx              ✅ New job wizard
│   │   └── [id]/page.tsx             ✅ Job detail/review
│   └── utility/
│       └── map/page.tsx              ✅ Geographic hierarchy
├── api/
│   └── employees/delete/route.ts     ✅ Employee deletion API
└── actions/
    ├── auth.ts                       ✅
    ├── leads/{index,queries,mutations,pipeline,meetings}.ts  ✅
    ├── follow-ups.ts                 ✅
    ├── users.ts                      ✅
    ├── departments.ts                ✅
    ├── roles.ts                      ✅
    ├── settings.ts                   ✅
    ├── transform.ts                  ✅
    ├── utility/map.ts                ✅
    ├── dashboard.ts                  🔧
    └── chat.ts                       🔧
```

### Planned Routes (Not Yet Created)

```
app/(protected)/
├── quotations/                       ❌
├── products/                         ❌
├── inventory/                        ❌
├── marketing/                        ❌
├── messaging/                        ❌
├── notifications/                    ❌
└── projects/[id]/                    ❌
```

---

## 6. Conflicts, Gaps & Ambiguities

### 6.1 `lead_status` enum vs TEXT — CONFLICT

**Source**: Migration `20260328000001_crm_leads_meetings.sql` created `CREATE TYPE public.lead_status AS ENUM (...)` and used it in a `leads` table. Migration `20260328000002_lead_management.sql` recreated the `leads` table with `status TEXT NOT NULL DEFAULT 'New'`. The live schema (`currentstage.sql`) confirms `status text`.

**Impact**: Status values are unconstrained at the DB level. Typos or new values can silently enter the database. No DB-level enum guard.

**Recommended Resolution**: Either (a) add a `CHECK (status IN (...))` constraint to the `leads.status` column, or (b) enforce via a `lead_status` enum by altering the column type. Application code already validates allowed values, but a DB constraint is safer.

---

### 6.2 `user_type` enum missing 'CRE' and 'Sales' — CONFLICT

**Source**: `supabase/sql/phase1_migration.sql` defines RLS policies with `get_current_user_type() IN ('Admin', 'CRE', 'Sales')`, but `user_type` enum only has `'Admin'` | `'Operator'`.

**Impact**: The `leads_insert` policy (`WITH CHECK (get_current_user_type() IN ('Admin', 'CRE'))`) will **never allow non-Admin users to insert leads** because no user has type `'CRE'`. The insert policy is effectively broken.

**Recommended Resolution**: Either extend `user_type` enum to include `'CRE'` and `'Sales'`, or replace type-based checks with role permission checks (`roles.permissions->>'Leads:Create Lead'`).

---

### 6.3 `Management` user type referenced in RLS — CONFLICT

**Source**: Migration `20260328000001_crm_leads_meetings.sql` writes:
```sql
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND type IN ('Admin', 'Management')));
```
`'Management'` is not a valid `user_type` enum value.

**Impact**: Cosmetic — this migration's policies were likely superseded by later migrations. But the orphaned reference is a code smell.

---

### 6.4 Dropped tables from migration 000001 — GAP

Migration `20260328000001_crm_leads_meetings.sql` created three tables that do **not appear** in the live schema:
- `public.meetings` (standalone meetings table, replaced by `lead_meetings`)
- `public.calls` (replaced by `lead_call_logs`)
- `public.meeting_analyses` (AI meeting feedback — no replacement exists)

**Impact**: `meeting_analyses` functionality (win probability, sentiment, objections, next steps) was designed but never migrated. It should either be added to `lead_meetings` as JSONB fields or recreated as a table.

---

### 6.5 `chats` / `messages` tables not in migrations — GAP

The `chats`, `chat_participants`, and `messages` tables exist in the live database but have no migration files.

**Recommended Resolution**: Create `supabase/migrations/[timestamp]_internal_chat.sql` to track these.

---

### 6.6 Finance data partially denormalized — AMBIGUITY

`leads.finance` JSONB stores: `projectValue`, `soldAmount`, `clientsBudget`, `soldDate`. The `lead_payments` table stores actual payment records. The `lead_finance_computed` VIEW reconciles these.

**Gap**: There is no column in `leads` or any table for `clientsBudget` as a proper numeric — it lives only in JSONB. Same for `projectValue` and `soldAmount`. This makes indexing or range-querying finance data impossible without JSON extraction.

**Recommendation**: Consider migrating financial fields to proper typed columns in `leads` for query performance.

---

### 6.7 `lead_payments.note` column name mismatch — CONFLICT

The `mark_as_sold` RPC in `phase1_migration.sql` inserts:
```sql
INSERT INTO lead_payments (..., note, ...) VALUES (..., p_payment_note, ...);
```
But the `lead_payments` table definition uses `payment_note` (not `note`). This will cause a runtime error when `mark_as_sold` is called.

---

### 6.8 WhatsApp integration — ARCHITECTURAL BLOCKER

The original MERN backend used **Baileys** (a Node.js library that reverse-engineers WhatsApp Web). This requires a persistent long-running Node.js process, which is incompatible with Next.js serverless/edge deployments.

**Options for resolution**:
1. Use **WhatsApp Business API** (official, hosted by Meta or a BSP)
2. Run a separate **Baileys microservice** (e.g., on a VPS) that pushes events to Supabase via the REST API
3. Drop WhatsApp integration and use only Facebook Messenger + manual phone tracking

This is the single largest unresolved architectural decision.

---

### 6.9 `clients` page — AMBIGUITY

`app/(protected)/clients/page.tsx` exists but its purpose is unclear. The original PRDs have no "Clients" module separate from Leads. It may be intended as a filtered view of Sold/Handed-Over leads. Needs clarification.

---

### 6.10 Transform Studio originally specified different stack — DEVIATION

The original `SP_TRANSFORM_STUDIO_PRD.md` specified: `Next.js 14 + PostgreSQL + Redis + Docker on Hostinger VPS` with a separate deployment. The implementation instead integrates Transform Studio directly into the CRM monorepo using Supabase Edge Functions and Supabase Storage (no Redis, no Docker, no separate VPS).

This is an acceptable deviation that simplifies the deployment model.

---

## 7. Next Development Priorities

Based on the gap analysis, these are the recommended priorities in order:

### Tier 1 — Critical Infrastructure Fixes
1. **Fix `user_type` enum** — Add `'CRE'` and `'Sales'` types OR restructure RLS to use role-based permissions. Without this, the CRE/SE workflow is broken at the DB level.
2. **Fix `mark_as_sold` RPC** — Change `note` to `payment_note` in the INSERT statement.
3. **Add `lead_status` CHECK constraint** — Prevent invalid status values from entering the database.
4. **Write chat migration file** — Document `chats`, `chat_participants`, `messages` tables in a migration.

### Tier 2 — Core CRM Completeness
5. **Dashboard analytics** — CRE performance, meeting analytics, date-wise lead data
6. **Notifications system** — Schema + in-browser notification bell (Supabase Realtime)
7. **Project Management** — Schema + stages UI for post-sale tracking
8. **Quotations** — Schema + full quotation builder (major feature, ~2 weeks)

### Tier 3 — Product Catalog & Finance
9. **Product Catalog** — Schema + CRUD (required for Quotations)
10. **Inventory** — Vendor and purchase order management

### Tier 4 — External Integrations (Complex)
11. **Facebook Messenger** — Webhook receiver + conversation inbox
12. **WhatsApp** — Requires architectural decision (§6.8)
13. **AI Assistants** — OpenAI Assistants integration per lead
14. **SMS (ElitBuzz)** — Notification channel

### Tier 5 — Automation
15. **pg_cron: expire follow-ups** — Schedule `expire_missed_follow_ups()` (simple)
16. **Auto-assignment engine** — CRE auto-assignment by name/round-robin
17. **Duplicate detection** — Phone-number-based dedup cron

---

*End of Master PRD*
