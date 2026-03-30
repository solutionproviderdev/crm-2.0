/**
 * Centralized Cache Tags for Next.js 'use cache' Directive
 *
 * Rules:
 * - Use `cacheTag(CACHE_TAGS.X)` inside cached read functions.
 * - Use `updateTag(CACHE_TAGS.X)` inside mutations to invalidate the cache.
 * - Prefer granular tags (e.g., LEAD_DETAILS) over broad ones (e.g., LEADS)
 *   where possible to avoid over-invalidation.
 */
export const CACHE_TAGS = {
  // ── Lead data ───────────────────────────────────────────────────────────
  LEADS: "leads",
  LEAD_DETAILS: (id: string) => `lead:${id}`,
  LEAD_STATUS_COUNTS: "leads:status-counts",

  // ── Meeting data ────────────────────────────────────────────────────────
  MEETINGS: "meetings",
  MEETING_DATE: (date: string) => `meetings:${date}`,
  MEETING_SLOTS: "meeting-slots",

  // ── Follow-up / Reminder data ───────────────────────────────────────────
  FOLLOW_UPS: "follow-ups",

  // ── User / Team data ────────────────────────────────────────────────────
  USERS: "users",
  SALES_TEAM: "sales-team",
  CRE_TEAM: "cre-team",

  // ── Org structure (low-churn, cache aggressively) ───────────────────────
  DEPARTMENTS: "departments",
  ROLES: "roles",
  ROLES_BY_DEPT: (deptId: string) => `roles:dept:${deptId}`,

  // ── Site & settings (very low-churn) ────────────────────────────────────
  SETTINGS: "settings",
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];
