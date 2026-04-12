"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Search,
  ChevronDown,
} from "lucide-react";
import type { Employee, AccountStatusValue } from "@/types/employee";
import { updateEmployeeStatuses } from "@/lib/supabase/employees";
import { getEmploymentStatusLabel, getAccountStatusLabel, ACCOUNT_STATUSES } from "@/constants/employeeStatus";

interface Props {
  employees: Employee[];
  departments: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  isAdmin?: boolean;
}

const GENDER_LABELS: Record<string, { label: string; color: string }> = {
  Male:   { label: "Male",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  Female: { label: "Female", color: "bg-pink-50 text-pink-700 border-pink-200" },
  Other:  { label: "Other",  color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-700 border-gray-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  locked: "bg-red-100 text-red-700 border-red-200",
  archived: "bg-slate-200 text-slate-800 border-slate-300",
};

export function EmployeeTable({ employees: initialEmployees, departments, roles, isAdmin = false }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [accStatusFilter, setAccStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = employees.filter((emp) => {
    const matchSearch =
      !search ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = accStatusFilter === "all" || emp.account_status === accStatusFilter;
    const matchGender = genderFilter === "all" || emp.gender === genderFilter;
    const matchDept = deptFilter === "all" || emp.department_id === deptFilter;
    const matchRole = roleFilter === "all" || emp.role_id === roleFilter;
    return matchSearch && matchStatus && matchGender && matchDept && matchRole;
  });

  async function handleStatusChange(employee: Employee, newStatus: AccountStatusValue) {
    if (!isAdmin) return;
    setTogglingId(employee.id);
    const result = await updateEmployeeStatuses(employee.id, newStatus);
    if (result.success) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, account_status: newStatus } : e))
      );
    }
    setTogglingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition"
          />
        </div>

        <FilterSelect
          label="Account Status"
          value={accStatusFilter}
          onChange={setAccStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            ...ACCOUNT_STATUSES.map(s => ({ value: s.value, label: s.label }))
          ]}
        />
        <FilterSelect
          label="Gender"
          value={genderFilter}
          onChange={setGenderFilter}
          options={[
            { value: "all", label: "All Gender" },
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Other", label: "Other" },
          ]}
        />
        <FilterSelect
          label="Department"
          value={deptFilter}
          onChange={setDeptFilter}
          options={[
            { value: "all", label: "All Departments" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <FilterSelect
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "all", label: "All Roles" },
            ...roles.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />

        {(search || accStatusFilter !== "all" || genderFilter !== "all" || deptFilter !== "all" || roleFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setAccStatusFilter("all"); setGenderFilter("all"); setDeptFilter("all"); setRoleFilter("all"); }}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-md hover:bg-red-50"
          >
            Reset
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Name", "Email", "Department", "Role", "Employment", "Account"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No employees found
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/users/${emp.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="relative shrink-0 flex items-center">
                          {emp.profile_picture ? (
                            <img
                              src={emp.profile_picture}
                              alt={emp.name}
                              className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] font-semibold text-xs ring-2 ring-white shadow-sm">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                              emp.account_status === "active" ? "bg-emerald-400" : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-[var(--brand-primary)] transition-colors">
                            {emp.name}
                          </p>
                        </div>
                      </Link>
                    </td>

                    <td className="px-3 py-2 text-gray-600 text-xs">{emp.email}</td>

                    <td className="px-3 py-2 text-gray-600 text-xs">
                      {emp.department?.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-xs">
                      {emp.role?.name || "—"}
                    </td>

                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium capitalize">
                        {getEmploymentStatusLabel(emp.employment_status)}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      {isAdmin ? (
                        <div className="relative">
                          <select
                            value={emp.account_status}
                            onChange={(e) => handleStatusChange(emp, e.target.value as AccountStatusValue)}
                            disabled={togglingId === emp.id}
                            className={`appearance-none focus:ring-2 focus:ring-emerald-500 focus:outline-none pl-2 pr-6 py-1 rounded text-xs font-semibold border transition ${
                              togglingId === emp.id ? 'opacity-50' : 'cursor-pointer'
                            } ${ACCOUNT_STATUS_COLORS[emp.account_status] || ACCOUNT_STATUS_COLORS.inactive}`}
                          >
                            {ACCOUNT_STATUSES.map(s => (
                              <option key={s.value} value={s.value} className="bg-white text-gray-900">
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                        </div>
                      ) : (
                        <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium capitalize ${ACCOUNT_STATUS_COLORS[emp.account_status] || ACCOUNT_STATUS_COLORS.inactive}`}>
                          {getAccountStatusLabel(emp.account_status)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400">
          <span>
            Showing <strong className="text-gray-700">{filtered.length}</strong>{" "}
            of <strong className="text-gray-700">{employees.length}</strong> employees
          </span>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none pl-3 pr-7 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 transition cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
    </div>
  );
}
