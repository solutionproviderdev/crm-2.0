export const EMPLOYMENT_STATUSES = [
  { value: "trainee", label: "Trainee" },
  { value: "probationary", label: "Probationary Period" },
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "part_time", label: "Part Time" },
  { value: "internship", label: "Internship" },
  { value: "resigned", label: "Resigned" },
  { value: "terminated", label: "Terminated" },
  { value: "retired", label: "Retired" },
  { value: "suspended", label: "Suspended" },
  { value: "on_notice_period", label: "On Notice Period" },
  { value: "absconded", label: "Absconded" },
  { value: "deceased", label: "Deceased" },
  { value: "transferred", label: "Transferred" },
  { value: "deputed", label: "Deputed" },
] as const;

export const ACCOUNT_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "gray" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "locked", label: "Locked", color: "red" },
  { value: "archived", label: "Archived", color: "slate" }, // Using slate for Dark Gray
] as const;

export type EmploymentStatusValue = typeof EMPLOYMENT_STATUSES[number]["value"];
export type AccountStatusValue = typeof ACCOUNT_STATUSES[number]["value"];

export function getEmploymentStatusLabel(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return EMPLOYMENT_STATUSES.find((s) => s.value === value)?.label || value;
}

export function getAccountStatusLabel(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return ACCOUNT_STATUSES.find((s) => s.value === value)?.label || value;
}

export function getAccountStatusColor(value: string | null | undefined): string {
  if (!value) return "gray";
  return ACCOUNT_STATUSES.find((s) => s.value === value)?.color || "gray";
}
