import { ImportHoursForm } from "@/components/admin/import-hours-form";
import { listEmployees } from "@/lib/queries";

export default async function AdminImportPage() {
  const employees = await listEmployees();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Import d&apos;heures historiques</h1>
        <p className="text-sm text-slate-500">Importer en masse d&apos;anciennes heures de travail depuis un fichier CSV ou Excel.</p>
      </div>
      <ImportHoursForm employees={employees.map((e) => ({ id: e.id, full_name: e.full_name, email: e.email }))} />
    </div>
  );
}
