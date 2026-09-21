"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createComptable } from "@/lib/actions/employees";

interface ComptableDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ComptableDialog({ open, onClose }: ComptableDialogProps) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [functionTitle, setFunctionTitle] = React.useState("Comptable");
  const [company, setCompany] = React.useState("ELENI - Consulting");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setFunctionTitle("Comptable");
      setCompany("ELENI - Consulting");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createComptable({
      email,
      password,
      full_name: fullName,
      function_title: functionTitle,
      company,
    });

    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nouvel accès comptable">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="function_title">Fonction</Label>
            <Input id="function_title" value={functionTitle} onChange={(e) => setFunctionTitle(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company">Société</Label>
          <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe temporaire</Label>
            <Input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Ce compte aura un accès en lecture seule à toutes les heures et congés de l&apos;équipe.
        </p>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Création..." : "Créer l'accès"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
