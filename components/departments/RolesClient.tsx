"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, ChevronDown, Shield } from "lucide-react";
import type { Department, Role } from "@/lib/types";
import { RoleCard } from "@/components/departments/RoleCard";
import { deleteRole } from "@/app/actions/roles";

interface Props {
  initialRoles: Role[];
  departments: Department[];
}

export function RolesClient({ initialRoles, departments }: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [deptFilter, setDeptFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered =
    deptFilter === "all"
      ? roles
      : roles.filter((r) => r.department_id === deptFilter);

  function handleDelete(id: string) {
    if (!confirm("Delete this role? Users assigned to it will lose their role.")) return;
    startTransition(async () => {
      const result = await deleteRole(id);
      if (result.success) setRoles((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define roles and their page permissions
          </p>
        </div>
        <Link
          href="/users/roles/new"
          id="create-role-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006080] text-white text-sm font-semibold shadow-lg shadow-[#006080]/20 hover:bg-[#005070] hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> + Create
        </Link>
      </div>

      {/* Department filter */}
      <div className="mb-4 relative inline-block">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:border-[#006080] focus:ring-2 focus:ring-[#006080]/10 transition cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-16 gap-3">
          <Shield className="h-10 w-10 text-gray-300" />
          <p className="text-gray-400 text-sm">No roles found</p>
          <Link
            href="/users/roles/new"
            className="text-sm text-[#006080] font-medium hover:underline"
          >
            Create your first role
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((role) => (
            <RoleCard key={role.id} role={role} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  );
}
