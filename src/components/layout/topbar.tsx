"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { AppNotification } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  employee: "Employé",
  admin: "Admin",
  comptable: "Comptable",
};

export function Topbar({
  fullName,
  functionTitle,
  role,
  notifications,
  unreadCount,
}: {
  fullName: string;
  functionTitle: string | null;
  role: string;
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4 md:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Image
          src="/logo.png"
          alt="ELENI"
          width={93}
          height={32}
          className="object-contain md:hidden shrink-0"
        />
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#b0abaa] to-[#736d6c] text-xs font-semibold text-white shadow-sm shadow-[#545454]/20 sm:flex">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <p className="max-w-[150px] truncate text-sm font-medium leading-tight text-slate-900 sm:max-w-[220px] md:max-w-none">
            {fullName}
          </p>
          <div className="flex items-center gap-1.5">
            {functionTitle && (
              <p className="max-w-[120px] truncate text-xs text-slate-500 sm:max-w-[180px]">
                {functionTitle}
              </p>
            )}
            <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
