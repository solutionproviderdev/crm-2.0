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
  LEAD_ACTIVITY: (leadId: string) => `lead:${leadId}:activity`,

  // ── Meeting data ────────────────────────────────────────────────────────
  MEETINGS: "meetings",
  MEETING_DATE: (date: string) => `meetings:${date}`,
  MEETING_SLOTS: "meeting-slots",

  // ── Follow-up / Reminder data ───────────────────────────────────────────
  FOLLOW_UPS: "follow-ups",

  // ── Workspace (inbox, tasks, support, calendar) ─────────────────────────
  WORKSPACE: "workspace",

  // ── User / Team data ────────────────────────────────────────────────────
  USERS: "users",
  SALES_TEAM: "sales-team",
  CRE_TEAM: "cre-team",

  // ── User directory ───────────────────────────────────────────────────────
  USERS_LIST: "users:list",
  USER_DETAIL: (id: string) => `user:${id}`,
  USER_DROPDOWN: "users:dropdown",

  // ── Org structure (low-churn, cache aggressively) ───────────────────────
  DEPARTMENTS: "departments",
  ROLES: "roles",
  ROLES_BY_DEPT: (deptId: string) => `roles:dept:${deptId}`,

  // ── Site & settings (very low-churn) ────────────────────────────────────
  SETTINGS: "settings",

  // ── Transform Studio ─────────────────────────────────────────────────────
  TRANSFORM_JOBS: "transform:jobs",
  TRANSFORM_JOB: (id: string) => `transform:job:${id}`,
  TRANSFORM_PRESETS: "transform:presets",
  AI_PROVIDERS: "transform:ai-providers",
  AI_MODELS: "transform:ai-models",

  // ── Geographic map (very low-churn) ──────────────────────────────────────
  MAP_DATA: "utility:map",
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];
