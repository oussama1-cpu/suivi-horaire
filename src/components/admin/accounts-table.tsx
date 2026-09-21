"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateAccountAction } from "@/lib/actions/accounts";
import { Profile, Role } from "@/lib/types";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  employee: "Employé",
  comptable: "Comptable",
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-700",
  employee: "bg-sky-100 text-sky-700",
  comptable: "bg-emerald-100 text-emerald-700",
};

export function AccountsTable({ accounts }: { accounts: Profile[] }) {
  const [editing, setEditing] = React.useState<Profile | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{a.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{a.email}</td>
                <td className="px-4 py-3">
                  <Badge className={ROLE_COLORS[a.role]}>{ROLE_LABELS[a.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={a.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>
                    {a.active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(a)} aria-label="Modifier le compte">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Aucun compte.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AccountEditDialog account={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function AccountEditDialog({ account, onClose }: { account: Profile | null; onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("employee");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [prevId, setPrevId] = React.useState<string | null>(null);

  if (account && account.id !== prevId) {
    setPrevId(account.id);
    setEmail(account.email);
    setPassword("");
    setRole(account.role);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;
    setPending(true);
    setError(null);

    const payload: { email?: string; password?: string; role?: Role } = {};
    if (email !== account.email) payload.email = email;
    if (password) payload.password = password;
    if (role !== account.role) payload.role = role;

    const result = await updateAccountAction(account.id, payload);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Dialog open={!!account} onClose={onClose} title={account ? `Compte : ${account.full_name}` : ""}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="acc-email">Email</Label>
          <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-password">Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
          <Input
            id="acc-password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Au moins 8 caractères"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-role">Rôle</Label>
          <Select id="acc-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="employee">Employé</option>
            <option value="comptable">Comptable</option>
            <option value="admin">Admin</option>
          </Select>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
