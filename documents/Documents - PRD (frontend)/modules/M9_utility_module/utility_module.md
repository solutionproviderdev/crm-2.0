# Module 9 — Utility Tools Module

The Utility module contains specialized tools for advertising analytics, geographic lead/meeting visualization, and SMS gateway integration.

**Layout:** `UtilityLayout` — sidebar navigation for utility sub-pages.

---

## 9.1 Product Ads Management (Meta Ads)

**Source File:** `src/pages/utility/AdsPage.tsx`  
**Route:** `/admin/utility/ads`  
**Access:** Admin only

### Purpose
Manage Facebook/Meta product ad campaigns linked to the CRM for lead attribution, performance tracking, and ad-to-lead conversion analytics.

### Page Sections

#### Ad Performance Stats Chart
- Date range picker (with shortcut presets: This Month, Last 7 Days, etc.)
- Horizontal bar chart showing lead count per ad
- Each bar is color-coded by lead status
- Clicking a date range refreshes the chart data

#### Product Ads Cards Grid
- 3-column card grid displaying all registered product ads
- Each card shows:
  - Up to 3 product images
  - Ad name
  - Description
  - Tags (displayed as outlined buttons)
- Click a card → opens `AdDetailsModal` with full ad info

### User Actions
| Action | Description |
|--------|-------------|
| Select date range | Filter performance chart by time period |
| View ad card | See ad preview and basic info |
| Click ad card | Open detailed ad modal |
| Click "Add Meta Ad" | Opens `AddMetaAdModal` to register a new ad |

### AddMetaAdModal
- Fields: Ad name, description, product category, link to Facebook Ad ID, upload images, add tags
- Saved ad appears in the grid and becomes available as a lead source filter

### AdDetailsModal
- Shows full ad details including all images, description, linked Facebook URL
- Displays total leads generated and status breakdown for the ad
- May include edit capability

---

## 9.2 Geographic Map

**Source File:** `src/pages/utility/Map.tsx`  
**Route:** `/admin/utility/map`  
**Access:** Admin only

### Purpose
Visual geographic representation of leads and/or meeting locations on an interactive map. Useful for identifying geographic demand clusters and planning sales executive territories.

### Features
- Interactive map (Google Maps or Leaflet-based)
- Pins/markers for lead/meeting addresses
- Filter by date range
- Filter by lead status or type
- Cluster mode for dense areas
- Click pin → show lead/meeting summary popup

### Use Cases
- Identify neighborhoods with highest lead density
- Route planning for Sales Executives
- Coverage analysis (which areas have been visited vs not)

---

## 9.3 ElitBuzz SMS Integration

**Source File:** `src/pages/utility/ElitbuzzIntegrate.tsx`  
**Route:** `/admin/utility/elitbuzz`  
**Access:** Admin only

### Purpose
Integrate with ElitBuzz (or similar Bangladeshi bulk SMS gateway) to send SMS notifications to leads or clients.

### Features
- API key / credentials configuration
- Send test SMS
- Message template editor
- Bulk SMS to selected leads
- SMS send history/log
- SMS trigger configuration (e.g., auto-send on meeting confirmation)

### Typical SMS Use Cases
- Meeting reminder: "Your appointment is on [date] at [time]"
- Welcome message for new leads
- Follow-up reminder
- Payment due reminder

---

## 9.4 Utility Layout Navigation

**Source File:** `src/layouts/UtilityLayout.tsx`

Persistent sidebar navigation for utility tools:

| Menu Item | Route |
|-----------|-------|
| Product Ads | utility/ads |
| Map | utility/map |
| ElitBuzz | utility/elitbuzz |
