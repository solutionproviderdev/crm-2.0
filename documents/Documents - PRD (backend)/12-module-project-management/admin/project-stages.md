# Module 12 — Project Stages | Admin & Operations View

## Purpose
The Project Stages module handles the **granular tracking of post-sale execution**. While the Lead module tracks high-level status (e.g., "Making", "Handed Over"), the Project Stage module breaks down the actual production and installation work into actionable, trackable steps.

---

## Project Stage Flow

A project passes through multiple detailed mechanical and interior stages:
- `Roof Casting`
- `Brick Wall`
- `Plaster`
- `Pudding`
- `Two Coat Paint`
- `Tiles Complete`
- `Final Paint Done`
- `Interior Work Complete`
- `Staying in the Apartment`
- `Handed Over`

---

## Features & User Actions

| Action | API Endpoint | Description |
|---|---|---|
| Create Project StageTracker | `POST /projectStage/` | Instantiate tracking for a newly Sold project |
| View All Projects in Progress | `GET /projectStage/` | List all tracked execution stages |
| View Specific Project | `GET /projectStage/:id` | Detailed step-by-step progress view |
| Update Master Stage | `PUT /projectStage/:id` | Update high-level progression |
| Update Stage Details | `PATCH /projectStage/:id/stagedetails` | Check off specific micro-tasks within a stage |

### Connection to Leads
Updates made in the `projectStage` routes synchronize with the `Lead` document's `projectStatus.subStatus` field, ensuring that CREs and Sales Executives have real-time visibility into the production floor without needing full access to the operational project boards.
