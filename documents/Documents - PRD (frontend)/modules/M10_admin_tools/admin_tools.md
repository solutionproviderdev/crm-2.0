# Module 10 — Admin Tools

Admin Tools are specialized administrative features exclusive to the Admin role, including a shared dashboard, a cabinet area calculation tool, and a 2D floor layout designer.

---

## 10.1 Admin Dashboard

**Source File:** `src/pages/Dashboard.tsx` (shared)  
**Route:** `/admin/dashboard`  
**Access:** Admin (with admin-specific view variant)

### Purpose
High-level administrative performance overview of the entire CRM, showing all CREs' performance and team-wide lead data.

### Admin-Specific View (when `user.type === "Admin"`)

| Component | Description |
|-----------|-------------|
| `AllCREPerformanceCard` | Team overview: performance metrics for every CRE simultaneously |
| `DateWiseLeadDataCard` | Day-by-day lead acquisition chart with date range selector |
| `AlluserRecentactivity` | Activity timeline for all users combined |

### Non-Admin View (CRE/Sales/Operator)

| Component | Description |
|-----------|-------------|
| `PerformanceCard` | Personal performance metrics (personalized to the logged-in user) |
| `WeeklyMeetingCard` | Weekly meetings chart with team/personal toggle |
| `NotificationCard` | Recent notifications for the user |
| `AlluserRecentactivity` | Activity log (own activities) |

### Admin Notification System
- Browser push notifications via device token
- Device token stored in Redux auth state
- `requestNotificationPermission()` helper called on dashboard mount

---

## 10.2 Cabinet Calculation

**Source File:** `src/pages/admin/CabinetCalculation.tsx`  
**Route:** `/admin/cabinet-calculation`  
**Access:** Admin only

### Purpose
A specialized calculation tool for estimating cabinet/furniture material quantities based on room dimensions and design specifications. Helps in material planning and cost estimation for interior projects.

### Features (based on README in same folder)
- Input room/area dimensions (length × width × height)
- Select product category (e.g., Kitchen, Wardrobe, TV Unit)
- Configure number of cabinets, shelves, and compartments
- Material type selection (board thickness, surface type)
- Output: calculated material quantities (sqft), estimated cost
- Print/export results

### Use Cases
- Pre-quotation material estimation
- Factory/production planning
- Cost sanity check before sending formal quotation

---

## 10.3 2D Layout Designer

**Source File:** `src/pages/2D_layout/TwodLayoutScreen.tsx` (and related components)  
**Route:** `/admin/2d-layout`  
**Access:** Admin only

### Purpose
An interactive 2D floor plan designer for planning interior layouts. Used to visualize cabinet/furniture placement within a room before generating a quotation.

### Features
- **Canvas area:** Interactive drag-and-drop workspace
- **Room setup:** Define room dimensions (width × length)
- **Furniture library:** Select from pre-defined cabinet modules, kitchen units, etc.
- **Placement:** Drag furniture items onto the floor plan canvas
- **Resize/rotate:** Adjust placed items
- **Wall detection:** Items snap to walls
- **Measurement display:** Real-time dimension labels
- **Export/Print:** Output 2D plan as image or PDF
- **Save/Load:** Save layouts linked to a project/lead

### Workflow
1. Admin/sales creates a new layout for a client project
2. Sets room dimensions
3. Drags cabinet units from the library panel
4. Arranges units on the floor plan
5. Adjust and finalize
6. Print or export for the client meeting

---

## 10.4 Shared Admin Dashboard Components

### AllCREPerformanceCard
Shows side-by-side performance stats for all CRE agents:
- Total assigned leads per CRE
- Number collected, follow-ups, meetings set/complete
- Performance score (%)
- Comparative view enables quick identification of high/low performers

### DateWiseLeadDataCard
Shows the number of leads per day over a configurable date range:
- Date range picker
- Bar/line chart with daily lead count
- Useful for tracking marketing campaign effectiveness

### AlluserRecentactivity
Aggregated activity feed from all users:
- Lead creations, status updates, meetings set, comments
- Grouped by user with timestamps
- Filterable by activity type or user

---

## 10.5 Shared Dashboard (All Roles)

The same `Dashboard.tsx` component is used for Admin, Operator (`/operator/dashboard`) and as a fallback. The rendering changes based on `user.type`:
- `Admin` → Team performance view
- Non-Admin → Personal performance view
