import { ImportHoursForm } from "@/components/admin/import-hours-form";
import { listEmployees, listImportedEntries } from "@/lib/queries";
import { DAY_TYPE_LABELS } from "@/lib/constants";
import { sumHours } from "@/lib/hours";
import { formatHours } from "@/lib/utils";

export default async function AdminImportPage() {
  const employees = await listEmployees();
  const importedEntries = await listImportedEntries();

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Import d&apos;heures historiques</h1>
        <p className="text-sm text-slate-500">Importer en masse d&apos;anciennes heures de travail depuis un fichier CSV ou Excel.</p>
      </div>
      <ImportHoursForm employees={employees.map((e) => ({ id: e.id, full_name: e.full_name, email: e.email }))} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Données importées</h2>
          <p className="text-sm text-slate-500">
            {importedEntries.length} jour(s) importé(s) — total{" "}
            <span className="font-medium text-slate-900">{formatHours(sumHours(importedEntries))}</span> ajoutées
            (cumul avec les heures déjà pointées le même jour).
          </p>
        </div>

        {importedEntries.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune donnée importée pour le moment.</p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left">Employé</th>
                  <th className="px-2 py-2 text-left">Date</th>
                  <th className="px-2 py-2 text-left">Type</th>
                  <th className="px-2 py-2 text-left">Début</th>
                  <th className="px-2 py-2 text-left">Fin</th>
                  <th className="px-2 py-2 text-left">Pause</th>
                  <th className="px-2 py-2 text-left">Heures</th>
                  <th className="px-2 py-2 text-left">Tâches</th>
                  <th className="px-2 py-2 text-left">Remarques</th>
                </tr>
              </thead>
              <tbody>
                {importedEntries.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">
                      <div className="font-medium text-slate-800">{e.full_name}</div>
                      <div className="text-xs text-slate-400">{e.email}</div>
                    </td>
                    <td className="px-2 py-1.5">{e.entry_date}</td>
                    <td className="px-2 py-1.5">{DAY_TYPE_LABELS[e.day_type] ?? e.day_type}</td>
                    <td className="px-2 py-1.5">{e.start_time ?? "—"}</td>
                    <td className="px-2 py-1.5">{e.end_time ?? "—"}</td>
                    <td className="px-2 py-1.5">{e.break_minutes} min</td>
                    <td className="px-2 py-1.5 font-medium text-slate-900">{formatHours(e.hours)}</td>
                    <td className="px-2 py-1.5 text-slate-500 max-w-[200px] truncate" title={e.tasks ?? ""}>
                      {e.tasks || "—"}
                    </td>
                    <td className="px-2 py-1.5 text-slate-500 max-w-[200px] truncate" title={e.remarks ?? ""}>
                      {e.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
