# Project Status & Call Action System

This document covers the **Project Status tracking system** embedded across the Lead Center, CRE Lead Management, and Follow-Up flows. This is how the CRM tracks where a client's physical construction/renovation project currently stands, which affects lead priority and communication strategy.

---

## Overview

When a CRE communicates with an "Ongoing" lead (a number has been collected and the client is actively engaged), the client may be mid-way through their own construction or renovation project. Capturing the construction phase helps determine when the client will be ready to purchase interior products.

---

## Project Status Categories

When the lead status is set to **"Ongoing"** via the Call Action Modal, two additional fields become mandatory:

### Project Status (Top Level)

| Value | Meaning |
|-------|---------|
| **Ongoing** | Project is currently under active construction |
| **Ready** | Construction is complete; client is ready for interior |
| **Renovation** | Client is renovating an existing property |

### Project Sub-Status (Granular Construction Phase)

Only shown when **Project Status = Ongoing**. Captures the exact construction milestone:

| Sub-Status | Phase Description |
|-----------|-------------------|
| Roof Casting | Structure being casted |
| Brick Wall | Brick masonry work ongoing |
| Plaster | Wall plastering in progress |
| Pudding | Surface putty/pudding coat |
| Two Coat Paint | First/second coat of paint |
| Tiles Complete | Tile laying is complete |
| Final Paint Done | Final coat of paint applied |
| Handed Over | Apartment handed over by developer |
| Staying in the Apartment | Client is already living in the property |
| Interior Work Complete | Interior work is fully done |

---

## Call Action Modal (`CallActionModal.tsx`)

**Source File:** `src/pages/cre/components/CallActionModal.tsx`  
**Used By:** CRE Lead Center, CRE Lead Management, Follow-Up flow  
**Trigger:** "Log Call" or status update button on any active lead

### Purpose
A compact modal for logging the outcome of a phone or WhatsApp call with a lead. This is the primary tool CREs use to update a lead's status after each interaction.

### Modal Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Call Outcome** | Badge toggle | ✅ | Select one of three outcomes (see below) |
| **Next Reminder** | DateTime picker | ✅ | Schedule the next follow-up reminder |
| **Comment** | Textarea | ✅ | Notes from the call |
| **Project Status** | Select | ✅ (if Ongoing) | Construction status of client's project |
| **Sub Status** | Select | ✅ (if Ongoing) | Granular construction phase |

### Call Outcome Options (Badge Selection)

| Outcome | Icon | Meaning |
|---------|------|---------|
| **Call Reschedule** | RefreshCcw | Client asked to be called back at another time |
| **Ongoing** | Hammer | Active project; capture project phase |
| **No Response** | MessageCircleX | Client did not answer or reply |

### Logic Rules
- All three fields (outcome, reminder, comment) must be filled before saving
- If "Ongoing" is selected, **both** Project Status and Sub Status become required
- On save: lead status is updated, reminder is created, comment is logged
- Fields are reset after successful save

---

## Project Status Visualization — CRE Follow-Up Flow Diagram

**Source File:** `src/pages/cre/CREFollowUp.tsx` (React Flow visualization)

The `CREFollowUp` page includes an **interactive React Flow diagram** that visualizes the complete CRM pipeline as a flowchart — from initial lead through to project completion. Each node represents a lead status/project stage.

### Flow Nodes (Post-Sale Stages)
Once a lead is **Sold**, the project tracking pipeline takes over:

```
Sold
  ↓
Prospect
  ↓
Measured
  ↓
Material Received
  ↓
Project in Production
  ↓
Project Complete
  ↓
Handed Over
```

Each node shows:
- Stage name
- Count of leads currently at that stage
- Color-coded borders (green = positive, purple = active, blue = progress)

### Pre-Sale Node Groups (Also Shown in the Flow)
The full diagram also covers the pre-sale journey:
- New Lead → Message (Call Reschedule / No Response) → Ongoing → Meeting Fixed → Meeting Complete → Sold

### Interaction
- **Click a node** → Shows a sidebar with all leads at that stage
- **Zoom/Pan** — The diagram is scrollable and zoomable (React Flow canvas)
- **Date Range Filter** — Filter flow data by date range to see pipeline snapshots over time

---

## LeadStatus Component — Inline Status Selector (`CreStatus.tsx`)

**Source File:** `src/components/leadCenter/creStatus/CreStatus.tsx`  
**Used In:** FollowUp.tsx, GeneralInformation (SalesInfoDetails), CRE Lead Center

### Purpose
A compact inline dropdown/badge that lets CRE or Sales users update the lead's current status without opening a separate modal.

### Behavior
- Shows current status as a color-coded badge
- Click → opens status picker
- Select a new status → API call updates lead record
- Reflects updated status immediately (optimistic UI)
