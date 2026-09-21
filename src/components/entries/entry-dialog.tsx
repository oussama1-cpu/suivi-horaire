"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertEntry, deleteEntry } from "@/lib/actions/entries";
import { DAY_TYPE_LABELS } from "@/lib/constants";
import { NON_WORKING_DAY_TYPES } from "@/lib/hours";
import { DayType, TimeEntry, WorkMode } from "@/lib/types";

interface EntryDialogProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  date: string;
  existingEntry?: TimeEntry | null;
}

function defaultTimes(entry: TimeEntry | null | undefined): { start: string; end: string; brk: number } {
  if (entry) return { start: entry.start_time ?? "", end: entry.end_time ?? "", brk: entry.break_minutes };
  return { start: "08:00", end: "17:00", brk: 60 };
}

export function EntryDialog({ open, onClose, profileId, date, existingEntry }: EntryDialogProps) {
  const router = useRouter();
  const initial = defaultTimes(existingEntry);
  const [dayType, setDayType] = React.useState<DayType>(existingEntry?.day_type ?? "normal");
  const [workMode, setWorkMode] = React.useState<WorkMode>(existingEntry?.work_mode ?? "presentiel");
  const [startTime, setStartTime] = React.useState(initial.start);
  const [endTime, setEndTime] = React.useState(initial.end);
  const [breakMinutes, setBreakMinutes] = React.useState(initial.brk);
  const [tasks, setTasks] = React.useState(existingEntry?.tasks ?? "");
  const [remarks, setRemarks] = React.useState(existingEntry?.remarks ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [prevDate, setPrevDate] = React.useState(date);

  if (date !== prevDate) {
    setPrevDate(date);
    const t = defaultTimes(existingEntry);
    setDayType(existingEntry?.day_type ?? "normal");
    setWorkMode(existingEntry?.work_mode ?? "presentiel");
    setStartTime(t.start);
    setEndTime(t.end);
    setBreakMinutes(t.brk);
    setTasks(existingEntry?.tasks ?? "");
    setRemarks(existingEntry?.remarks ?? "");
    setError(null);
  }

  const isWorkDay = dayType === "normal";
  // Sur un jour férié / de repos, les heures sont optionnelles : renseignées = travaillées et payées.
  const isNonWorkingDay = NON_WORKING_DAY_TYPES.includes(dayType);
  const showTimes = isWorkDay || isNonWorkingDay;
  const hasTimes = isWorkDay || (!!startTime && !!endTime);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await upsertEntry({
      id: existingEntry?.id,
      profile_id: profileId,
      entry_date: date,
      day_type: dayType,
      work_mode: showTimes && hasTimes ? workMode : null,
      start_time: showTimes && hasTimes ? startTime : null,
      end_time: showTimes && hasTimes ? endTime : null,
      break_minutes: showTimes && hasTimes ? Number(breakMinutes) : 0,
      tasks,
      remarks,
    });

    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!existingEntry) return;
    setPending(true);
    await deleteEntry(existingEntry.id, profileId);
    setPending(false);
    router.refresh();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Journée du ${date}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="day_type">Type de journée</Label>
          <Select
            id="day_type"
            value={dayType}
            onChange={(e) => {
              const next = e.target.value as DayType;
              setDayType(next);
              if (NON_WORKING_DAY_TYPES.includes(next) && !existingEntry?.start_time) {
                setStartTime("");
                setEndTime("");
                setBreakMinutes(0);
              } else if (next === "normal" && (!startTime || !endTime)) {
                setStartTime("08:00");
                setEndTime("17:00");
                setBreakMinutes(60);
              }
            }}
          >
            {Object.entries(DAY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {showTimes && (
          <>
            {isNonWorkingDay && (
              <p className="text-xs text-purple-800 bg-purple-50 rounded-md px-3 py-2">
                Jour non travaillé. Laissez les heures vides si l&apos;employé n&apos;a pas travaillé ; sinon, renseignez
                début et fin : les heures effectuées seront comptées dans les heures payées.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="work_mode">Mode de travail</Label>
              <Select id="work_mode" value={workMode ?? "presentiel"} onChange={(e) => setWorkMode(e.target.value as WorkMode)}>
                <option value="presentiel">Présentiel</option>
                <option value="teletravail">Télétravail</option>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Début</Label>
                <Input id="start_time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time">Fin</Label>
                <Input id="end_time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="break_minutes">Pause (min)</Label>
                <Input
                  id="break_minutes"
                  type="number"
                  min={0}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="tasks">Tâches effectuées</Label>
          <Textarea id="tasks" value={tasks} onChange={(e) => setTasks(e.target.value)} rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="remarks">Remarques</Label>
          <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {existingEntry ? (
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
              Supprimer
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
