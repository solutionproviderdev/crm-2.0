# PRD: Login Page

**Route:** `/`  
**Component:** `Login.tsx`  
**Access:** Public (unauthenticated users)

---

## 📌 Purpose

The Login page is the entry point to the Solution Provider CRM. It authenticates users before granting access to any system module, and serves as a branding touchpoint for "Advance Intelligent Interior Design Software."

---

## 🖥️ Layout Structure

The page uses a **two-column split layout** on large screens:

| Column | Content |
|--------|---------|
| **Left (50%) — Desktop only** | Branding panel with product name and a large subtle gear icon watermark |
| **Right (50%) or Full on Mobile** | White login card with form |

### Left Panel (Branding)
- Large text: **"ADVANCE"** (teal `#006080`, 6xl, black weight)
- Subtitle text: **"INTELLIGENT INTERIOR DESIGN"** (dark, 2xl)
- Large text: **"SOFTWARE"** (teal `#006080`, 6xl, black weight)
- Background: Large gear icon as watermark (opacity 10%)

### Right Panel (Login Card)
- Company logo: `Settings` gear icon + "SOLUTION **PROVIDER**" text
- Tagline: *"WE PROVIDE SOLUTIONS TO MAKE THINGS EASIER"*
- Login form
- Footer: Phone number `01949-654499` + copyright

---

## ⚡ Features & User Actions

### 1. Email Input
- **Type:** `email` (HTML5 validated)
- **Required:** Yes
- **Placeholder:** `Email *`
- **Styling:** Border highlight on focus (`#006080`)

### 2. Password Input
- **Type:** `password` (toggleable to `text`)
- **Required:** Yes
- **Placeholder:** `Password *`
- **Toggle Button:** Eye/EyeOff icon to show/hide password

### 3. Remember Me
- **Type:** Checkbox
- **Label:** "Remember me"
- Styled with brand color `#006080`

### 4. Forgot Password
- **Type:** Link (`href="#"`)
- Positioned bottom-right of form
- Text: "Forgot Password?"

### 5. Login Button
- **Type:** `submit`
- **Label:** "Login"
- **Color:** Background `#006080`, hover darkens to `#004d66`
- **Action:** Calls `handleLogin()` → navigates to `/dashboard`

---

## 🔒 Authentication Logic (Current — Demo Mode)

> **Note:** Authentication is simulated. The `handleLogin` function prevents default form submission and directly navigates to `/dashboard` without server validation. In production, this should be replaced with a real authentication backend.

```typescript
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  navigate('/dashboard'); // Simulated — no real auth check
};
```

---

## 🎯 User Roles that Use This Page

| Role | Entry Point |
|------|-------------|
| CRE | `/` → login → `/dashboard` |
| Sales | `/` → login → `/dashboard` |
| Admin | `/` → login → `/dashboard` |
| Management | `/` → login → `/dashboard` |

All roles use the same login form. Role-based access is enforced **after** login via component-level logic and the `UserRoleType` config.

---

## ✅ Acceptance Criteria

- [ ] Email field rejects non-email format entries
- [ ] Password field is masked by default until toggle is pressed
- [ ] Login button submits form and navigates to `/dashboard`
- [ ] Footer always visible with contact info
- [ ] Responsive: Left branding panel hidden on small screens
- [ ] "Forgot Password" link exists (flow TBD)
