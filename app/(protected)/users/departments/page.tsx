import { getDepartments } from "@/app/actions/departments";
import { getRoles } from "@/app/actions/roles";
import { DepartmentsClient } from "@/components/departments/DepartmentsClient";

export const metadata = {
  title: "Departments | EaseIT CRM",
};

export default async function DepartmentsPage() {
  const [deptsResult, rolesResult] = await Promise.all([
    getDepartments(),
    getRoles(),
  ]);

  const departments = deptsResult.success ? deptsResult.data : [];
  const roles       = rolesResult.success ? rolesResult.data : [];

  // Build role counts per department
  const roleCounts: Record<string, number> = {};
  for (const dept of departments) {
    roleCounts[dept.id] = roles.filter((r) => r.department_id === dept.id).length;
  }

  return (
    <DepartmentsClient
      initialDepartments={departments}
      roleCounts={roleCounts}
    />
  );
}
