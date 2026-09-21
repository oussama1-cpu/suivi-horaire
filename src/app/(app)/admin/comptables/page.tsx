import { listComptables } from "@/lib/queries";
import { ComptablesTable } from "@/components/admin/comptables-table";

export default async function AdminComptablesPage() {
  const comptables = await listComptables();

  return (
    <div className="max-w-4xl">
      <ComptablesTable comptables={comptables} />
    </div>
  );
}
