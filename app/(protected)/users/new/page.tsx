import { getDepartments } from "@/app/actions/departments";
import { getRoles } from "@/app/actions/roles";
import { AddEmployeeForm } from "@/components/employees/AddEmployeeForm";

export const metadata = {
  title: "Create User | EaseIT CRM",
};

export default async function NewUserPage() {
  const [deptsResult, rolesResult] = await Promise.all([
    getDepartments(),
    getRoles(),
  ]);

  return (
    <AddEmployeeForm
      departments={deptsResult.success ? deptsResult.data : []}
      roles={rolesResult.success ? rolesResult.data : []}
    />
  );
}
