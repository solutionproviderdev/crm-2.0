# Module 03 — Quotations | Admin & Sales Executive View

## Purpose

The Quotation module allows staff to build detailed, itemized quotes for clients based on the product catalogue. Each quotation is linked to a Lead and includes product selection, dimensions, materials, pricing, discounts, and transportation costs.

---

## Quotation Data Model

### Top-Level Fields

| Field            | Type       | Description                                           |
|------------------|------------|-------------------------------------------------------|
| `client`         | ObjectId   | Reference to Lead (the customer)                      |
| `items`          | Array      | List of quotation items (products)                    |
| `transportation` | Number     | Transportation/delivery cost (must be ≥ 0)            |
| `discount`       | Number     | Percentage discount (0–100%)                          |
| `finalPrice`     | Number     | Computed final price after discount + transportation  |
| `validUntil`     | Date       | Expiry date (default: 7 days from creation)           |
| `notes`          | String     | Optional message or special instructions              |

### Quotation Item

| Field        | Type     | Description                                          |
|--------------|----------|------------------------------------------------------|
| `product`    | ObjectId | Reference to Product                                 |
| `series`     | ObjectId | Reference to Series (material/finish tier)           |
| `sections`   | Array    | One or more physical sections of the item            |
| `quantity`   | Number   | Number of units (min: 1)                             |
| `totalPrice` | Number   | Sum of section prices × quantity (auto-validated)    |

### Product Section (per dimension)

| Field         | Type     | Description                                         |
|---------------|----------|-----------------------------------------------------|
| `name`        | String   | Section label (e.g. "Upper Cabinet", "Lower Unit")  |
| `dimensions`  | Object   | `height`, `width`, `depth` (in inches)              |
| `sqft`        | Number   | Calculated square footage = (H × W) / 144          |
| `type`        | [String] | Type tags (e.g. front shutter type)                |
| `surface`     | ObjectId | Reference to Surface material                       |
| `color`       | ObjectId | Reference to Color option                           |
| `price`       | Number   | Price for this section                              |

---

## Features & User Actions

### 1. Create Quotation

- **API:** `POST /quotations/`
- Select lead (client)
- Add one or more product items
  - Choose Product → choose Series
  - Add sections with dimensions → system calculates sqft and price
  - Select Surface and Color per section
- Set Transportation cost
- Apply Discount (%)
- System auto-calculates `finalPrice`
- Set `validUntil` date (default: 7 days)
- Add optional notes

### 2. View All Quotations

- **API:** `GET /quotations/`
- **Filters:** Client name, product, date range, price range
- Each quotation shows: client, items summary, final price, validity

### 3. View Single Quotation

- **API:** `GET /quotations/:id`
- Full breakdown with populated product names, series, surface, and color info

### 4. Update Quotation

- **API:** `PUT /quotations/:id`
- Edit any field — items, pricing, discount, notes, validity

### 5. Delete Quotation

- **API:** `DELETE /quotations/:id`

### 6. Save to Project (Lead Association)

- Each quotation is permanently linked to a specific Lead via `client` field
- Quotations can be viewed from the Lead Detail page under "Quotations" tab

### 7. Instant Price Calculator

- **API:** `POST /calculator`
- Utility tool to quick-calculate a cabinet/interior product based on given dimensions and materials without generating a formal Quotation document
- Used for quoting ballpark figures over messaging channels

---

## Price Calculation Logic

```
Section Total = sum of all section prices
Item Total = Section Total × quantity
Subtotal = sum of all Item Totals
After Discount = Subtotal − (Subtotal × discount / 100)
Final Price = After Discount + transportation
```

> **Validation:** The system server-side validates that sqft matches dimensions and totalPrice matches section prices × quantity.

---

## Populated Data on Fetch

When retrieving quotations, the following fields are automatically populated:

| Path                      | Fields Returned                           |
|---------------------------|-------------------------------------------|
| `items.product`           | `name`, `specifications`, `thumbnail`     |
| `items.series`            | `name`, `description`                     |
| `items.sections.surface`  | `name`                                    |
| `items.sections.color`    | `prefabricated`, `formicaLaminated`, `paint` |

---

## Who Can Use This Module

| Role             | Can Create | Can View All | Can Edit | Can Delete |
|------------------|------------|--------------|----------|------------|
| Admin            | ✅          | ✅            | ✅        | ✅          |
| Sales Executive  | ✅          | Own leads    | Own      | ❌          |
| CRE              | ❌          | ❌            | ❌        | ❌          |
