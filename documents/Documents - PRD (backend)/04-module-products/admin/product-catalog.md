# Module 04 — Products | Admin View

## Purpose

The Products module is the **product catalogue** for the furniture/interior design business. It defines all sellable product types, their material configurations per series/tier, pricing per square foot, and quality scores. Products form the basis for generating quotations.

---

## Product Hierarchy

```
Product (e.g. "Kitchen Cabinet")
  └── Specifications [ ]
        └── Series (e.g. "Premium Melamine")
              ├── Surface type
              ├── Config (Front shutter + Body structure)
              │     ├── Board
              │     ├── Edging
              │     └── Surface
              ├── Hardware
              ├── Material Descriptions
              └── Quality Scores + Pricing
```

---

## Product Data Model

### Product

| Field           | Type       | Description                                        |
|-----------------|------------|----------------------------------------------------|
| `name`          | String     | Product name (e.g. "Kitchen Cabinet")              |
| `description`   | String     | Product details                                    |
| `thumbnail`     | String     | Cover image URL                                    |
| `productStatus` | Enum       | `active` or `inactive`                             |
| `specifications`| Array      | List of series specifications                      |

### Series Specification (per product)

| Field                 | Type     | Description                                          |
|-----------------------|----------|------------------------------------------------------|
| `series`              | ObjectId | Reference to Series                                  |
| `surface`             | ObjectId | Surface type for this configuration                  |
| `configs.front`       | Object   | Board, edging, surface for the front shutter         |
| `configs.bodyStructure`| Object  | Board, edging, surface for the body                  |
| `hasFront`            | Boolean  | Whether the product has a front shutter              |
| `hasBodyStructure`    | Boolean  | Whether the product has a body structure             |
| `hardware`            | ObjectId | Hardware reference (hinges, handles etc.)            |
| `hasHardware`         | Boolean  | Whether hardware is included                        |
| `durability`          | Number   | Score 0–10                                           |
| `waterResistant`      | Number   | Score 0–10                                           |
| `scratchResistant`    | Number   | Score 0–10                                           |
| `screwHoldingCapacity`| Number   | Score 0–10                                           |
| `warranty`            | Number   | Warranty in years (min: 0)                           |
| `pricePerSqFt`        | Number   | Price per square foot for this series                |
| `images`              | [String] | Gallery images for this configuration                |
| `materialDescriptions`| Array    | Material breakdown with use description              |

### Material Description Entry

| Field      | Type     | Options                               |
|------------|----------|---------------------------------------|
| `itemType` | Enum     | `Board`, `Edging`, `Hardware`, `Surface` |
| `item`     | ObjectId | Reference to the material document    |
| `usetext`  | String   | Descriptive use label                 |

---

## Product Classes (from legacy schema)

| Class     | Description                   |
|-----------|-------------------------------|
| Economy   | Entry-level pricing/quality   |
| Standard  | Mid-range                     |
| Premium   | High-quality finishes         |
| Platinum  | Top-tier materials            |

## Product Application Types (from legacy schema)

| Application                          |
|--------------------------------------|
| Kitchen Cabinet                      |
| Front Shutter                        |
| Storage Cabinet                      |
| Modular Cabinet                      |
| Dinner Wagon                         |
| Full Height Cabinet / Open Shelve    |
| Bi-Fold Folding Door Works           |
| TV / Media Unit Works                |

---

## Materials Sub-Modules

### Series

- Name and description of a product line/tier
- Referenced by each product specification

### Materials (Raw)

Four categories of materials tracked separately:

| Type       | Examples                                      |
|------------|-----------------------------------------------|
| **Board**  | MDF, Particle board, Plywood                  |
| **Edging** | PVC edging, Melamine banding                  |
| **Surface**| Formica laminate, paint, acrylic, veneer      |
| **Hardware**| Hinges, drawer slides, handles, locks        |

### Color

Color options referenced per product section in quotations:
- `prefabricated` — Standard available colors
- `formicaLaminated` — Laminate color codes
- `paint` — Custom paint color names

### Composite Materials

Pre-built material bundles combining multiple raw materials for common building blocks.

---

## Features & User Actions (Admin)

### 1. Create Product

- **API:** `POST /products/`
- Enter name, description, thumbnail
- Add one or more series specifications with material configs and quality scores

### 2. View All Products

- **API:** `GET /products/`
- Lists all active and inactive products
- Shows name, thumbnail, available series count

### 3. View Product Details

- **API:** `GET /products/:id`
- Full specification breakdown with populated material names

### 4. Update Product

- **API:** `PUT /products/:id`
- Edit specs, pricing, status (`active`/`inactive`)

### 5. Delete Product

- **API:** `DELETE /products/:id`

### 6. Manage Series

- **API:** `GET/POST/PUT/DELETE /product/series/`
- Create product series/tiers
- Referenced by product specifications and quotation items

### 7. Manage Materials

- **APIs:** Under `GET/POST/PUT/DELETE /product/materials/`
- Manage Boards, Edgings, Surfaces, Hardware separately
- Each material has: name, description, image

### 8. Manage Colors

- **API:** Under `GET/POST/PUT/DELETE /product/color/`
- Track color options for laminate, prefabricated and paint surfaces

---

## Auto-Populated on Fetch

When retrieving products, the following are auto-populated:

| Path                                            | Returns          |
|-------------------------------------------------|------------------|
| `specifications.series`                         | Full series doc  |
| `specifications.surface`                        | Full surface doc |
| `specifications.hardware`                       | Full hardware doc|
| `specifications.configs.front.board`            | Board name/desc  |
| `specifications.configs.front.edging`           | Edging name/desc |
| `specifications.configs.bodyStructure.*`        | Same as above    |
| `specifications.materialDescriptions.item`      | Material ref doc |
