# Module 01 (Supplement) — Lead Finance | Admin & Sales Executive

## Purpose

The Finance sub-module handles all **money tracking** after a lead is marked as "Sold". It records payments, calculates dues, and gives accounts a clear view of all outstanding and completed transactions per project.

---

## Finance Data Model (Embedded in Lead)

| Field            | Type       | Description                                       |
|------------------|------------|---------------------------------------------------|
| `clientsBudget`  | Number     | Customer's stated maximum budget                  |
| `projectValue`   | Number     | Business-assessed value of the project            |
| `soldAmount`     | Number     | Final negotiated sale price                       |
| `soldDate`       | Date       | Date the sale was confirmed                       |
| `totalPayment`   | Number     | Running total of all payments received            |
| `totalDue`       | Number     | Outstanding balance (`soldAmount - totalPayment`) |
| `payments`       | Array      | Individual payment records                        |

### Payment Record

| Field           | Values / Description                                                                      |
|-----------------|-------------------------------------------------------------------------------------------|
| `amount`        | Payment amount in BDT                                                                     |
| `paymentMethod` | `Cash`, `Cheque`, `Bank Transfer`, `Bkash`, `Nagad`, `Rocket`, `SSL E-Commerce`           |
| `paymentDate`   | Date the payment was made                                                                 |
| `paymentStatus` | `Paid` or `Unpaid`                                                                        |
| `paymentNote`   | Any additional note (e.g. cheque number, bank reference)                                  |

---

## API Endpoints

| Action                         | Method & Endpoint                                  | Description                              |
|--------------------------------|----------------------------------------------------|------------------------------------------|
| **View all finance summaries** | `GET /leads/finance/`                              | List all sold leads with finance details |
| **Get finance for lead**       | `GET /leads/finance/:leadID`                       | Full finance breakdown for one lead      |
| **Update finance details**     | `PUT /leads/finance/:leadID`                       | Edit budget, projectValue, soldAmount    |
| **Add payment**                | `POST /leads/finance/:leadID/payment`              | Record a new payment received            |
| **Edit payment**               | `PUT /leads/finance/:leadID/payment/:paymentID`    | Correct a payment entry                  |
| **Delete payment**             | `DELETE /leads/finance/:leadID/payment/:paymentID` | Remove an erroneous payment entry        |

---

## Validation Rules

- `amount` must be a positive number
- `paymentDate` cannot be a future date
- `paymentMethod` must be from the approved list
- The system raises an alert if `totalDue` goes negative (overpayment scenario)

---

## Who Can Access

| Action               | Admin | Sales Executive | CRE |
|----------------------|:-----:|:---------------:|:---:|
| View all finance      | ✅   | Own leads        | ❌  |
| Update finance details| ✅   | Own leads        | ❌  |
| Add / edit payments   | ✅   | Own leads        | ❌  |
| Delete payments       | ✅   | ❌              | ❌  |
