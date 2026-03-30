# Module 05 — Inventory | Admin View

## Purpose

The Inventory module manages the supply chain for raw materials used in manufacturing. It tracks **Vendors** (suppliers) and **Purchase Orders** — recording what materials were ordered, from whom, at what price, and payment status.

---

## Sub-Modules

1. **Vendor Management** — Supplier profiles and material pricing
2. **Purchase Management** — Purchase orders with status and payment tracking

---

## 5.1 Vendor Management

### Vendor Data Model

| Field             | Type     | Description                                               |
|-------------------|----------|-----------------------------------------------------------|
| `name`            | String   | Vendor/company name (required)                            |
| `address`         | String   | Full address                                              |
| `active`          | Boolean  | Whether vendor is currently active (default: `true`)      |
| `lastPurchaseDate`| Date     | Date of most recent purchase                              |
| `contacts`        | Array    | Contact persons (see below)                               |
| `materials`       | Array    | Materials supplied by this vendor (see below)             |
| `rating`          | Number   | Vendor rating 0–5                                         |
| `image`           | String   | Vendor logo URL                                           |

### Contact Person

| Field              | Type    | Description                                 |
|--------------------|---------|---------------------------------------------|
| `name`             | String  | Full name (required)                        |
| `phone`            | String  | Phone number (required)                     |
| `designation`      | String  | Role/position                               |
| `visitingCardImage`| String  | Image URL of visiting card                  |
| `isPrimary`        | Boolean | Primary contact flag                        |

### Vendor Materials (Pricing Catalog)

Each vendor can supply different material types with individual pricing:

| Field               | Type     | Options / Description                         |
|---------------------|----------|-----------------------------------------------|
| `type`              | Enum     | `Board`, `Edging`, `Surface`, `Hardware`      |
| `material`          | ObjectId | Reference to the actual material document     |
| `vendorCode`        | String   | Vendor's internal SKU/code                    |
| `price`             | Number   | Current unit price                            |
| `unit`              | String   | Unit of measure (kg, m, piece, etc.)          |
| `minOrderQuantity`  | Number   | Minimum order size                            |
| `leadTime`          | Number   | Delivery time in days                         |
| `isActive`          | Boolean  | Is this material currently available?         |
| `lastPurchaseDate`  | Date     | Most recent purchase date                     |
| `lastPurchasePrice` | Number   | Most recent purchase price                    |

### Vendor Features (Admin)

| Feature                | API Endpoint                   | Description                           |
|------------------------|--------------------------------|---------------------------------------|
| List all vendors        | `GET /inventory/vendors/`      | All active/inactive vendors           |
| Create vendor           | `POST /inventory/vendors/`     | Register new supplier                 |
| View vendor details     | `GET /inventory/vendors/:id`   | Full profile with materials           |
| Update vendor           | `PUT /inventory/vendors/:id`   | Edit details, contacts, materials     |
| Delete vendor           | `DELETE /inventory/vendors/:id`| Remove vendor                         |

---

## 5.2 Purchase Management

### Purchase Data Model

| Field            | Type     | Description                                            |
|------------------|----------|--------------------------------------------------------|
| `purchaseNumber` | String   | Unique purchase order number (auto-generated)          |
| `vendor`         | ObjectId | Reference to Vendor                                    |
| `items`          | Array    | List of purchased items (see below)                    |
| `totalAmount`    | Number   | Total purchase amount                                  |
| `status`         | Enum     | `draft`, `ordered`, `received`, `cancelled`            |
| `paymentStatus`  | Enum     | `pending`, `partially_paid`, `paid`                    |
| `paymentDetails` | Array    | Payment history records                                |
| `notes`          | String   | Optional notes                                         |
| `attachments`    | Array    | Attached documents (name, URL, type)                   |
| `additionalCost` | Array    | Extra costs (e.g. delivery, customs)                   |

### Purchase Item

| Field           | Type     | Description                            |
|-----------------|----------|----------------------------------------|
| `vendorMaterial`| ObjectId | Vendor's specific material entry        |
| `material`      | ObjectId | Reference to material document          |
| `materialType`  | Enum     | `Board`, `Edging`, `Surface`, `Hardware`|
| `quantity`      | Number   | Units ordered                           |
| `pricePerUnit`  | Number   | Unit cost at time of purchase           |
| `totalPrice`    | Number   | `quantity × pricePerUnit`               |

### Purchase Status Flow

```
draft → ordered → received
           ↓
        cancelled
```

### Payment Status

| Status              | Meaning                        |
|---------------------|--------------------------------|
| `pending`           | No payment made yet            |
| `partially_paid`    | Some payments made             |
| `paid`              | Fully settled                  |

### Payment Methods

`cash`, `bank_transfer`, `check`, `other`

### Purchase Features (Admin)

| Feature                   | API Endpoint                      | Description                          |
|---------------------------|-----------------------------------|--------------------------------------|
| List all purchases         | `GET /inventory/purchases/`       | All purchase orders                  |
| Create purchase order      | `POST /inventory/purchases/`      | Start new PO for a vendor            |
| View purchase details      | `GET /inventory/purchases/:id`    | Full PO with vendor and material info|
| Update purchase            | `PUT /inventory/purchases/:id`    | Edit items, status, notes            |
| Add payment                | `POST /inventory/purchases/:id/payment` | Log a payment                  |
| Delete purchase            | `DELETE /inventory/purchases/:id` | Remove PO                            |

---

## Business Rules

- Purchase numbers must be unique
- `totalAmount` must reflect sum of all item `totalPrice` values + `additionalCost`
- Status auto-advances to `received` when quantity matches expected delivery
- Vendor `lastPurchaseDate` is updated after each completed purchase
