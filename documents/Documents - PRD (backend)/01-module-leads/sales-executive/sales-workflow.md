# Module 01 (Supplement) — Sales Workflow | Sales Executive

## Purpose

The Sales sub-module manages the **critical hand-off events** between a meeting and a closed deal. It provides dedicated endpoints for follow-up tracking, completing meetings, and transitioning leads into specific sales stages such as `Sold` or `Prospect`.

---

## Key Sales Actions & API Endpoints

### Follow-Up Management

| Action                    | Method & Endpoint                                 | Description                                        |
|---------------------------|---------------------------------------------------|----------------------------------------------------|
| All leads with follow-ups | `GET /leads/sales/follow-up`                     | Aggregated view of all pending follow-ups          |
| Add follow-up to lead     | `POST /leads/sales/follow-up/:leadID`            | Create a new follow-up (Call or Meeting)           |
| Update follow-up status   | `PUT /leads/sales/follow-up/:leadID/:followUpID` | Mark as Complete, Missed, or Late Complete         |

### Meeting Outcome Recording

| Action               | Method & Endpoint                                   | Description                                        |
|----------------------|-----------------------------------------------------|----------------------------------------------------|
| Complete a meeting   | `PUT /leads/sales/meeting-complete/:leadID/:meetingId` | Marks meeting outcome and updates lead status   |
| Mark as Sold         | `PUT /leads/sales/sold/:leadID/:meetingId`          | Transitions lead to `Sold`, links selling meeting  |
| Mark as Prospect     | `PUT /leads/sales/prospect/:leadID`                 | Marks lead as a warm prospect interested in buying |

---

## Follow-Up Data Model

| Field        | Type    | Options / Description                                  |
|--------------|---------|--------------------------------------------------------|
| `time`       | Date    | Scheduled date and time for the follow-up              |
| `status`     | Enum    | `Pending`, `Complete`, `Missed`, `Late Complete`       |
| `type`       | Enum    | `Call` or `Meeting`                                    |
| `meetingId`  | ObjectId| Optional — links to a formal Meeting record             |
| `commentId`  | ObjectId| Optional — links to a comment/note on the lead         |
| `tenMinNotificationSent` | Boolean | `true` once the 10-min advance push has fired |

---

## Sales Process Flow (Visual)

```
Meeting Fixed
     ↓
 [Visit Happens]
     ↓
 Complete Meeting
     ├── Sold          → Lead Status: Sold
     ├── Prospect      → Lead Status: Prospect
     ├── Follow-Up     → Schedules new follow-up
     └── Lost          → Lead Status: Lost
```

---

## Validation Rules

- A `followUp.time` must be in the future when creating
- `Sold` transition requires a linked `meetingId`
- `completeMeeting` updates both the Meeting status and the Lead status atomically
