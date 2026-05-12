# Lifecycle UI Migration Phase Plan

## Purpose

The database now supports a standard lifecycle model:

```text
Lead -> Client -> Project
```

The UI should move away from department-based stages such as CRE, Sales, and Implementation. Departments should remain as ownership, assignment, access, and reporting concepts, not lifecycle navigation.

## Target Product Model

```text
Inbox -> Leads -> Clients -> Projects -> Reports -> Settings
```

Core rule:

```text
Stage = where the customer/work is
Status = current situation
Department = who usually owns the work
Assignment = who is responsible right now
Role/access = who can view or change it
```

## Target Sitemap

```text
/dashboard

/workspace
  /workspace/inbox
  /workspace/my-tasks
  /workspace/follow-ups
  /workspace/support-requests

/leads
  /leads
  /leads/new
  /leads/import
  /leads/[id]

/clients
  /clients
  /clients/[id]
  /clients/[id]/meetings
  /clients/[id]/quotations
  /clients/[id]/measurements

/projects
  /projects
  /projects/[id]
  /projects/[id]/materials
  /projects/[id]/production
  /projects/[id]/installation
  /projects/[id]/handover

/pipeline
  /pipeline/leads
  /pipeline/clients
  /pipeline/projects

/calendar
  /calendar/meetings
  /calendar/follow-ups
  /calendar/measurements
  /calendar/installations

/reports
  /reports/lifecycle
  /reports/team-performance
  /reports/conversion
  /reports/lost-reasons
  /reports/project-delivery

/users
  /users
  /users/departments
  /users/roles
  /users/permissions

/settings
  /settings/company
  /settings/pipeline
  /settings/status-transitions
  /settings/sources
  /settings/security
```

## Phase 1 - DB-Driven Lifecycle Foundation

Goal:
Use the new database lifecycle tables as the source of truth for visible statuses/stages without changing the whole workflow at once.

Status:
Implemented in this pass.

Scope:

- Add shared lifecycle types.
- Add server actions to read `pipeline_stages`, `pipeline_statuses`, and `status_transitions`.
- Replace hardcoded status groups in `LeadStatusControl` with DB-provided groups.
- Replace hardcoded client/project pipeline stage arrays at the page boundary.
- Keep legacy `leads.status` compatibility for now.
- Keep existing status action dialogs and mutations intact.

UI outcome:

- Status menus show `Lead`, `Client`, and `Project` groups.
- Client pipeline columns come from the `client` stage statuses.
- Project pipeline columns come from the `project` stage statuses.
- Existing users can still change statuses using the current modal workflow.

Not in Phase 1:

- No drag/drop transition enforcement.
- No new record detail page redesign.
- No assignment history UI.
- No support request inbox.
- No settings editor for transitions.

Acceptance checks:

- `/leads` renders with DB-backed lifecycle options.
- `/clients` renders client-stage pipeline columns.
- `/projects` renders project-stage pipeline columns.
- Existing status update dialogs still open.
- Build passes or only fails on known unrelated existing lint/build issues.

## Phase 2 - Lifecycle Action Panel

Goal:
Replace the raw status dropdown with a workflow-first action control.

Status:
Implemented in this pass.

Scope:

- Add `LifecycleActionPanel`.
- Show current stage, status, department, and owner.
- Fetch allowed next transitions from `status_transitions`.
- Show only valid next actions.
- If a transition requires a note, assignment, or follow-up, open a targeted form.
- Keep `LeadStatusControl` as a compatibility wrapper so existing pages do not need broad rewrites.
- Pass transition rules into `/leads` and `/leads/[id]`.
- Reuse the existing status dialog, meeting wizard, comments, follow-ups, finance, and sold flows.

UI outcome:

```text
Current: Client / Quotation Sent

Available actions:
- Mark Prospect
- Mark Sold
- Mark Lost
- Schedule Follow-up
```

Acceptance checks:

- Users cannot visually jump to invalid statuses.
- Required transition fields are collected before update.
- Activity/status history records remain intact.

## Phase 3 - Record Detail Redesign

Goal:
Turn the lead detail view into a lifecycle record view.

Status:
Implemented in this pass.

Scope:

- Shared detail shell for Lead, Client, and Project.
- Header with lifecycle badge, status badge, owner, department, priority, next action.
- Stage-specific tabs:
  - Lead: Overview, Contact, Follow-ups, Comments, Activity
  - Client: Overview, Meeting, Quotation, Finance, Measurement, Follow-ups, Activity
  - Project: Overview, Materials, Production, Installation, Finance, Files, Activity
- Add status timeline from `lead_status_history`.
- Add assignment timeline from `lead_assignments`.
- Reuse existing lead overview, contact, meeting, finance, follow-up, comments, and call-log components inside the lifecycle shell.
- Add placeholder panels for lifecycle surfaces whose operational tables exist but do not yet have full UI flows.

