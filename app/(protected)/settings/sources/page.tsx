import { redirect } from "next/navigation";

export default function SourcesSettingsRedirectPage() {
  redirect("/settings/pipeline");
}
