# Module 07 — Dashboard | CRE View

## Purpose

The CRE dashboard provides a **personalized performance overview** for Customer Relations Executives — showing their assigned leads, upcoming reminders, pending follow-ups, and notification alerts.

---

## CRE Dashboard Widgets

### 1. My Lead Summary

- Total leads assigned to me
- Breakdown by status (Active, Follow Up, Meeting Fixed, etc.)
- Unread messages count

### 2. Pending Reminders

- All reminders with `status = Pending`
- Sorted by scheduled time (soonest first)
- Quick action: Mark complete / Snooze

### 3. Pending Follow-Ups

- All `salesFollowUp` entries with `status = Pending`
- Type indicator: Call or Meeting
- Quick action: Update status

### 4. My Performance Stats

- **API:** `GET /dashboard/cre-performance/:creId` (own ID)
- Leads replied today
- Follow-ups completed this week
- Reminders hit rate (completed / total)

### 5. Notifications

- **API:** `GET /dashboard/notifications`
- Unread lead messages
- Reminders due soon
- Missed follow-ups alert

---

## Purpose of Each Widget

| Widget                | CRE Goal                                      |
|-----------------------|-----------------------------------------------|
| Lead Summary          | Know workload at a glance                     |
| Pending Reminders     | Never miss a scheduled callback               |
| Pending Follow-Ups    | Stay on top of all planned calls/meetings     |
| Performance Stats     | Self-monitor productivity                     |
| Notifications         | Immediate awareness of customer activity      |
