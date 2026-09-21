"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarClock,
  PalmtreeIcon,
  Users,
  CalendarDays,
  FileBarChart,
  FileText,
  QrCode,
  ListTodo,
  Inbox,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { Role } from "@/lib/types";

const employeeLinks = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard/entries", label: "Heures", icon: CalendarClock },
  { href: "/dashboard/tasks", label: "Tâches", icon: ListTodo },
  { href: "/dashboard/leaves", label: "Congés", icon: PalmtreeIcon },
  { href: "/dashboard/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/qrcode", label: "QR Code", icon: QrCode },
];

const adminLinks = [
  { href: "/admin", label: "Accueil", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employés", icon: Users },
  { href: "/admin/salaries", label: "Salaires", icon: Wallet },
  { href: "/admin/leave-requests", label: "Demandes", icon: Inbox },
  { href: "/admin/tasks", label: "Tâches", icon: ListTodo },
  { href: "/admin/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/comptables", label: "Comptable", icon: FileBarChart },
  { href: "/admin/office-qr", label: "QR bureau", icon: QrCode },
];

const comptableLinks = [
  { href: "/comptable", label: "Accueil", icon: LayoutDashboard },
  { href: "/comptable/employees", label: "Employés", icon: FileBarChart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "admin" ? adminLinks : role === "comptable" ? comptableLinks : employeeLinks;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] print:hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <span
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full transition-all",
                  active
                    ? "bg-gradient-to-br from-[#b0abaa] to-[#736d6c] shadow-md shadow-[#545454]/30"
                    : ""
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-500")} />
              </span>
              <span className={active ? "text-[#545454]" : "text-slate-500"}>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
