# Module 11 — Map Data | Admin View

## Purpose
The Map Data module acts as a **geographical routing and pricing engine**. It tracks service areas across Divisions, Districts, and specific local Areas, and associates Visit Charges for Sales Executives traveling to those locations.

---

## Hierarchy
1. **Division** (e.g., Dhaka, Chattogram)
2. **District** (e.g., Dhaka District, Narayanganj)
3. **Area** (e.g., Gulshan, Banani, Dhanmondi)

---

## Features & User Actions (Admin)

### 1. Location Management
| Action | API Endpoint | Description |
|---|---|---|
| View Map Data | `GET /mapData/` | Fetch full geographical tree |
| Add Map Data | `POST /mapData/` | Add a new root location entry |
| Divisions | `GET /mapData/divisions` | List all divisions |
| Districts by Division | `GET /mapData/:divisionId/districts` | List districts inside a division |
| Areas by District | `GET /mapData/:districtId/areas` | List specific neighborhoods |
| Add District | `POST /mapData/:divisionId/districts` | Add new district to a division |
| Add Area | `POST /mapData/:districtId/areas` | Add new area to a district |
| Search Location | `GET /mapData/search` | Search by keyword |

### 2. Visit Charge Configuration
| Action | API Endpoint | Description |
|---|---|---|
| Update Visit Charge | `PUT /mapData/update-visit-charge/:areaId` | Set the BDT fee for SE visits to this area |

*Note: When a CRE or Admin "Fixes a Meeting", the system looks up the lead's address via the Map Data module to automatically determine and apply the appropriate `visitCharge`.*

### 3. Geographical Analytics
| Action | API Endpoint | Description |
|---|---|---|
| Sales Report | `GET /mapData/report/sale` | Analyze sales volume and performance by geographical region |
