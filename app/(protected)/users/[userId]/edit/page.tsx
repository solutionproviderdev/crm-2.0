import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getEmployeeById } from "@/lib/supabase/employees";
import { getCurrentUser } from "@/app/actions/auth";
import { getDepartments } from "@/app/actions/departments";
import { getRoles } from "@/app/actions/roles";
import { EditEmployeeForm } from "@/components/employees/EditEmployeeForm";

interface Props {
  params: Promise<{ userId: string }>;
}

export const metadata = {
  title: "Edit Employee | EaseIT CRM",
};

export default async function EditEmployeePage({ params }: Props) {
  const { userId } = await params;
  
  const [employeeResult, currentUser, deptsResult, rolesResult] = await Promise.all([
    getEmployeeById(userId),
    getCurrentUser(),
    getDepartments(),
    getRoles(),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const isAdmin = currentUser?.type === "Admin";
  const depts = deptsResult.success ? deptsResult.data : [];
  const roles = rolesResult.success ? rolesResult.data : [];

  return (
    <Suspense fallback={<div className="animate-pulse p-8 bg-white rounded-2xl h-96">Loading...</div>}>
      <EditEmployeeForm 
        employee={employeeResult.data} 
        isAdmin={isAdmin} 
        departments={depts} 
        roles={roles} 
      />
    </Suspense>
  );
}
