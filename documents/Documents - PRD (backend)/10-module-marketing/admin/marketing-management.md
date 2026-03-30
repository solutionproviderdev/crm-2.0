# Module 10 — Marketing | Admin View

## Purpose
The Marketing module allows administrators to manage promotional campaigns, specifically through **Product Ads** and **Discount Coupons**. These tools are used to acquire new leads and incentivize sales conversions.

---

## 10.1 Product Ads

### Purpose
Track and manage advertising campaigns linked to specific products, allowing the CRM to capture leads coming from specific advertisements.

### Features
| Feature | API Endpoint | Description |
|---|---|---|
| View All Ads | `GET /ad/` | List all active product advertisements |
| View Ads for Lead | `GET /ad/for-lead/:leadId` | See which ads a specific lead interacted with |
| Create Ad | `POST /ad/` | Register a new ad campaign tracking record |
| Add Ad Images | `POST /ad/:id/images` | Attach creatives to the ad record |
| Ad Statistics | `GET /ad/report/stats` | Performance tracking and ROI over a date range |

---

## 10.2 Discount Coupons

### Purpose
Manage promotional discounts that can be applied to quotations to close deals faster.

### Features
| Feature | API Endpoint | Description |
|---|---|---|
| Active Discounts | `GET /discountRoutes/active` | Get currently valid public discounts |
| Validate Coupon | `POST /discountRoutes/validate` | Check if a coupon code is valid for a quote |
| Applicable Discounts| `GET /discountRoutes/applicable` | Find discounts that apply to current cart |
| Create Discount | `POST /discountRoutes/create` | Admin tool to generate a new coupon code |
| Update Approval | `PATCH /discountRoutes/approval/:id` | Approve/reject pending discount requests |
| Change Status | `PATCH /discountRoutes/status/:id` | Toggle a discount's active/inactive status |

### Logic
- Discounts can be percentage-based or flat amount.
- They have validity periods and approval workflows.
- During Quotation creation, `validateCoupon` is called to verify the discount before applying it to the `finalPrice`.
