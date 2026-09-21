import { WeekSummary } from "@/lib/hours";
import { formatHours, cn } from "@/lib/utils";

export function WeekSummaryTable({ weeks }: { weeks: WeekSummary[] }) {
  if (weeks.length === 0) {
    return <p className="text-sm text-slate-500">Aucune donnée pour cette période.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <th className="px-4 py-3">Semaine du</th>
            <th className="px-4 py-3">Heures travaillées</th>
            <th className="px-4 py-3">Objectif</th>
            <th className="px-4 py-3">Écart</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.weekStart} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2.5 font-medium text-slate-900">
                {new Date(w.weekStart + "T00:00:00").toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
              </td>
              <td className="px-4 py-2.5">{formatHours(w.totalHours)}</td>
              <td className="px-4 py-2.5 text-slate-500">{formatHours(w.targetHours)}</td>
              <td
                className={cn(
                  "px-4 py-2.5 font-medium",
                  w.diffHours >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {w.diffHours >= 0 ? "+" : ""}
                {formatHours(w.diffHours)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
