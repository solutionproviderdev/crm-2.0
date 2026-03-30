"use client";

import Link from "next/link";
import { ShieldCheck, Building2, Trash2, Edit2 } from "lucide-react";
import type { Role } from "@/lib/types";
import { ALL_PERMISSIONS } from "@/lib/permissions";

interface Props {
  role: Role;
  onDelete?: (id: string) => void;
}

function countTotalEnabled(role: Role): number {
  return ALL_PERMISSIONS.reduce((acc, { resource, actions }) => {
    const count = actions.filter(
      (a) => role.permissions[resource]?.[a] === true
    ).length;
    return acc + count;
  }, 0);
}

function totalPossible(): number {
  return ALL_PERMISSIONS.reduce((acc, { actions }) => acc + actions.length, 0);
}

export function RoleCard({ role, onDelete }: Props) {
  const enabledCount = countTotalEnabled(role);
  const total = totalPossible();
  const pct = Math.round((enabledCount / total) * 100);

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="h-1.5 w-full bg-[#006080]/30" style={{ background: `linear-gradient(90deg, #006080 ${pct}%, #e5e7eb ${pct}%)` }} />

      <div className="p-5">
        {/* Icon + name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006080]/10 text-[#006080] border border-[#006080]/15 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {role.name}
            </h3>
            {role.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {role.description}
              </p>
            )}
          </div>
        </div>

        {/* Dept badge */}
        {role.department && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <Building2 className="h-3 w-3" />
            {role.department.name}
          </div>
        )}

        {/* Permissions summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Permissions</span>
            <span className="font-medium text-gray-700">
              {enabledCount}/{total} allowed
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#006080] rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/users/roles/${role.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006080]/10 text-[#006080] text-xs font-medium hover:bg-[#006080]/20 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(role.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
