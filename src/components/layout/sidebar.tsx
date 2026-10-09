"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ComponentType, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  ListTodo,
  PalmtreeIcon,
  CalendarDays,
  FileBarChart,
  FileText,
  UploadCloud,
  ScanLine,
  Users,
  ShieldCheck,
  Wallet,
  Inbox,
  CalendarClock as MeetingIcon,
  MessageSquare,
  ChevronsLeft,
  ChevronsRight,
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

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = role === "admin" ? adminGroups : role === "comptable" ? comptableGroups : employeeGroups;
  const [collapsed, setCollapsed] = useState(false);

  function toggle() {
    setCollapsed((prev) => !prev);
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-slate-200 bg-white shadow-[4px_0_24px_-8px_rgba(0,0,0,0.06)] transition-[width] duration-200 ease-in-out print:hidden",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 border-b border-slate-200 overflow-hidden",
          collapsed ? "justify-center px-2" : "px-5"
        )}
      >
        <Image
          src="/logo.png"
          alt="ELENI"
          width={collapsed ? 32 : 122}
          height={collapsed ? 32 : 42}
          className="object-contain"
          priority
        />
      </div>
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.links.map((link) => {
                const active = isActive(pathname, link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? link.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all",
                      collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                      active
                        ? "bg-gradient-to-r from-[#b0abaa] to-[#736d6c] text-white shadow-md shadow-[#545454]/20"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        {link.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
        className="flex items-center gap-2 border-t border-slate-200 px-3 py-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        {collapsed ? (
          <ChevronsRight className="mx-auto h-4 w-4" />
        ) : (
          <>
            <ChevronsLeft className="h-4 w-4" />
            <span>Réduire</span>
          </>
        )}
      </button>
    </aside>
  );
}
