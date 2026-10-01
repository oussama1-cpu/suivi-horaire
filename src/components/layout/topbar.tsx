"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { AppNotification } from "@/lib/types";

export function Topbar({
  fullName,
  functionTitle,
  notifications,
  unreadCount,
}: {
  fullName: string;
  functionTitle: string | null;
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
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 print:hidden">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="ELENI"
          width={93}
          height={32}
          className="object-contain md:hidden"
        />
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#b0abaa] to-[#736d6c] text-white text-xs font-semibold flex items-center justify-center shadow-sm shadow-[#545454]/20 hidden sm:flex">
          {initials || "?"}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 leading-tight">{fullName}</p>
          {functionTitle && <p className="text-xs text-slate-500">{functionTitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1">
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
