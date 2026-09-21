"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveLeaveRequest, rejectLeaveRequest, cancelMyLeaveRequest } from "@/lib/actions/leave-requests";
import {
  DAY_TYPE_COLORS,
  LEAVE_TYPE_LABELS,
  LEAVE_REQUEST_STATUS_COLORS,
  LEAVE_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import { LeaveRequest } from "@/lib/types";

interface LeaveRequestListProps {
  requests: LeaveRequest[];
  /** "employee" : peut annuler ses demandes en attente. "admin" : peut accepter/refuser. */
  mode: "employee" | "admin";
  employeeNames?: Record<string, string>;
  emptyMessage?: string;
}

function fmt(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function countDays(start: string, end: string) {
  const ms = new Date(end + "T00:00:00").getTime() - new Date(start + "T00:00:00").getTime();
  return Math.round(ms / 86400000) + 1;
}

export function LeaveRequestList({ requests, mode, employeeNames, emptyMessage = "Aucune demande." }: LeaveRequestListProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  async function run(id: string, action: () => Promise<{ error?: string }>) {
    setBusy(id);
    setError(null);
    const res = await action();
    setBusy(null);
    if (res?.error) setError(res.error);
    router.refresh();
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {requests.map((r) => {
          const days = countDays(r.start_date, r.end_date);
          const isPending = r.status === "pending";
          return (
            <div key={r.id} className="px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {employeeNames && (
                      <span className="text-sm font-medium text-slate-900">{employeeNames[r.profile_id] ?? "Employé"}</span>
                    )}
                    <Badge className={DAY_TYPE_COLORS[r.leave_type]}>{LEAVE_TYPE_LABELS[r.leave_type]}</Badge>
                    <Badge className={LEAVE_REQUEST_STATUS_COLORS[r.status]}>{LEAVE_REQUEST_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    {r.start_date === r.end_date ? fmt(r.start_date) : `${fmt(r.start_date)} → ${fmt(r.end_date)}`}
                    <span className="text-slate-400"> · {days} jour{days > 1 ? "s" : ""}</span>
                  </p>
                  {r.comment && <p className="text-xs text-slate-500 mt-0.5">Motif : {r.comment}</p>}
                  {r.admin_comment && <p className="text-xs text-slate-500 mt-0.5">Réponse RH : {r.admin_comment}</p>}
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Demandé le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    {r.decided_at && ` · traité le ${new Date(r.decided_at).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>

                {mode === "employee" && isPending && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === r.id}
                    onClick={() => run(r.id, () => cancelMyLeaveRequest(r.id))}
                  >
                    <Trash2 className="h-4 w-4" /> Annuler
                  </Button>
                )}
              </div>

              {mode === "admin" && isPending && (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <Input
                    placeholder="Commentaire (optionnel)"
                    value={comments[r.id] ?? ""}
                    onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))}
                    className="sm:max-w-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={busy === r.id}
                      onClick={() => run(r.id, () => approveLeaveRequest(r.id, comments[r.id] ?? ""))}
                    >
                      <Check className="h-4 w-4" /> Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy === r.id}
                      onClick={() => run(r.id, () => rejectLeaveRequest(r.id, comments[r.id] ?? ""))}
                    >
                      <X className="h-4 w-4" /> Refuser
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
