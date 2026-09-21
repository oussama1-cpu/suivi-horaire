"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Plus, Trash2, BookUser, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { addPersonalContactAction, deletePersonalContactAction } from "@/lib/actions/contacts";
import { Profile, PersonalContact } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", employee: "Employé", comptable: "Comptable" };

export function ContactsView({ directory, personal }: { directory: Profile[]; personal: PersonalContact[] }) {
  const [tab, setTab] = React.useState<"directory" | "personal">("directory");
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant={tab === "directory" ? "default" : "outline"} size="sm" onClick={() => setTab("directory")}>
            <Users className="h-3.5 w-3.5" /> Annuaire
          </Button>
          <Button type="button" variant={tab === "personal" ? "default" : "outline"} size="sm" onClick={() => setTab("personal")}>
            <BookUser className="h-3.5 w-3.5" /> Mes contacts
          </Button>
        </div>
        {tab === "personal" && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        )}
      </div>

      {tab === "directory" && (
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {directory.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun contact.</p>}
          {directory.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{p.full_name}</p>
                  <Badge className="bg-slate-100 text-slate-600">{ROLE_LABELS[p.role]}</Badge>
                </div>
                <p className="text-xs text-slate-500">{p.function_title}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {p.email}
                </span>
                {p.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {p.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "personal" && <PersonalContactsList contacts={personal} />}

      <PersonalContactDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function PersonalContactsList({ contacts }: { contacts: PersonalContact[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    await deletePersonalContactAction(id);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
      {contacts.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun contact personnel.</p>}
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{c.full_name}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              {c.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {c.phone}
                </span>
              )}
              {c.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {c.email}
                </span>
              )}
            </div>
            {c.note && <p className="text-xs text-slate-500 mt-1">{c.note}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} aria-label="Supprimer">
            <Trash2 className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function PersonalContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFullName("");
      setPhone("");
      setEmail("");
      setNote("");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await addPersonalContactAction({ full_name: fullName, phone, email, note });
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nouveau contact personnel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pc-name">Nom</Label>
          <Input id="pc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pc-phone">Téléphone</Label>
            <Input id="pc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc-email">Email</Label>
            <Input id="pc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pc-note">Note</Label>
          <Input id="pc-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
