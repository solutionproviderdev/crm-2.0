"use client";

import { useState, useTransition } from "react";
import { Plus, X, Building2, Loader2 } from "lucide-react";
import type { Department } from "@/lib/types";
import { DepartmentCard } from "@/components/departments/DepartmentCard";
import { createDepartment, deleteDepartment } from "@/app/actions/departments";

interface Props {
  initialDepartments: Department[];
  roleCounts: Record<string, number>;
}

export function DepartmentsClient({ initialDepartments, roleCounts: initialRoleCounts }: Props) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [roleCounts, setRoleCounts] = useState(initialRoleCounts);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Delete this department? All roles within it will lose their department link.")) return;
    startTransition(async () => {
      const result = await deleteDepartment(id);
      if (result.success) {
        setDepartments((prev) => prev.filter((d) => d.id !== id));
      }
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createDepartment({
        name:        fd.get("name") as string,
        description: fd.get("description") as string || undefined,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setDepartments((prev) => [...prev, result.data]);
        setRoleCounts((prev) => ({ ...prev, [result.data.id]: 0 }));
        setShowModal(false);
      }
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Organize your team into departments
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          id="create-dept-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold shadow-lg shadow-[var(--brand-primary)]/20 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> Create
        </button>
      </div>

      {/* Grid */}
      {departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-16 gap-3">
          <Building2 className="h-10 w-10 text-gray-300" />
          <p className="text-gray-400 text-sm">No departments yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-[var(--brand-primary)] font-medium hover:underline"
          >
            Create your first department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={{ ...dept, roleCount: roleCounts[dept.id] ?? 0 }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Department</h2>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="dept-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Department Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="dept-name"
                  name="name"
                  required
                  placeholder="e.g. Sales"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:bg-white transition"
                />
              </div>
              <div>
                <label htmlFor="dept-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  id="dept-desc"
                  name="description"
                  rows={3}
                  placeholder="A brief description of this department..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:bg-white transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-colors"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create Department
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
