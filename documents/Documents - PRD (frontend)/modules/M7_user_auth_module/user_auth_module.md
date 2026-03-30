# Module 7 — User & Authentication Module

The User & Auth module manages system access, user accounts, departments, and roles.

---

## 7.1 Login

**Source File:** `src/pages/authentication/Login.tsx`  
**Route:** `/authentication/login`  
**Access:** Public (unauthenticated users only)

### Purpose
Standard login page for all user types. After login, users are redirected to their respective dashboard based on their user `type` (Admin / CRE / Sales / Operator).

### Features
- Email + Password form
- "Remember me" option
- Error state display for invalid credentials
- Redirect to appropriate dashboard on success
- Protected by `LoggedOutRoute` (cannot access if already logged in)

---

## 7.2 User Management

**Source File:** `src/pages/authentication/UserManagement.tsx`  
**Route:** `/admin/users/all-users`  
**Access:** Admin only

### Purpose
View and manage all registered users in the system.

### Features

| Feature | Description |
|---------|-------------|
| User Table | Scrollable table with all user records |
| Name Filter | Search/filter by user name |
| Status Filter | Filter by Active / Inactive |
| Gender Filter | Filter by Male / Female / Other |
| Department Filter | Filter by department |
| Role Filter | Filter by role |
| Reset Filters | Clear all applied filters |
| Active/Inactive Toggle | Switch user status with MUI Switch |
| Profile Picture | Avatar displayed in table |
| Click Name → Profile | Navigate to user's profile detail |

### Table Columns
| Column | Description |
|--------|-------------|
| Name | Avatar + full name (link to profile) |
| Email | User's email address |
| Phone | Personal phone number |
| Gender | Icon indicator (Male/Female/Other) |
| Department | Department name |
| Role | Role name |
| Type | Admin badge (if Admin type) |
| Status | Toggle switch (Active/Inactive) |

---

## 7.3 User Profile

**Source File:** `src/pages/authentication/UserProfile.tsx`  
**Route:** `/admin/users/:userId`  
**Access:** Admin

### Purpose
Detailed profile view for a specific user. Shows all user information and allows admin to manage their account.

### Fields Displayed
- Profile picture
- Full name (as per NID)
- Nickname
- Email, Phone
- Gender, Date of birth
- Department, Role
- User type (Admin or not)
- Account status
- Joining date

### Admin Actions Available
- Edit user information (if editable)
- Toggle user status (Active/Inactive)

---

## 7.4 Create User

**Source File:** `src/pages/CreateUserForm.tsx`  
**Route:** `/admin/users/create-user`  
**Access:** Admin only

### Purpose
Form to register a new system user.

### Form Fields
| Field | Type | Notes |
|-------|------|-------|
| Full Name (NID) | Text | Legal name |
| Nickname | Text | Display name |
| Email | Email | Used for login |
| Password | Password | Initial password |
| Personal Phone | Tel | Primary contact |
| Gender | Select | Male / Female / Other |
| Date of Birth | Date | |
| Department | Select | From department list |
| Role | Select | Roles within department |
| User Type | Select | Admin / Regular |
| Profile Picture | Upload | Image file |

---

## 7.5 Department Management

**Source File:** `src/pages/authentication/DepartmentManagement.tsx`  
**Route:** `/admin/users/departments`  
**Access:** Admin only

### Purpose
Manage organizational departments. Departments group roles and define which team a user belongs to.

### Features
- List all departments with their assigned roles
- Create new department
- Edit department name
- View roles within each department

### Default Departments (based on codebase)
- **CRE** — Customer Relationship Executive team
- **Sales** — Sales Executive team

---

## 7.6 Role Management

**Source File:** `src/pages/authentication/RoleManagement.tsx`  
**Route:** `/admin/users/roles`  
**Access:** Admin only

### Purpose
View and manage all user roles in the system.

### Features
- List all roles with department assignments
- See which users hold each role
- Navigate to create a new role

---

## 7.7 Add / Create Role

**Source File:** `src/pages/authentication/AddRole.tsx`  
**Route:** `/admin/users/create-role`  
**Access:** Admin only

### Purpose
Define a new role with a name and associated permissions, then assign it to a department.

### Form Fields
| Field | Description |
|-------|-------------|
| Role Name | Name of the role (e.g., "Sales Executive", "CRE") |
| Department | Department this role belongs to |
| Permissions | List of grantable permission flags |

---

## 7.8 Profile Settings

**Source File:** `src/pages/settings/ProfileSettings.tsx`  
**Route:** `/admin/settings/profile`  
**Access:** All authenticated users (within settings layout)

### Purpose
Allows any user to update their own profile information.

### Editable Fields
- Profile picture (upload)
- Nickname / Display name
- Personal phone
- Email (may require re-auth)
- Password change
- Bio / About

---

## 7.9 Authentication State (Redux)

The `authSlice` in Redux manages:
- `user` object (id, name, type, roleId, departmentId, profilePicture, etc.)
- `token` (JWT)
- `deviceToken` (for push notifications)
- Helper selectors: `useAuth()` hook

### Route Guards
- `LoggedInRoute` — Wraps all protected routes, redirects to login if not authenticated
- `LoggedOutRoute` — Wraps login page, redirects authenticated users to their dashboard
