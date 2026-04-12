// Environment variable defined Sentinel Account UUID
// Used across the app to safely migrate references of deleted users.
export const SENTINEL_USER_ID = process.env.NEXT_PUBLIC_SENTINEL_USER_ID || "00000000-0000-0000-0000-000000000000";
