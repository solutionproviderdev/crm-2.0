"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  MoreVertical,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import type { User } from "@/lib/types";
import { updateUserStatus } from "@/app/actions/users";

interface Props {
  users: User[];
  departments: { id: string; name: string }[];
  roles: { id: string; name: string }[];
}

const GENDER_ICONS: Record<string, string> = {
  Male: "♂",
  Female: "♀",
  Other: "⚥",
};

export function UserTable({ users: initialUsers, departments, roles }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    const matchGender = genderFilter === "all" || u.gender === genderFilter;
    const matchDept = deptFilter === "all" || u.department_id === deptFilter;
    const matchRole = roleFilter === "all" || u.role_id === roleFilter;
    return matchSearch && matchStatus && matchGender && matchDept && matchRole;
  });

  async function handleToggleStatus(user: User) {
    setTogglingId(user.id);
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    const result = await updateUserStatus(user.id, newStatus);
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    }
    setTogglingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filters bar ──────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#006080] focus:ring-2 focus:ring-[#006080]/10 transition"
          />
        </div>

        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
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

        {(search || statusFilter !== "all" || genderFilter !== "all" || deptFilter !== "all" || roleFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setGenderFilter("all"); setDeptFilter("all"); setRoleFilter("all"); }}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-md hover:bg-red-50"
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Name", "Email", "Phone", "Gender", "Department", "Role", "Type", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
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
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${user.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="relative">
                          {user.profile_picture ? (
                            <img
                              src={user.profile_picture}
                              alt={user.name}
                              className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-[#006080]/10 flex items-center justify-center text-[#006080] font-semibold text-sm ring-2 ring-white shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                              user.status === "Active"
                                ? "bg-emerald-400"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-[#006080] transition-colors">
                            {user.name}
                          </p>
                          {user.nickname && (
                            <p className="text-xs text-gray-400">{user.nickname}</p>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {user.personal_phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg" title={user.gender || ""}>
                        {user.gender ? GENDER_ICONS[user.gender] : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {user.department?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {user.role?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {user.type === "Admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#006080]/10 text-[#006080] border border-[#006080]/20">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Operator
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={togglingId === user.id}
                        className="group relative"
                        aria-label={`Toggle ${user.name} status`}
                      >
                        <div
                          className={`w-10 h-5.5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
                            user.status === "Active"
                              ? "bg-emerald-400"
                              : "bg-gray-300"
                          } ${togglingId === user.id ? "opacity-50" : ""}`}
                          style={{ height: "1.375rem" }}
                        >
                          <div
                            className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                              user.status === "Active"
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                        </div>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400">
          <span>
            Showing <strong className="text-gray-700">{filtered.length}</strong>{" "}
            of <strong className="text-gray-700">{users.length}</strong> users
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
        className="appearance-none pl-3 pr-7 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-[#006080] focus:ring-2 focus:ring-[#006080]/10 transition cursor-pointer"
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
