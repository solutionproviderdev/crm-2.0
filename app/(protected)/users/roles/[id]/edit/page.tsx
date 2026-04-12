import { notFound } from "next/navigation";
import { getRoleById } from "@/app/actions/roles";
import { getDepartments } from "@/app/actions/departments";
import { EditRoleForm } from "@/components/departments/EditRoleForm";

export const metadata = {
  title: "Edit Role | EaseIT CRM",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;
  
  const [roleResult, deptsResult] = await Promise.all([
    getRoleById(id),
    getDepartments(),
  ]);

  if (!roleResult.success || !roleResult.data) {
    notFound();
  }

  return (
    <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <EditRoleForm
        role={roleResult.data}
        departments={deptsResult.success ? deptsResult.data : []}
      />
    </div>
  );
}
