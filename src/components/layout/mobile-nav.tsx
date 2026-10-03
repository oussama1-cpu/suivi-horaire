"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, ComponentType } from "react";
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
  Menu,
  X,
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

const employeePrimary: NavLink[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard/entries", label: "Heures", icon: Clock },
  { href: "/dashboard/leaves", label: "Congés", icon: PalmtreeIcon },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
];

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

const adminPrimary: NavLink[] = [
  { href: "/admin", label: "Accueil", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employés", icon: Users },
  { href: "/admin/leave-requests", label: "Demandes", icon: Inbox },
  { href: "/admin/calendar", label: "Agenda", icon: CalendarDays },
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

const comptablePrimary: NavLink[] = [
  { href: "/comptable", label: "Accueil", icon: LayoutDashboard },
  { href: "/comptable/employees", label: "Employés", icon: FileBarChart },
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

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const primaryLinks = role === "admin" ? adminPrimary : role === "comptable" ? comptablePrimary : employeePrimary;
  const groups = role === "admin" ? adminGroups : role === "comptable" ? comptableGroups : employeeGroups;

  // Empêche le scroll du fond pendant que le menu plein écran est ouvert.
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Referme le menu automatiquement sur retour/avant du navigateur.
  useEffect(() => {
    function onPopState() {
      setOpen(false);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-lg md:hidden print:hidden">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${primaryLinks.length + 1}, minmax(0, 1fr))` }}
        >
          {primaryLinks.map((link) => {
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
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    active ? "bg-gradient-to-br from-[#b0abaa] to-[#736d6c] shadow-md shadow-[#545454]/30" : ""
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-500")} />
                </span>
                <span className={active ? "text-[#545454]" : "text-slate-500"}>{link.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                open ? "bg-gradient-to-br from-[#b0abaa] to-[#736d6c] shadow-md shadow-[#545454]/30" : ""
              )}
            >
              {open ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-slate-500" />}
            </span>
            <span className={open ? "text-[#545454]" : "text-slate-500"}>Menu</span>
          </button>
        </div>
      </nav>

      {/* Overlay sombre derrière le menu plein écran */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Menu plein écran, groupé par section */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden print:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <Image src="/logo.png" alt="ELENI" width={88} height={30} className="object-contain" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.links.map((link) => {
                    const active = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                          active
                            ? "bg-gradient-to-r from-[#b0abaa] to-[#736d6c] text-white shadow-md shadow-[#545454]/20"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
