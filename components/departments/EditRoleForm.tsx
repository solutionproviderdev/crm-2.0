"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import type { Department, Role } from "@/lib/types";
import type { PermissionMap } from "@/lib/permissions";
import { PermissionTogglePanel } from "@/components/users/PermissionTogglePanel";
import { updateRole } from "@/app/actions/roles";

interface Props {
  role: Role;
  departments: Department[];
}

export function EditRoleForm({ role, departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>(role.permissions as PermissionMap || {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const departmentId = fd.get("department_id") as string;
    const roleName     = fd.get("name") as string;

    if (!roleName || !departmentId) {
      setError("Role name and department are required");
      return;
    }

    startTransition(async () => {
      const result = await updateRole(role.id, {
        name:          roleName,
        department_id: departmentId,
        description:   fd.get("description") as string || undefined,
        permissions,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        router.push("/users/roles");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Modify role details and access permissions
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm flex items-start gap-2">
          <span className="text-red-400 mt-0.5">⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Role Details card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#006080]/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-[#006080]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Role Details</h2>
              <p className="text-xs text-gray-400">Basic information about this role</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Role Name <span className="text-red-400">*</span>
              </label>
              <input
                id="role-name"
                name="name"
                required
                defaultValue={role.name}
                placeholder="e.g. Senior CRE"
                className="role-field"
              />
            </div>

            <div>
              <label htmlFor="role-dept" className="block text-sm font-medium text-gray-700 mb-1.5">
                Department <span className="text-red-400">*</span>
              </label>
              <select id="role-dept" name="department_id" required defaultValue={role.department_id} className="role-field">
                <option value="">— Select department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="role-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                id="role-desc"
                name="description"
                rows={2}
                defaultValue={role.description || ""}
                placeholder="Brief description of this role's responsibilities..."
                className="role-field resize-none"
              />
            </div>
          </div>
        </div>

        {/* Permissions card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Set Permissions</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Toggle which pages and actions this role can access. Users assigned this role
              will only see the routes you enable here.
            </p>
          </div>
          <div className="p-6">
            <PermissionTogglePanel
              permissions={permissions}
              onChange={setPermissions}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            id="edit-role-submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#006080] text-white font-semibold text-sm shadow-lg shadow-[#006080]/20 hover:bg-[#005070] disabled:opacity-60 transition-all"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              "Save Details"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        .role-field {
          display: block; width: 100%; padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb; border-radius: 0.625rem; font-size: 0.875rem;
          background: #f9fafb; color: #111827; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .role-field:focus {
          border-color: #006080; background: #fff;
          box-shadow: 0 0 0 3px rgba(0,96,128,0.08);
        }
        .role-field::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  );
}
