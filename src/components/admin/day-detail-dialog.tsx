"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { setCompanyDayType } from "@/lib/actions/calendar";
import { DAY_TYPE_LABELS, DAY_TYPE_COLORS, employeeColor } from "@/lib/constants";
import { DayType, WorkMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface EmployeeDayStatus {
  profile_id: string;
  full_name: string;
  day_type: DayType;
  work_mode: WorkMode;
  hours: number;
}

interface DayDetailDialogProps {
  date: string | null;
  statuses: EmployeeDayStatus[];
  currentCompanyType: DayType | null;
  onClose: () => void;
}

const WORK_MODE_LABELS: Record<string, string> = {
  presentiel: "Présentiel",
  teletravail: "Télétravail",
};

/** Affiche, pour la date sélectionnée, le statut de TOUS les employés (congé,
 * maladie, présentiel, télétravail, férié, repos, ou non renseigné), et
 * permet à l'admin de fixer le type de journée pour toute l'équipe. */
export function DayDetailDialog({ date, statuses, currentCompanyType, onClose }: DayDetailDialogProps) {
  const router = useRouter();
  const [value, setValue] = React.useState<string>(currentCompanyType ?? "none");
  const [pending, setPending] = React.useState(false);
  const [prevDate, setPrevDate] = React.useState(date);

  if (date !== prevDate) {
    setPrevDate(date);
    setValue(currentCompanyType ?? "none");
  }

  const fmtDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  async function handleSave() {
    if (!date) return;
    setPending(true);
    await setCompanyDayType(date, value === "none" ? null : (value as DayType));
    setPending(false);
    router.refresh();
    onClose();
  }

  const sorted = [...statuses].sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <Dialog open={!!date} onClose={onClose} title={fmtDate} className="max-w-xl">
      <div className="space-y-4">
        <ul className="space-y-1.5 max-h-72 overflow-y-auto">
          {sorted.map((s, i) => (
            <li
              key={s.profile_id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
            >
              <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm font-medium", employeeColor(i))}>
                {s.full_name}
              </span>
              <span className="flex items-center gap-2">
                {s.day_type === "normal" && s.work_mode && (
                  <span className="text-xs text-slate-500">{WORK_MODE_LABELS[s.work_mode]}</span>
                )}
                {s.hours > 0 && <span className="text-xs text-slate-400">{s.hours}h</span>}
                <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", DAY_TYPE_COLORS[s.day_type])}>
                  {s.day_type === "normal" && !s.work_mode ? "Non renseigné" : DAY_TYPE_LABELS[s.day_type]}
                </span>
              </span>
            </li>
          ))}
          {sorted.length === 0 && (
            <li className="text-sm text-slate-500 text-center py-4">Aucun employé actif.</li>
          )}
        </ul>

        <div className="border-t border-slate-200 pt-4 space-y-1.5">
          <Label htmlFor="holiday-type">Fixer le type de journée pour toute l&apos;équipe</Label>
          <Select id="holiday-type" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="none">Jour normal (aucun)</option>
            <option value="ferie_paye">Férié payé</option>
            <option value="ferie_non_paye">Férié non payé</option>
            <option value="repos">Repos</option>
          </Select>
          <p className="text-xs text-slate-500">
            Ceci applique le type choisi à tous les employés pour cette date. Les congés/maladies individuels ne
            sont pas affectés.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Fermer
          </Button>
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? "Enregistrement..." : "Appliquer à l'équipe"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
