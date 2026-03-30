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
] as const;

export type PermissionResource = (typeof ALL_PERMISSIONS)[number]["resource"];
export type PermissionMap = Record<string, Record<string, boolean>>;

/** Routes that ALL authenticated users can access regardless of permissions */
export const PUBLIC_DASHBOARD_ROUTES = ["/dashboard", "/dashboard/profile"];

/** Map from permission resource+action → Next.js route prefix */
export const PERMISSION_ROUTE_MAP: Record<string, string> = {
  "User:All Users":         "/dashboard/users",
  "User:User Profile":      "/dashboard/users/",
  "User:Departments":       "/dashboard/users/departments",
  "User:Roles":             "/dashboard/users/roles",
  "CRE - Lead:Lead Center": "/dashboard/cre/lead-center",
  "CRE - Lead:Lead Management": "/dashboard/cre/leads",
  "CRE - Lead:Follow Up":   "/dashboard/cre/follow-up",
  "Sales:Lead Center":      "/dashboard/sales/leads",
  "Sales:Meeting Schedule": "/meetings/slots",
  "Meetings:Daily Meetings":"/meetings/slots",
  "Meetings:Meeting History":"/dashboard/meetings/history",
  "Reports:Sales Report":   "/dashboard/reports/sales",
  "Reports:Lead Report":    "/dashboard/reports/leads",
  "Reports:Finance Report": "/dashboard/reports/finance",
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
