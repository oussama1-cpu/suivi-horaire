"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ComponentType } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  ListTodo,
  PalmtreeIcon,
  CalendarDays,
  FileBarChart,
  FileText,
  QrCode,
  UploadCloud,
  ScanLine,
  Users,
  ShieldCheck,
  Wallet,
  Inbox,
  CalendarClock as MeetingIcon,
  MessageSquare,
} from "lucide-react";
import { Role } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  links: NavLink[];
}

const employeeGroups: NavGroup[] = [
  {
    title: "Principal",
    links: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dashboard/entries", label: "Mes heures", icon: Clock },
      { href: "/dashboard/tasks", label: "Mes tâches", icon: ListTodo },
      { href: "/dashboard/leaves", label: "Congés & Maladie", icon: PalmtreeIcon },
      { href: "/dashboard/calendar", label: "Calendrier", icon: CalendarDays },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
      { href: "/dashboard/qrcode", label: "Mon QR Code", icon: QrCode },
    ],
  },
  {
    title: "Professionnel",
    links: [
      { href: "/meetings", label: "Réunions", icon: MeetingIcon },
      { href: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    links: [{ href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard }],
  },
  {
    title: "Gestion",
    links: [
      { href: "/admin/employees", label: "Employés", icon: Users },
      { href: "/admin/accounts", label: "Comptes", icon: ShieldCheck },
      { href: "/admin/salaries", label: "Salaires", icon: Wallet },
      { href: "/admin/leave-requests", label: "Demandes", icon: Inbox },
      { href: "/admin/tasks", label: "Tâches", icon: ListTodo },
      { href: "/admin/calendar", label: "Calendrier", icon: CalendarDays },
      { href: "/admin/comptables", label: "Accès comptable", icon: FileBarChart },
    ],
  },
  {
    title: "Imports",
    links: [
      { href: "/admin/import", label: "Import heures", icon: UploadCloud },
      { href: "/admin/ocr-import", label: "Import par scan", icon: ScanLine },
    ],
  },
  {
    title: "Professionnel",
    links: [
      { href: "/admin/meetings", label: "Réunions", icon: MeetingIcon },
      { href: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    title: "Outils",
    links: [{ href: "/admin/office-qr", label: "QR bureau", icon: QrCode }],
  },
];

const comptableGroups: NavGroup[] = [
  {
    title: "Principal",
    links: [
      { href: "/comptable", label: "Vue d'ensemble", icon: LayoutDashboard },
      { href: "/comptable/employees", label: "Employés", icon: FileBarChart },
    ],
  },
  {
    title: "Professionnel",
    links: [
      { href: "/meetings", label: "Réunions", icon: MeetingIcon },
      { href: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = role === "admin" ? adminGroups : role === "comptable" ? comptableGroups : employeeGroups;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white print:hidden">
      <div className="flex items-center px-5 h-16 border-b border-slate-200">
        <Image src="/logo.png" alt="ELENI" width={122} height={42} className="object-contain" priority />
      </div>
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.links.map((link) => {
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
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
