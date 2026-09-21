"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleTaskAction, deleteTaskAction } from "@/lib/actions/tasks";
import { EmployeeTask } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: EmployeeTask[];
  readOnly?: boolean;
  /** Affiche le nom de l'employé (vue admin multi-employés). */
  employeeNames?: Record<string, string>;
  emptyMessage?: string;
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

export function TaskList({ tasks, readOnly, employeeNames, emptyMessage = "Aucune tâche." }: TaskListProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function toggle(task: EmployeeTask) {
    setBusy(task.id);
    await toggleTaskAction(task.id, !task.done);
    setBusy(null);
    router.refresh();
  }

  async function remove(task: EmployeeTask) {
    setBusy(task.id);
    await deleteTaskAction(task.id);
    setBusy(null);
    router.refresh();
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
      {tasks.map((task) => (
        <div key={task.id} className={cn("flex items-start gap-3 px-4 py-3", task.done && "bg-slate-50/60")}>
          {readOnly ? (
            <span className="mt-0.5 text-slate-400">
              {task.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4" />}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => toggle(task)}
              disabled={busy === task.id}
              className="mt-0.5 text-slate-400 hover:text-[#545454] disabled:opacity-50"
              aria-label={task.done ? "Marquer comme à faire" : "Marquer comme terminée"}
            >
              {task.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4" />}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn("text-sm font-medium text-slate-900", task.done && "line-through text-slate-500")}>
                {task.title}
              </p>
              {task.is_innovation && (
                <Badge className="bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Innovation
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {formatDate(task.task_date)}
              {employeeNames && ` · ${employeeNames[task.profile_id] ?? "Employé"}`}
            </p>
            {task.description && <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{task.description}</p>}
          </div>

          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(task)}
              disabled={busy === task.id}
              aria-label="Supprimer la tâche"
            >
              <Trash2 className="h-4 w-4 text-slate-400" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
