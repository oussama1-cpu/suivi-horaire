"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntryDialog } from "@/components/entries/entry-dialog";
import { DAY_TYPE_LABELS, DAY_TYPE_COLORS, WEEKDAY_NAMES_FR } from "@/lib/constants";
import { formatHours } from "@/lib/utils";
import { NON_WORKING_DAY_TYPES } from "@/lib/hours";
import { TimeEntry } from "@/lib/types";

interface EntriesTableProps {
  profileId: string;
  monthDates: string[]; // all YYYY-MM-DD strings of the month
  entriesByDate: Record<string, TimeEntry>;
  readOnly?: boolean;
}

export function EntriesTable({ profileId, monthDates, entriesByDate, readOnly }: EntriesTableProps) {
  const [dialogDate, setDialogDate] = React.useState<string | null>(null);

  const openEntry = dialogDate ? entriesByDate[dialogDate] ?? null : null;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <th className="px-4 py-3">Jour</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Début</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Pause</th>
              <th className="px-4 py-3">Heures</th>
              <th className="px-4 py-3">Tâches</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {monthDates.map((date) => {
              const entry = entriesByDate[date];
              const weekday = new Date(date + "T00:00:00").getDay();
              const isWeekend = weekday === 0;
              return (
                <tr
                  key={date}
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${isWeekend ? "bg-slate-50/50" : ""}`}
                >
                  <td className="px-4 py-2.5 text-slate-500">{WEEKDAY_NAMES_FR[weekday]}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={DAY_TYPE_COLORS[entry?.day_type ?? "normal"]}>
                        {DAY_TYPE_LABELS[entry?.day_type ?? "normal"]}
                      </Badge>
                      {entry?.start_time && entry.work_mode === "teletravail" && (
                        <Badge className="bg-teal-100 text-teal-700">Télétravail</Badge>
                      )}
                      {entry && NON_WORKING_DAY_TYPES.includes(entry.day_type) && entry.start_time && entry.end_time && (
                        <Badge className="bg-green-100 text-green-700">Travaillé</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{entry?.start_time?.slice(0, 5) ?? "-"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{entry?.end_time?.slice(0, 5) ?? "-"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{entry ? `${entry.break_minutes}min` : "-"}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {entry ? formatHours(entry.hours) : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-[220px] truncate" title={entry?.tasks ?? ""}>
                    {entry?.tasks || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!readOnly && (
                      <Button variant="ghost" size="icon" onClick={() => setDialogDate(date)}>
                        {entry ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dialogDate && (
        <EntryDialog
          open={!!dialogDate}
          onClose={() => setDialogDate(null)}
          profileId={profileId}
          date={dialogDate}
          existingEntry={openEntry}
        />
      )}
    </>
  );
}
