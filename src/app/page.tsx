import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";

export default async function Home() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "comptable") redirect("/comptable");
  redirect("/dashboard");
}
