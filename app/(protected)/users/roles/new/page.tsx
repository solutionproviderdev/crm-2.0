import { getDepartments } from "@/app/actions/departments";
import { CreateRoleForm } from "@/components/departments/CreateRoleForm";

export const metadata = {
  title: "Create Role | EaseIT CRM",
};

export default async function NewRolePage() {
  const deptsResult = await getDepartments();
  return (
    <CreateRoleForm
      departments={deptsResult.success ? deptsResult.data : []}
    />
  );
}
