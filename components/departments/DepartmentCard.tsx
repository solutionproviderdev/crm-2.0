"use client";

import { Building2, Briefcase, ChevronRight, Trash2 } from "lucide-react";
import type { Department } from "@/lib/types";

interface Props {
  department: Department & { roleCount?: number };
  onDelete?: (id: string) => void;
}

const DEPARTMENT_COLORS: Record<string, string> = {
  Administration: "bg-purple-50 border-purple-100 text-purple-600",
  Sales:          "bg-blue-50   border-blue-100   text-blue-600",
  CRE:            "bg-teal-50   border-teal-100   text-teal-600",
  Operations:     "bg-orange-50 border-orange-100 text-orange-600",
};

function getDeptColor(name: string) {
  return DEPARTMENT_COLORS[name] ?? "bg-gray-50 border-gray-100 text-gray-600";
}

export function DepartmentCard({ department, onDelete }: Props) {
  const colorClass = getDeptColor(department.name);

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Color accent bar */}
      <div className={`h-1.5 w-full ${colorClass.split(" ")[0]} opacity-70`} />

      <div className="p-5">
        {/* Icon + name */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClass} shrink-0`}>
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {department.name}
            </h3>
            {department.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {department.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Briefcase className="h-3.5 w-3.5" />
          <span>
            {department.roleCount ?? 0}{" "}
            {(department.roleCount ?? 0) === 1 ? "role" : "roles"}
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">
            {new Date(department.created_at).toLocaleDateString("en-GB", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDelete && (
              <button
                onClick={() => onDelete(department.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete department"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
