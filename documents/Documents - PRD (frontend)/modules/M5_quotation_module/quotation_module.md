# Module 5 — Quotation Module

The Quotation module enables Sales Executives and Admins to create professional, printable quotations for cabinet and interior design projects linked to specific client leads.

---

## 5.1 Create Quotation

**Source File:** `src/pages/CreateQuotation.tsx`, `src/components/quotation/QuotationForm.tsx`  
**Route:** `/admin/quotation`, `/sales/quotation`, `/quotation/create/:leadId`  
**Access:** Admin, Sales Executive

### Purpose
Generate A4-format client quotations with itemized product specifications, pricing calculations, transportation, discounts, and client details. Supports live preview alongside form and print-ready output.

---

### Page Layout

The page is split into two panels:

| Panel | Width | Description |
|-------|-------|-------------|
| **Form Panel** (left) | 50% | Editable quotation form fields |
| **Preview Panel** (right) | 50% | Live A4 quotation preview |

Preview panel can be toggled with "Show/Hide Preview" button.

---

### Header Controls

| Button | Function |
|--------|---------|
| **Back** | Navigate to previous page |
| **Show Date** | Toggle date visibility on the printed quotation |
| **Show Page Number** | Toggle page number display on print |
| **Lower Ink Mode** | Use lighter colors/backgrounds to save ink when printing |
| **Show/Hide Preview** | Toggle the live preview panel |
| **Print** | Trigger browser print dialog (A4 format) |

---

### Form Sections (QuotationForm Component)

#### Client Information
| Field | Notes |
|-------|-------|
| Name | Auto-filled from lead record |
| Phone | Auto-filled (if lead has multiple phones, joined by comma) |
| Email | Manual input |
| Address | Auto-filled: Area, District, Division concatenated from lead |
| **Project Location** | **Select**: Inside Dhaka or Outside Dhaka — directly drives transportation cost |

> When `leadId` is provided in the URL, the form fetches the lead via `useGetSingleLeadQuery` and auto-fills all fields above.

#### Quotation Details
| Field | Notes |
|-------|-------|
| Quotation Number | Auto-generated (`QT-{timestamp}`) |
| Date | Auto-filled (today's date) |
| Valid Until | Auto-filled (30 days from today) |
| Notes | Free-text notes for the client |
| Terms | Default: "50% advance, 50% on completion. Prices are subject to change." |

#### Quotation Items

Each line item represents one product area in the project (e.g., Kitchen Cabinet, TV Unit). Multiple items can be added.

| Field | Auto/Manual | Description |
|-------|-------------|-------------|
| **Product** | Manual | Dropdown from product catalog (`useGetAllProductsQuery`) |
| **Series** | Manual | Dropdown populated after product selected (from product's `specifications`) |
| **Application Name** | Manual | Defaults to product name; fully editable |
| **Application Area** | Manual | e.g., Kitchen, Master Bedroom |
| **Sqft** | Manual | Decimal-precision area input |
| **Price per Sqft** | **Auto** | Filled from selected series `pricePerSqFt` — read-only display |
| **Total Price** | **Auto** | `sqft × pricePerSqft` — recalculates live on any change |

**Add / Remove Items:**
- "Add Item" button adds a new blank item row
- "Delete" (trash icon) removes an item (minimum 1 item required)

#### Product → Series Auto-Populate Logic

When a Series (specification) is selected, the following data is automatically pulled from the product catalog and passed to the print preview:
- `series.name`, `series.description`, `series.image`
- `surface.name`, `surface.description`, `surface.image`
- `hasFront` and `hasBodyStructure` flags
- `hardware.name` (e.g., Grass Hinge, Blum Aventos)
- Quality ratings: `durability`, `waterResistant`, `scratchResistant`, `screwHoldingCapacity`, `warranty`
- `images` array for the product series

#### Quotation Totals (Summary Section)

| Field | Source | Value |
|-------|--------|-------|
| **Subtotal** | Auto | Sum of all `item.totalPrice` values |
| **Transportation** | Location-based fixed | Inside Dhaka: **৳5,500** / Outside Dhaka: **৳15,500** |
| **Discount** | Optional manual input | Enabled via "Apply Discount" checkbox |
| **Grand Total** | Auto | `Subtotal + Transportation − Discount` |

> **Transportation Cost:**  
> Selecting **Inside Dhaka** sets transportation = ৳5,500.  
> Selecting **Outside Dhaka** sets transportation = ৳15,500.  
> This is not manually editable — it is locked to the Project Location selection.

> **Discount:**  
> The "Apply Discount" checkbox reveals a numeric input.  
> Discount is a flat amount (not a percentage) subtracted from the grand total.

---

### Print Configuration

- Print format: **A4 size**
- Color-adjust: `exact` (preserves colors/gradients in print)
- Print CSS: `@media print` with `-webkit-print-color-adjust: exact`
- Document title: `Quotation-{quotationNumber}`
- Lower Ink Mode: switches preview to lighter color scheme before printing

---

### QuotationPreview Component

Real-time A4 preview that reflects data from the form panel:
- Company header/branding
- Client information block
- Quotation metadata (number, date, validity)
- Itemized table with all product specs
- Totals section (Subtotal, Transportation, Discount, Total)
- Notes and Terms sections
- Page number (optional)

---

### Lead-Linked Quotation

When accessed via `/quotation/create/:leadId`:
- Fetches the lead using `useGetSingleLeadQuery`
- Auto-fills client name, phone, address, project location from lead data
- Shows loading/error states while fetching

---

### Item Modes

**Normal Mode**
- User selects product and series
- Most fields auto-populate from product catalog
- Only application-specific fields require manual input

**Edit Mode**
- Full manual control over all fields
- Description and notes can be customized freely
- Switch between modes via toggle
