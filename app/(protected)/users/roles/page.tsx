import { getRoles } from "@/app/actions/roles";
import { getDepartments } from "@/app/actions/departments";
import { RolesClient } from "@/components/departments/RolesClient";

export const metadata = {
  title: "Roles | EaseIT CRM",
};

export default async function RolesPage() {
  const [rolesResult, deptsResult] = await Promise.all([
    getRoles(),
    getDepartments(),
  ]);

  return (
    <RolesClient
      initialRoles={rolesResult.success ? rolesResult.data : []}
      departments={deptsResult.success ? deptsResult.data : []}
    />
  );
}
