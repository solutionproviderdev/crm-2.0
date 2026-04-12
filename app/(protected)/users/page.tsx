import Link from "next/link";
import { Plus } from "lucide-react";
import { getUsers } from "@/app/actions/users";
import { getDepartments } from "@/app/actions/departments";
import { getRoles } from "@/app/actions/roles";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { getEmployees } from "@/lib/supabase/employees";
import { getCurrentUser } from "@/app/actions/auth";
import { BatchUserImportDialog } from "@/components/users/BatchUserImportDialog";

export const metadata = {
  title: "All Users | EaseIT CRM",
};

export default async function UsersPage() {
  const [usersResult, deptsResult, rolesResult, currentUser] = await Promise.all([
    getEmployees(),
    getDepartments(),
    getRoles(),
    getCurrentUser(),
  ]);

  const users   = usersResult.success  ? usersResult.data  : [];
  const depts   = deptsResult.success  ? deptsResult.data  : [];
  const roles   = rolesResult.success  ? rolesResult.data  : [];
  const isAdmin = currentUser?.type === "Admin";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage team members, their roles and access
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && <BatchUserImportDialog />}
          <Link
            href="/users/new"
            id="create-user-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold shadow-lg shadow-[var(--brand-primary)]/20 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </div>
      </div>

      {!usersResult.success ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {usersResult.error}
        </div>
      ) : (
        <EmployeeTable
          employees={users as any}
          departments={depts.map((d) => ({ id: d.id, name: d.name }))}
          roles={roles.map((r) => ({ id: r.id, name: r.name }))}
        />
      )}
    </div>
  );
}
