"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployee } from "@/lib/actions/employees";
import { DEFAULT_WEEKDAY_HOURS, DEFAULT_WEEKLY_TARGET_HOURS } from "@/lib/constants";

interface EmployeeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EmployeeDialog({ open, onClose }: EmployeeDialogProps) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [functionTitle, setFunctionTitle] = React.useState("");
  const [company, setCompany] = React.useState("ELENI - Consulting");
  const [weeklyTarget, setWeeklyTarget] = React.useState(DEFAULT_WEEKLY_TARGET_HOURS);
  const [congeTotal, setCongeTotal] = React.useState(1.5);
  const [maladieTotal, setMaladieTotal] = React.useState(0.5);
  const [monthlySalary, setMonthlySalary] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setFunctionTitle("");
      setCompany("ELENI - Consulting");
      setWeeklyTarget(DEFAULT_WEEKLY_TARGET_HOURS);
      setCongeTotal(1.5);
      setMaladieTotal(0.5);
      setMonthlySalary(0);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createEmployee({
      email,
      password,
      full_name: fullName,
      function_title: functionTitle,
      company,
      weekly_target_hours: weeklyTarget,
      weekday_hours: DEFAULT_WEEKDAY_HOURS,
      monthly_salary: monthlySalary,
      conge_days_per_month: congeTotal,
      maladie_days_per_month: maladieTotal,
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
    <Dialog open={open} onClose={onClose} title="Nouvel employé">
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

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weekly_target">Heures/semaine cible</Label>
            <Input
              id="weekly_target"
              type="number"
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conge_total">Jours congé/mois</Label>
            <Input
              id="conge_total"
              type="number"
              step="0.5"
              min={0}
              value={congeTotal}
              onChange={(e) => setCongeTotal(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maladie_total">Jours maladie/mois</Label>
            <Input
              id="maladie_total"
              type="number"
              step="0.5"
              min={0}
              value={maladieTotal}
              onChange={(e) => setMaladieTotal(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monthly_salary">Salaire mensuel fixe (TND)</Label>
          <Input
            id="monthly_salary"
            type="number"
            min={0}
            step="0.001"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(Number(e.target.value))}
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Création..." : "Créer l'employé"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
