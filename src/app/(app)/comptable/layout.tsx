import { requireComptable } from "@/lib/session";

export default async function ComptableLayout({ children }: { children: React.ReactNode }) {
  await requireComptable();
  return <>{children}</>;
}
