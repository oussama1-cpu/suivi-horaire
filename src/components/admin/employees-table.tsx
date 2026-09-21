"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmployeeDialog } from "@/components/admin/employee-dialog";
import { formatHours } from "@/lib/utils";
import { Profile } from "@/lib/types";

interface EmployeeRow extends Profile {
  monthHours: number;
}

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(q) ||
        (emp.function_title ?? "").toLowerCase().includes(q) ||
        emp.company.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Employés</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un employé..."
              className="pl-8 w-56"
            />
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvel employé
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Fonction</th>
              <th className="px-4 py-3">Société</th>
              <th className="px-4 py-3">Heures ce mois</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{emp.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{emp.function_title || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{emp.company}</td>
                <td className="px-4 py-3 text-slate-900">{formatHours(emp.monthHours)}</td>
                <td className="px-4 py-3">
                  <Badge className={emp.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}>
                    {emp.active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/employees/${emp.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {employees.length === 0 ? "Aucun employé pour le moment." : "Aucun employé ne correspond à la recherche."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EmployeeDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
