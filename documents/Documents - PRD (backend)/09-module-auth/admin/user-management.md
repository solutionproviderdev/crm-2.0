# Module 09 — Auth & User Management | Admin View

## Purpose

The Auth module manages all system users. It handles authentication (login/logout), user profiles, department structure, role definitions, and granular permission management.

---

## User Data Model

| Field              | Type     | Description                                              |
|--------------------|----------|----------------------------------------------------------|
| `nameAsPerNID`     | String   | Legal name from National ID (required)                   |
| `nickname`         | String   | Display name within CRM (required)                       |
| `email`            | String   | Unique login email (required)                            |
| `personalPhone`    | String   | Personal phone number                                    |
| `officePhone`      | String   | Office contact number                                    |
| `gender`           | Enum     | `Male`, `Female`, `Other`                                |
| `address`          | String   | Home/current address                                     |
| `profilePicture`   | String   | URL to profile photo                                     |
| `coverPhoto`       | String   | URL to cover banner photo                                |
| `password`         | String   | Hashed password                                          |
| `status`           | Enum     | `Active`, `Inactive`                                     |
| `type`             | Enum     | `Admin`, `Operator`                                      |
| `roleId`           | ObjectId | Assigned role (within department)                        |
| `departmentId`     | ObjectId | Department the user belongs to                           |
| `accessLevel`      | [String] | Array of permission identifiers                          |
| `joiningDate`      | Date     | Employee start date                                      |
| `currentSalary`    | Number   | Monthly salary                                           |
| `workingProcedure` | String   | Notes on how this user operates                          |

### User Documents

| Field                         | Description                          |
|-------------------------------|--------------------------------------|
| `documents.resume`            | URL to resume file                   |
| `documents.nidCopy`           | URL to NID copy scan                 |
| `documents.academicDocument`  | URL to academic certificate          |
| `documents.bankAccountNumber` | Bank account number                  |
| `documents.agreement`         | URL to employment agreement          |

### Guardian Information

| Field            | Description              |
|------------------|--------------------------|
| `guardian.name`  | Guardian's full name     |
| `guardian.phone` | Guardian's phone         |
| `guardian.relation` | Relationship to user  |

### Activity Log

Each action taken by the user is optionally logged:
```json
{ "date": "...", "activity": "Updated lead status to Sold" }
```

### Social Links

Array of platform + URL pairs (LinkedIn, Facebook, etc.)

### Device Tokens (Push Notifications)

| Field              | Description                             |
|--------------------|-----------------------------------------|
| `deviceTokens`     | Array of Firebase FCM tokens (multi-device) |
| `mobileDeviceToken`| Primary mobile device token            |

---

## User Types

| Type       | Description                                        |
|------------|----------------------------------------------------|
| `Admin`    | Full system access                                 |
| `Operator` | Access limited by department roles and permissions |

---

## Departments & Roles

### Department

| Field             | Description                           |
|-------------------|---------------------------------------|
| `departmentName`  | Name of the department                |
| `description`     | What this department does             |
| `roles`           | Array of roles within the department  |

### Role (within Department)

| Field         | Description                                    |
|---------------|------------------------------------------------|
| `roleName`    | Name of the role (e.g. "CRE", "Sales Manager") |
| `description` | What this role does                            |
| `permissions` | Array of resource-action permission rules      |

### Permission Structure

Each resource (e.g. `Dashboard`, `Leads`, `Quotations`) has a set of allowed actions:

```json
{
  "resource": "Leads",
  "actions": [
    { "name": "view", "allowed": true },
    { "name": "create", "allowed": true },
    { "name": "edit", "allowed": false },
    { "name": "delete", "allowed": false }
  ]
}
```

---

## Authentication

| Feature              | API Endpoint               | Description                              |
|----------------------|----------------------------|------------------------------------------|
| Login                | `POST /auth/login`         | Email + password → returns JWT token     |
| Logout               | `POST /auth/logout`        | Invalidates session                      |
| Token Refresh        | `POST /auth/refresh`       | Refresh expired JWT                      |
| Change Password      | `PUT /auth/change-password`| Update own password                      |
| Check Auth           | Middleware `checkAuth`     | Validates JWT on protected routes        |

---

## User Management (Admin)

| Feature                  | API Endpoint                     | Description                         |
|--------------------------|----------------------------------|-------------------------------------|
| Create user              | `POST /auth/user/`               | Add new staff member                |
| View all users           | `GET /auth/user/`                | List all users                      |
| View user details        | `GET /auth/user/:id`             | Full profile                        |
| Update user              | `PUT /auth/user/:id`             | Edit profile, salary, documents     |
| Activate / Deactivate    | `PUT /auth/user/:id` (status)    | Enable or disable account           |
| Delete user              | `DELETE /auth/user/:id`          | Remove user from system             |
| Upload profile picture   | Via file upload endpoint          | Multer-handled image upload         |

---

## Department Management (Admin)

| Feature                  | API Endpoint                       | Description                         |
|--------------------------|------------------------------------|-------------------------------------|
| Create department         | `POST /auth/department/`           | New department with roles           |
| View all departments      | `GET /auth/department/`            | All departments and their roles     |
| Update department         | `PUT /auth/department/:id`         | Edit name, description, roles       |
| Add role to department    | `POST /auth/department/:id/roles`  | Add a new role with permissions     |
| Update role permissions   | `PUT /auth/department/:id/roles/:roleId` | Edit existing role permissions |
| Delete department         | `DELETE /auth/department/:id`      | Remove department                   |

---

## Team & Scheduling Management (Admin/Manager)

| Feature                  | API Endpoint                       | Description                         |
|--------------------------|------------------------------------|-------------------------------------|
| Create team               | `POST /team/`                      | Group users into a functional team  |
| List teams                | `GET /team/`                       | View all operational teams          |
| View details              | `GET /team/:id`                    | See team members                    |
| Update team               | `PUT /team/:id`                    | Edit team name or membership        |
| Assign meeting to team    | `POST /team/addMeeting`            | Distribute a meeting to a team      |
| View daily meetings       | `GET /team/meetings/:date`         | Track a team's schedule per day     |
| Swap slots within team    | `POST /team/swapSlots/:date`       | Trade timeslots between members     |
| Swap meeting between teams| `POST /team/swapMeeting/:date`     | Reassign meeting to different team  |

---

## Default Departments (Loaded via defaultDocuments)

Based on `defaultDocuments/easeit.departments.json`:

The system ships with pre-configured departments and roles including:
- CRE Department (with CRE roles and messaging/lead permissions)
- Sales Department (with Sales Executive roles and meeting permissions)
- Admin Department (full access)

---

## Activity Log

User activity is tracked per account:
- **API:** `GET /auth/activity-log`
- Stores date + activity text per user
- Useful for audit trail and compliance

---

## Device Token Management

- **API:** `PUT /auth/device-token`
- Registers or updates Firebase device tokens
- Used for sending push notifications to mobile app users
