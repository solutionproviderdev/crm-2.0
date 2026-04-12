import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Department, Role } from "./types";
import {
  EMPLOYMENT_STATUSES,
  ACCOUNT_STATUSES,
} from "@/constants/employeeStatus";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RawUserRow extends Record<string, string> {}

export interface ParsedUserRow {
  name: string;
  email: string;
  password: string;
  nickname?: string;
  personal_phone?: string;
  office_phone?: string;
  gender?: string;
  address?: string;
  date_of_birth?: string;
  joining_date?: string;
  current_salary?: number | null;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
  department_id?: string | null;
  department_name?: string; // original name for display
  role_id?: string | null;
  role_name?: string; // original name for display
  type?: string;
  employment_status?: string;
  account_status?: string;
}

export interface ValidatedUserRow extends ParsedUserRow {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions (for templates)
// ─────────────────────────────────────────────────────────────────────────────

export const USER_IMPORT_COLUMNS = [
  // Required
  { header: "name",               required: true  },
  { header: "email",              required: true  },
  { header: "password",           required: true  },
  // Optional
  { header: "nickname",           required: false },
  { header: "personal_phone",     required: false },
  { header: "office_phone",       required: false },
  { header: "gender",             required: false },
  { header: "address",            required: false },
  { header: "date_of_birth",      required: false },
  { header: "joining_date",       required: false },
  { header: "current_salary",     required: false },
  { header: "guardian_name",      required: false },
  { header: "guardian_phone",     required: false },
  { header: "guardian_relation",  required: false },
  { header: "department_name",    required: false },
  { header: "role_name",          required: false },
  { header: "type",               required: false },
  { header: "employment_status",  required: false },
  { header: "account_status",     required: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Header normalization
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeUserHeader(header: string): string {
  const h = header.toLowerCase().trim().replace(/[\s_]+/g, "");

  if (h === "name" || h === "fullname")            return "name";
  if (h === "email" || h === "emailaddress")       return "email";
  if (h === "password" || h === "pass")            return "password";
  if (h === "nickname" || h === "nick")            return "nickname";
  if (h.includes("personalphone") || h === "phone") return "personal_phone";
  if (h.includes("officephone"))                   return "office_phone";
  if (h === "gender" || h === "sex")               return "gender";
  if (h === "address")                             return "address";
  if (h.includes("dateofbirth") || h === "dob" || h === "birthdate") return "date_of_birth";
  if (h.includes("joiningdate") || h === "joined" || h === "startdate") return "joining_date";
  if (h.includes("salary") || h.includes("currentsal")) return "current_salary";
  if (h.includes("guardianname"))                  return "guardian_name";
  if (h.includes("guardianphone"))                 return "guardian_phone";
  if (h.includes("guardianrelation") || h.includes("relation")) return "guardian_relation";
  if (h.includes("departmentname") || h === "dept" || h === "department") return "department_name";
  if (h.includes("rolename") || h === "role")      return "role_name";
  if (h === "type" || h === "usertype")            return "type";
  if (h.includes("employmentstatus") || h === "empstatus") return "employment_status";
  if (h.includes("accountstatus") || h === "accstatus") return "account_status";

  return h; // passthrough
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const VALID_GENDERS   = ["Male", "Female", "Other"] as const;
const VALID_TYPES     = ["Admin", "Manager", "Operator"] as const;
const VALID_EMP       = EMPLOYMENT_STATUSES.map(s => s.value);
const VALID_ACCT      = ACCOUNT_STATUSES.map(s => s.value);

function parseISODate(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateUserRow(
  raw: RawUserRow,
  rowNumber: number,
  departments: Department[],
  roles: Role[],
  existingEmails: Set<string>, // already-seen emails (db + prior rows in file)
): ValidatedUserRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Normalize all headers
  const norm: Record<string, string> = {};
  Object.keys(raw).forEach(key => {
    norm[normalizeUserHeader(key)] = String(raw[key] ?? "").trim();
  });

  // ── Required ──
  const name  = norm.name  || "";
  const email = (norm.email || "").toLowerCase();
  const password = norm.password || "";

  if (!name)     errors.push("Name is required");
  if (!email)    errors.push("Email is required");
  else if (!isValidEmail(email)) errors.push("Invalid email format");
  else if (existingEmails.has(email)) errors.push(`Email already exists: ${email}`);

  if (!password)           errors.push("Password is required");
  else if (password.length < 8) errors.push("Password must be at least 8 characters");

  // ── Gender ──
  let gender: string | undefined;
  if (norm.gender) {
    const matched = VALID_GENDERS.find(g => g.toLowerCase() === norm.gender.toLowerCase());
    if (matched) gender = matched;
    else errors.push(`Invalid gender: "${norm.gender}". Must be one of: ${VALID_GENDERS.join(", ")}`);
  }

  // ── Type ──
  let userType: string = "Operator";
  if (norm.type) {
    const matched = VALID_TYPES.find(t => t.toLowerCase() === norm.type.toLowerCase());
    if (matched) userType = matched;
    else errors.push(`Invalid type: "${norm.type}". Must be one of: ${VALID_TYPES.join(", ")}`);
  }

  // ── Employment status ──
  let employment_status: string = "trainee";
  if (norm.employment_status) {
    const matched = VALID_EMP.find(v => v.toLowerCase() === norm.employment_status.toLowerCase().replace(/[\s-]+/g, "_"));
    if (matched) employment_status = matched;
    else errors.push(`Invalid employment_status: "${norm.employment_status}". Allowed: ${VALID_EMP.join(", ")}`);
  }

  // ── Account status ──
  let account_status: string = "active";
  if (norm.account_status) {
    const matched = VALID_ACCT.find(v => v.toLowerCase() === norm.account_status.toLowerCase());
    if (matched) account_status = matched;
    else errors.push(`Invalid account_status: "${norm.account_status}". Allowed: ${VALID_ACCT.join(", ")}`);
  }

  // ── Dates ──
  let date_of_birth: string | undefined;
  if (norm.date_of_birth) {
    const parsed = parseISODate(norm.date_of_birth);
    if (parsed) date_of_birth = parsed;
    else errors.push(`Invalid date_of_birth: "${norm.date_of_birth}". Use YYYY-MM-DD`);
  }

  let joining_date: string | undefined;
  if (norm.joining_date) {
    const parsed = parseISODate(norm.joining_date);
    if (parsed) joining_date = parsed;
    else errors.push(`Invalid joining_date: "${norm.joining_date}". Use YYYY-MM-DD`);
  }

  // ── Salary ──
  let current_salary: number | null = null;
  if (norm.current_salary) {
    const n = Number(norm.current_salary.replace(/[,\s]/g, ""));
    if (isNaN(n) || n < 0) errors.push(`Invalid current_salary: "${norm.current_salary}"`);
    else current_salary = n;
  }

  // ── Department lookup (warning only) ──
  let department_id: string | null = null;
  const department_name = norm.department_name || "";
  if (department_name) {
    const dept = departments.find(d => d.name.toLowerCase() === department_name.toLowerCase());
    if (dept) department_id = dept.id;
    else warnings.push(`Department not found: "${department_name}" — leaving unassigned`);
  }

  // ── Role lookup (warning only; verify dept match if both given) ──
  let role_id: string | null = null;
  const role_name = norm.role_name || "";
  if (role_name) {
    const role = roles.find(r => r.name.toLowerCase() === role_name.toLowerCase());
    if (role) {
      role_id = role.id;
      // Warn if role's department doesn't match the resolved department
      if (department_id && role.department?.id && role.department.id !== department_id) {
        warnings.push(`Role "${role_name}" belongs to a different department than "${department_name}"`);
      }
    } else {
      warnings.push(`Role not found: "${role_name}" — leaving unassigned`);
    }
  }

  const row: ValidatedUserRow = {
    rowNumber,
    name,
    email,
    password,
    nickname:          norm.nickname      || undefined,
    personal_phone:    norm.personal_phone || undefined,
    office_phone:      norm.office_phone   || undefined,
    gender,
    address:           norm.address       || undefined,
    date_of_birth,
    joining_date,
    current_salary,
    guardian_name:     norm.guardian_name     || undefined,
    guardian_phone:    norm.guardian_phone    || undefined,
    guardian_relation: norm.guardian_relation || undefined,
    department_id,
    department_name:   department_name || undefined,
    role_id,
    role_name:         role_name || undefined,
    type:              userType,
    employment_status,
    account_status,
    valid:   errors.length === 0,
    errors,
    warnings,
  };

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// File parsers
// ─────────────────────────────────────────────────────────────────────────────

export async function parseUserFile(
  file: File,
  departments: Department[],
  roles: Role[],
  existingEmailsFromDB: string[], // pre-fetched from the server
): Promise<ValidatedUserRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  let rawRows: RawUserRow[] = [];

  if (extension === "csv") {
    rawRows = await new Promise<RawUserRow[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as RawUserRow[]),
        error: reject,
      });
    });
  } else if (extension === "xlsx" || extension === "xls") {
    rawRows = await new Promise<RawUserRow[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb   = XLSX.read(data, { type: "array" });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(ws) as RawUserRow[]);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error("Unsupported file format. Please upload CSV or Excel.");
  }

