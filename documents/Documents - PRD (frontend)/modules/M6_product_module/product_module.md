# Module 6 — Product Management Module

The Product Management module allows Admins to define, organize, and manage the product catalog used for generating client quotations.

---

## 6.1 Product Management Page

**Source File:** `src/pages/product/ProductManagementPage.tsx`  
**Route:** `/admin/product-management`  
**Access:** Admin only

### Purpose
Top-level product catalog view. Displays all products and provides navigation to create or edit products.

### Features
- Lists all registered products
- Navigation link to `/create-product` for adding new products
- Navigation to `/create-product/:productId` for editing existing products

---

## 6.2 Create / Edit Product

**Source File:** `src/pages/product/CreateProduct.tsx`  
**Route:**  
- `/admin/product-management/create-product` — Create new product  
- `/admin/product-management/create-product/:productId` — Edit existing product  
**Access:** Admin only

### Purpose
Full product configuration form. Products defined here populate the dropdown selectors in the Quotation module's item cards.

### Product Data Structure

#### Basic Information
| Field | Type | Description |
|-------|------|-------------|
| Product Name | Text | Name of the product category (e.g., "Kitchen Cabinet") |
| Product Code | Text | Internal reference code |
| Description | Textarea | Short description |
| Category | Select | Product category grouping |
| Active | Toggle | Whether product is available for quotations |

#### Series
Each product can have **multiple series** (variants/tiers):

| Field | Description |
|-------|-------------|
| Series Name | Name of the series (e.g., "Premium Line", "Economy") |
| Price per Sqft | Default price per square foot for this series |
| Description | Series description |

#### Specifications Configuration

For each series, the following material specifications can be set as defaults:

**Surface**
- Surface type name (e.g., "Melamine", "PVC Foil", "Glass")

**Front Configuration**
- Board type (name + thickness: value + unit)
- Edging type (name + thickness: value + unit)
- `hasFront` flag

**Body Structure Configuration**
- Board type (name + thickness)
- Edging type (name + thickness)
- `hasBodyStructure` flag

**Hardware**
- Hardware name (e.g., "Grass Hinge", "Blum Aventos")

### User Actions
1. Fill in product name, code, category, description
2. Toggle active status
3. Add one or more series with pricing
4. Configure default specifications for each series
5. Save product → available in Quotation item cards

---

## 6.3 Product Catalog Usage in Quotations

When creating a quotation:
1. User selects **Product** from dropdown (e.g., "Kitchen Cabinet")
2. User selects **Series** from second dropdown (e.g., "Premium Line")
3. **Normal Mode:** Specifications auto-populate from the product's series defaults
4. User enters application-specific data: area, sqft, application name
5. Price per sqft is pre-filled from the series — user can override
6. Total price auto-calculates

---

## 6.4 Product Ads (Meta Ads Link)

Products are linked to **Meta/Facebook Product Ads** for lead tracking. When a lead arrives via a specific ad:
- The lead is tagged with a `productAd` reference
- This enables filtering in Lead Management by "Product Ad"
- Performance stats per ad are shown in the Utility > Ads page

This linkage connects the marketing-side (Ads) to the product catalog for attribution analytics.
