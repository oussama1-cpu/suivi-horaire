"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateMonthlySettingsAction } from "@/lib/actions/employees";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { MonthlyLeaveSummary } from "@/lib/leaves";

interface MonthlySettingsEditorProps {
  profileId: string;
  monthLabel: string;
  monthlySalary: number;
  congePerMonth: number;
  maladiePerMonth: number;
  summary: MonthlyLeaveSummary;
}

export function MonthlySettingsEditor({
  profileId,
  monthLabel,
  monthlySalary,
  congePerMonth,
  maladiePerMonth,
  summary,
}: MonthlySettingsEditorProps) {
  const router = useRouter();
  const [salary, setSalary] = React.useState(monthlySalary);
  const [conge, setConge] = React.useState(congePerMonth);
  const [maladie, setMaladie] = React.useState(maladiePerMonth);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updateMonthlySettingsAction(profileId, {
      monthly_salary: salary,
      conge_days_per_month: conge,
      maladie_days_per_month: maladie,
    });
    setSaving(false);
    if (res?.error) setError(res.error);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-900 font-semibold">Salaire & droits mensuels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="monthly_salary">Salaire mensuel fixe (TND)</Label>
          <Input
            id="monthly_salary"
            type="number"
            min={0}
            step="0.001"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="conge_per_month">{LEAVE_TYPE_LABELS.conge} — jours / mois</Label>
            <Input
              id="conge_per_month"
              type="number"
              min={0}
              step="0.5"
              value={conge}
              onChange={(e) => setConge(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">
              {monthLabel} : {summary.congeUsed}j pris
              {summary.recoveryDays > 0 ? `, +${summary.recoveryDays}j récup.` : ""} → reste {summary.congeRemaining}j
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maladie_per_month">{LEAVE_TYPE_LABELS.maladie} — jours / mois</Label>
            <Input
              id="maladie_per_month"
              type="number"
              min={0}
              step="0.5"
              value={maladie}
              onChange={(e) => setMaladie(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">
              {monthLabel} : {summary.maladieUsed}j pris → reste {summary.maladieRemaining}j
            </p>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