Acceptance checks:

- The detail page explains where the record is and what should happen next.
- Staff do not need to infer status meaning from comments.

## Phase 4 - Workspace Inbox

Goal:
Give every user a practical daily work surface.

Status:
Implemented in this pass.

Scope:

- `/workspace/inbox`
- `/workspace/my-tasks`
- `/workspace/follow-ups`
- `/workspace/support-requests`
- Cards for overdue follow-ups, unassigned records, support requests, meetings, measurements, and installations.
- Add a top-nav Workspace entry.
- Add shared workspace dashboard UI with focused views for inbox, assigned tasks, follow-ups, and support.
- Add cached server actions that batch workspace queues in parallel.

Acceptance checks:

- A CRE can start the day from Inbox without opening all leads manually.
- A manager can see stuck or unassigned work.

## Phase 5 - Pipeline Boards and Transition Enforcement

Goal:
Make pipeline boards operational, not just visual.

Status:
Implemented in this pass.

Scope:

- Lead board by Lead statuses.
- Client board by Client statuses.
- Project board by Project statuses.
- Drag/drop allowed only if a matching `status_transitions` row exists.
- Drop opens the same transition dialog when data is required.

Acceptance checks:

- Invalid moves are blocked.
- Valid moves update lifecycle fields and history.
- Board columns are driven by `pipeline_statuses.sort_order`.

## Phase 6 - Assignment and Department Operations

Goal:
Make ownership explicit and reportable.

Status:
Implemented in this pass.

Scope:

- Assignment panel on every record.
- Reassign modal.
- Assignment history.
- Department workload view.
- Unassigned and stale assignment queues.

Acceptance checks:

- Current owner is always visible.
- Managers can reassign with a reason.
- Assignment history is preserved.

## Phase 7 - Support Request Workflow

Status: Implemented

Goal:
Turn `Need Support` into a real operational process.

Scope:

- `Need Support` transition creates a `support_requests` row.
- Support request page with Open, In Progress, Resolved, Cancelled.
- Priority, assigned department, assigned user, and resolution fields.

Acceptance checks:

- Support work is no longer hidden inside lead status.
- Resolution history is visible on the record.

Implemented notes:

- `Need Support` status updates now create a `support_requests` row with priority, department, owner, subject, description, and open status.
- `/workspace/support-requests` is now a dedicated support operations page grouped by Open, In Progress, Resolved, and Cancelled.
- Support cards expose lead link, assigned user, department, requested by, priority, resolution timestamp, and quick status actions.

## Phase 8 - Calendar Expansion

Status: Implemented

Goal:
Unify dated work in one place.

Scope:

- Meeting calendar.
- Follow-up calendar.
- Measurement calendar.
- Installation calendar.
- My calendar / department calendar / all company filters.

Acceptance checks:

- Users can see all due work by date.
- Calendar events link back to the related lifecycle record.

Implemented notes:

- `/calendar` now combines meetings, follow-ups, measurements, and installation work into one page.
- Specialized calendar URLs redirect into the unified calendar page to keep the sitemap simple.
- Installation work is resolved from lifecycle status IDs instead of legacy status text.

## Phase 9 - Reports

Status: Implemented

Goal:
Measure lifecycle movement and bottlenecks.

Reports:

- Lead conversion rate.
- Source quality.
- CRE response time.
- Meeting fixed rate.
- Quotation sent rate.
- Sales conversion.
- Lost reason analysis.
- Measurement delay.
- Production delay.
- Installation delay.
- Handover completion.
- Department workload.

Acceptance checks:

- Reports use `lead_status_history` and `lead_assignments`, not only current status.
- Managers can identify where records are stuck.

Implemented notes:

- `/reports` now shows lifecycle counts, source counts, assignment gaps, stale assignments, and recent status movement.
- Report-specific URLs redirect to the single reports surface to reduce page sprawl.
- Recent movement is sourced from `lead_status_history`; stale assignment count is sourced from `lead_assignments`.

## Phase 10 - Pipeline Settings UI

Status: Implemented

Goal:
Make lifecycle rules configurable without database edits.

Scope:

- `/settings/pipeline`
- `/settings/status-transitions`
- Stage/status editor.
- Transition editor.
- Default department editor.
- Required note/assignment/follow-up toggles.

Acceptance checks:

- Admins can update lifecycle labels and transition rules.
- Changes immediately affect menus and pipeline boards.

Implemented notes:

- `/settings/pipeline` edits status labels, default departments, terminal flags, and conversion flags.
- `/settings/status-transitions` edits required note, assignment, and follow-up rules.
- Settings navigation exposes Pipeline and Transitions only for admins.
