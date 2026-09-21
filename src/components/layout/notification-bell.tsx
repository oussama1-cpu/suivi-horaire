"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { markMyNotificationsRead } from "@/lib/actions/notifications";
import { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString("fr-FR");
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleOpen() {
    setOpen(true);
    if (unreadCount > 0) {
      setPending(true);
      await markMyNotificationsRead();
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Notifications">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">Aucune notification pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id} className={cn("py-3 px-1", !n.read && "bg-blue-50/40")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{fmtRelative(n.created_at)}</span>
                </div>
                {n.body && <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line">{n.body}</p>}
              </li>
            ))}
          </ul>
        )}
        {pending && <p className="text-xs text-slate-400 text-center pt-2">Marquage en cours…</p>}
      </Dialog>
    </>
  );
}