  // Track emails seen within this file to detect intra-file duplicates
  const seenEmails = new Set<string>(existingEmailsFromDB.map(e => e.toLowerCase()));
  const results: ValidatedUserRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const validated = validateUserRow(rawRows[i], i + 1, departments, roles, seenEmails);
    results.push(validated);
    // Add this email to seenEmails ONLY if it was reasonably set (not already errored on email)
    if (validated.email && !validated.errors.some(e => e.startsWith("Email already"))) {
      seenEmails.add(validated.email.toLowerCase());
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template downloads
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_ROWS = [
  [
    "John Doe",               // name
    "john.doe@example.com",   // email
    "SecurePass123",          // password
    "Johnny",                 // nickname
    "01712345678",            // personal_phone
    "01912345678",            // office_phone
    "Male",                   // gender
    "House 1, Road 2, Dhaka", // address
    "1990-01-15",             // date_of_birth
    "2024-03-01",             // joining_date
    "50000",                  // current_salary
    "Jane Doe",               // guardian_name
    "01511112222",            // guardian_phone
    "Mother",                 // guardian_relation
    "Sales",                  // department_name
    "Senior CRE",             // role_name
    "Operator",               // type
    "permanent",              // employment_status
    "active",                 // account_status
  ],
  [
    "Jane Smith",
    "jane.smith@example.com",
    "Password456",
    "",
    "01800000000",
    "",
    "Female",
    "",
    "1995-06-20",
    "",
    "",
    "",
    "",
    "",
    "Admin",
    "",
    "Manager",
    "trainee",
    "active",
  ],
];

export function generateUserCSVTemplate() {
  const headers = USER_IMPORT_COLUMNS.map(c => c.header).join(",");
  const rows    = SAMPLE_ROWS.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "user_import_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateUserXLSXTemplate() {
  const headers  = USER_IMPORT_COLUMNS.map(c => c.header);
  const sheetData = [headers, ...SAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users Import Template");
  XLSX.writeFile(wb, "user_import_template.xlsx");
}
