"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComptableDialog } from "@/components/admin/comptable-dialog";
import { deleteComptable } from "@/lib/actions/employees";
import { Profile } from "@/lib/types";

export function ComptablesTable({ comptables }: { comptables: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer l'accès comptable de ${name} ?`)) return;
    await deleteComptable(id);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Accès comptable</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvel accès
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Fonction</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {comptables.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{c.email}</td>
                <td className="px-4 py-3 text-slate-600">{c.function_title || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.full_name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {comptables.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Aucun accès comptable pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ComptableDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
