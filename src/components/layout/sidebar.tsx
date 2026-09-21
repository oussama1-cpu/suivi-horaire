"use client";

import Link from "next/link";
import Image from "next/image";
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
  CalendarClock as MeetingIcon,
  MessageSquare,
  BookUser,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Role } from "@/lib/types";

const employeeLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/entries", label: "Mes heures", icon: CalendarClock },
  { href: "/dashboard/tasks", label: "Mes tâches", icon: ListTodo },
  { href: "/dashboard/leaves", label: "Congés & Maladie", icon: PalmtreeIcon },
  { href: "/dashboard/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/meetings", label: "Réunions", icon: MeetingIcon },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/contacts", label: "Contacts", icon: BookUser },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/qrcode", label: "Mon QR Code", icon: QrCode },
];

const adminLinks = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employés", icon: Users },
  { href: "/admin/accounts", label: "Comptes", icon: ShieldCheck },
  { href: "/admin/salaries", label: "Salaires", icon: Wallet },
  { href: "/admin/leave-requests", label: "Demandes", icon: Inbox },
  { href: "/admin/tasks", label: "Tâches", icon: ListTodo },
  { href: "/admin/meetings", label: "Réunions", icon: MeetingIcon },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/contacts", label: "Contacts", icon: BookUser },
  { href: "/admin/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/admin/comptables", label: "Accès comptable", icon: FileBarChart },
  { href: "/admin/import", label: "Import heures", icon: UploadCloud },
  { href: "/admin/office-qr", label: "QR bureau", icon: QrCode },
];

const comptableLinks = [
  { href: "/comptable", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/comptable/employees", label: "Employés", icon: FileBarChart },
  { href: "/meetings", label: "Réunions", icon: MeetingIcon },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/contacts", label: "Contacts", icon: BookUser },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "admin" ? adminLinks : role === "comptable" ? comptableLinks : employeeLinks;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white print:hidden">
      <div className="flex items-center px-5 h-16 border-b border-slate-200">
        <Image src="/logo.png" alt="ELENI" width={130} height={42} className="object-contain" priority />
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-[#b0abaa] to-[#736d6c] text-white shadow-md shadow-[#545454]/20"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
