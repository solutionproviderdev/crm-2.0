/**
 * Central definition of all CRM pages and their sub-actions.
 * This drives the permissions UI (toggles) and middleware route guards.
 * Admin uses this to define what each Role can access.
 */
export const ALL_PERMISSIONS = [
  {
    resource: "Dashboard",
    actions: ["CRE View", "Sales View", "Admin View"],
  },
  {
    resource: "CRE - Lead",
    actions: ["Lead Center", "Lead Management", "Follow Up"],
  },
  {
    resource: "Sales",
    actions: ["Lead Center", "Meeting Schedule", "Meeting History"],
  },
  {
    resource: "User",
    actions: ["All Users", "User Profile", "Departments", "Roles"],
  },
  {
    resource: "Meetings",
    actions: ["Daily Meetings", "Meeting History"],
  },
  {
    resource: "Reports",
    actions: ["Sales Report", "Lead Report", "Finance Report"],
  },
  {
    resource: "Utility",
    actions: ["Map Data"],
  },
  {
    resource: "Pipelines",
    actions: ["Client Pipeline", "Project Pipeline"],
  },
  {
    resource: "Transform Studio",
    actions: ["Use Transform Studio", "Review & Approve Jobs", "Admin"],
  },
] as const;

export type PermissionResource = (typeof ALL_PERMISSIONS)[number]["resource"];
export type PermissionMap = Record<string, Record<string, boolean>>;

/** Routes that ALL authenticated users can access regardless of permissions */
export const PUBLIC_DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/profile",
  "/reminders",
  "/chat",
  "/settings",
];

/**
 * Routes that are permission-GATED (access requires the mapped permission).
 * Values must exactly match the Next.js app/(protected) route prefixes.
 */
export const PERMISSION_ROUTE_MAP: Record<string, string> = {
  // User management
  "User:All Users":         "/users",
  "User:User Profile":      "/users/",
  "User:Departments":       "/users/departments",
  "User:Roles":             "/users/roles",
  // CRE Lead access
  "CRE - Lead:Lead Center": "/leads",
  "CRE - Lead:Lead Management": "/leads",
  "CRE - Lead:Follow Up":   "/reminders",
  // Sales
  "Sales:Lead Center":      "/leads",
  "Sales:Meeting Schedule": "/meetings/slots",
  // Meetings
  "Meetings:Daily Meetings":"/meetings/slots",
  "Meetings:Meeting History":"/meetings",
  // Reports
  "Reports:Sales Report":   "/reports/sales",
  "Reports:Lead Report":    "/reports/leads",
  "Reports:Finance Report": "/reports/finance",
  // Utility
  "Utility:Map Data":       "/utility/map",
  // Pipelines
  "Pipelines:Client Pipeline": "/clients",
  "Pipelines:Project Pipeline": "/projects",
  // Transform Studio
  "Transform Studio:Use Transform Studio": "/transform",
  "Transform Studio:Review & Approve Jobs": "/transform",
  "Transform Studio:Admin": "/settings/ai-providers",
};

/** Build a flat set of allowed route prefixes from a permissions map */
export function getAllowedRoutes(permissions: PermissionMap): string[] {
  const routes = new Set<string>(PUBLIC_DASHBOARD_ROUTES);
  for (const [resource, actions] of Object.entries(permissions)) {
    for (const [action, allowed] of Object.entries(actions)) {
      if (allowed) {
        const key = `${resource}:${action}`;
        const route = PERMISSION_ROUTE_MAP[key];
        if (route) routes.add(route);
      }
    }
  }
  return Array.from(routes);
}

/** Check if a given path is permitted by a permissions map */
export function isRouteAllowed(
  pathname: string,
  permissions: PermissionMap,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  const allowedRoutes = getAllowedRoutes(permissions);
  return allowedRoutes.some((route) => pathname.startsWith(route));
}
