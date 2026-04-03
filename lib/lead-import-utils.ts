import Papa from "papaparse";
import * as XLSX from "xlsx";
import { CreateLeadInput, User, LeadSource } from "./types";

export interface ParsedLeadRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
  mappedData?: CreateLeadInput;
}

export const LEAD_IMPORT_COLUMNS = [
  { header: "Name", key: "name", required: true },
  { header: "Phone", key: "phones", required: true, help: "Comma separated numbers" },
  { header: "Source", key: "source", required: true, help: "Facebook, WhatsApp, Website, Referral, Instagram, Phone" },
  { header: "Status", key: "status", required: false, help: "New, Interested, etc." },
  { header: "Division", key: "division", required: false },
  { header: "District", key: "district", required: false },
  { header: "Area", key: "area", required: false },
  { header: "Address", key: "address_detail", required: false },
  { header: "Requirements", key: "requirements", required: false, help: "Comma separated" },
  { header: "Sales Executive Email", key: "sales_email", required: false },
  { header: "CRE Email", key: "cre_email", required: false },
];

/**
 * Normalizes headers to match our internal keys
 */
export function normalizeHeader(header: string): string {
  const h = header.toLowerCase().trim().replace(/[\s_]+/g, "");
  if (h.includes("name")) return "name";
  if (h.includes("phone")) return "phones";
  if (h.includes("source")) return "source";
  if (h.includes("status")) return "status";
  if (h.includes("division")) return "division";
  if (h.includes("district")) return "district";
  if (h.includes("area")) return "area";
  if (h.includes("address")) return "address_detail";
  if (h.includes("requirement")) return "requirements";
  if (h.includes("salesemail") || h.includes("salesexecutive")) return "sales_email";
  if (h.includes("creemail") || h.includes("cre")) return "cre_email";
  return header;
}

/**
 * Validates a single row of lead data
 */
export function validateLeadRow(
  row: Record<string, string>,
  rowNumber: number,
  users: User[]
): ParsedLeadRow {
  const errors: string[] = [];
  const normalizedData: Record<string, string> = {};

  // Normalize headers
  Object.keys(row).forEach((key) => {
    normalizedData[normalizeHeader(key)] = String(row[key] || "").trim();
  });

  // Check required fields
  if (!normalizedData.name) errors.push("Name is required");
  if (!normalizedData.phones) errors.push("At least one phone number is required");
  if (!normalizedData.source) errors.push("Source is required");

  // Validate Source
  const allowedSources: LeadSource[] = ["Facebook", "WhatsApp", "Website", "Referral", "Instagram", "Phone"];
  const rawSource = normalizedData.source;
  const matchedSource = allowedSources.find(
    (s) => s.toLowerCase() === rawSource.toLowerCase()
  );

  if (rawSource && !matchedSource) {
    errors.push(`Invalid source: ${rawSource}. Must be one of: ${allowedSources.join(", ")}`);
  }

  // Map to CreateLeadInput
  const phones = normalizedData.phones
    ? normalizedData.phones.split(/[,;|]+/).map(p => p.trim()).filter(Boolean)
    : [];
  
  if (phones.length === 0 && normalizedData.phones) {
    errors.push("Invalid phone format");
  }

  const requirements = normalizedData.requirements
    ? normalizedData.requirements.split(/[,;|]+/).map(r => r.trim()).filter(Boolean)
    : [];

  // Find User IDs by Email
  let sales_executive_id: string | null = null;
  if (normalizedData.sales_email) {
    const user = users.find(u => u.email.toLowerCase() === normalizedData.sales_email.toLowerCase());
    if (user) sales_executive_id = user.id;
    else errors.push(`Sales Executive not found with email: ${normalizedData.sales_email}`);
  }

  let cre_id: string | null = null;
  if (normalizedData.cre_email) {
    const user = users.find(u => u.email.toLowerCase() === normalizedData.cre_email.toLowerCase());
    if (user) cre_id = user.id;
    else errors.push(`CRE not found with email: ${normalizedData.cre_email}`);
  }

  const mappedData: CreateLeadInput = {
    name: normalizedData.name,
    source: (matchedSource || "Facebook") as LeadSource,
    phones,
    status: normalizedData.status || "New",
    address: {
      division: normalizedData.division,
      district: normalizedData.district,
      area: normalizedData.area,
      address: normalizedData.address_detail,
    },
    requirements,
    sales_executive_id,
    cre_id,
  };

  return {
    rowNumber,
    data: normalizedData,
    errors,
    isValid: errors.length === 0,
    mappedData: errors.length === 0 ? mappedData : undefined,
  };
}

/**
 * Parses a CSV file
 */
export async function parseCSV(file: File, users: User[]): Promise<ParsedLeadRow[]> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const parsed = rows.map((row, index) => validateLeadRow(row, index + 1, users));
        resolve(parsed);
      },
    });
  });
}

/**
 * Parses an Excel file
 */
export async function parseExcel(file: File, users: User[]): Promise<ParsedLeadRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];
        const parsed = rows.map((row, index) => validateLeadRow(row, index + 1, users));
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a sample CSV template
 */
export function downloadSampleCSV() {
  const headers = LEAD_IMPORT_COLUMNS.map(c => c.header).join(",");
  const example = [
    "John Doe",
    "\"01712345678, 01812345678\"",
    "Facebook",
    "New",
    "Dhaka",
    "Dhaka",
    "Gulshan",
    "\"House 1, Road 1\"",
    "\"Kitchen Cabinet, Wardrobe\"",
    "sales@example.com",
    "cre@example.com"
  ].join(",");
  
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${example}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "lead_import_sample.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads a sample XLSX template
 */
export function downloadSampleXLSX() {
  const headers = LEAD_IMPORT_COLUMNS.map(c => c.header);
  const exampleData = [
    headers,
    [
      "John Doe",
      "01712345678, 01812345678",
      "Facebook",
      "New",
      "Dhaka",
      "Dhaka",
      "Gulshan",
      "House 1, Road 1",
      "Kitchen Cabinet, Wardrobe",
      "sales@example.com",
      "cre@example.com"
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(exampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads Import Template");
  XLSX.writeFile(wb, "lead_import_sample.xlsx");
}
