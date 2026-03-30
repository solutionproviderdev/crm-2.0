# PRD: Global Sidebar Navigation

**Component:** `Sidebar.tsx`  
**Location:** Persistent — left side of all authenticated pages  
**Access:** All authenticated users

---

## 📌 Purpose

The Sidebar is the primary navigation mechanism for the CRM. It provides quick access to all modules and displays a live badge for pending Meta Leads.

---

## 🖥️ Layout

- **Width:** 256px (`w-64`), fixed full-height
- **Background:** Dark slate (`bg-slate-900`, near-black)
- **Text:** White / tinted for inactive items

### Header Area
- **App Name:** "Solution Provider" — 20px bold white text
- Positioned in a 64px-tall top bar with bottom border

### Navigation Area
- Scrollable list of navigation links
- Each item: icon (Lucide) + label text

### Footer Area
- "Settings" link with gear icon
- Positioned at bottom with top border separator

---

## 🗂️ Navigation Items

| Order | Label | Icon | Route | Badge |
|-------|-------|------|-------|-------|
| 1 | Dashboard | LayoutDashboard | `/dashboard` | — |
| 2 | CRM & Leads | Users | `/leads` | — |
| 3 | Meta Leads | Zap | `/meta-leads` | ✅ Pending count badge |
| 4 | CRE Dashboard | BarChart2 | `/cre-dashboard` | — |
| 5 | Meetings | CalendarCheck | `/meetings` | — |
| 6 | Projects | Briefcase | `/projects` | — |
| 7 | Factory | Factory | `/factory` | — |
| 8 | Reports | BarChart3 | `/reports` | — |
| 9 | AI Assistant | Bot | `/ai-assistant` | — |
| 10 | Marketing | Megaphone | `/marketing` | — |
| — | Settings | Settings | (Footer btn) | — |

---

## ⚡ Features

### 1. Active State Highlighting
- Active route link gets `bg-slate-800 text-white` background
- Inactive links: `text-slate-400`, hovered: `hover:bg-slate-800 hover:text-white`
- Detection: `useLocation()` hook compares `pathname`

### 2. Meta Leads Live Badge
- Shows count of `importStatus === 'pending'` leads
- Badge: Teal rounded pill (`bg-teal-500`) with white count text
- Only visible when count > 0
- Draws attention to unprocessed leads requiring action

### 3. Responsive
- Full sidebar visible on desktop
- (Future: collapsible on mobile)

---

## 🔒 Access Control Notes

All navigation items are currently visible to all authenticated roles. Future enhancement: show/hide items based on `UserRoleType`.

---

## ✅ Acceptance Criteria

- [ ] Active link is visually distinct from inactive links
- [ ] Meta Leads badge updates when new pending leads arrive
- [ ] Settings button is accessible at the bottom
- [ ] Sidebar does not obscure page content
