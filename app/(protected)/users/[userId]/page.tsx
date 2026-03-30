import { notFound } from "next/navigation";
import { getUserById } from "@/app/actions/users";
import { UserProfileClient } from "@/components/users/UserProfileClient";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const result = await getUserById(userId);
  return {
    title: result.success
      ? `${result.data.name} | EaseIT CRM`
      : "User Profile | EaseIT CRM",
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;
  const result = await getUserById(userId);

  if (!result.success) notFound();

  return <UserProfileClient user={result.data} />;
}
