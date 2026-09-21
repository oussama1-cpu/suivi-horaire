"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, MapPin, Video, Users, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeetingDialog } from "@/components/admin/meeting-dialog";
import { Meeting, Profile } from "@/lib/types";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MeetingsList({
  meetings,
  attendees,
  basePath,
  canCreate,
}: {
  meetings: Meeting[];
  attendees: Profile[];
  basePath: string;
  canCreate: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [now] = React.useState(() => Date.now());

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Réunions</h1>
          <p className="text-sm text-slate-500">Planification et compte-rendu des réunions d&apos;équipe.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle réunion
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {meetings.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Aucune réunion.</p>}
        {meetings.map((m) => {
          const isPast = new Date(m.start_at).getTime() < now;
          return (
            <Link
              key={m.id}
              href={`${basePath}/${m.id}`}
              className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-900">{m.title}</p>
                  {isPast && <Badge className="bg-slate-100 text-slate-500">Passée</Badge>}
                  {m.recurrence !== "none" && (
                    <Badge className="bg-violet-100 text-violet-700 inline-flex items-center gap-1">
                      <Repeat className="h-3 w-3" /> {m.recurrence === "weekly" ? "Hebdo" : "Mensuelle"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{fmt(m.start_at)}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {m.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {m.location}
                    </span>
                  )}
                  {m.meeting_link && (
                    <span className="inline-flex items-center gap-1">
                      <Video className="h-3 w-3" /> Visio
                    </span>
                  )}
                </div>
              </div>
              <Users className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
            </Link>
          );
        })}
      </div>

      {canCreate && <MeetingDialog open={open} onClose={() => setOpen(false)} attendees={attendees} />}
    </>
  );
}
