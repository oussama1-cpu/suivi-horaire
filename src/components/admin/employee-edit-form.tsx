"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { updateEmployee, deleteEmployee, regenerateEmployeePin } from "@/lib/actions/employees";
import { WEEKDAY_NAMES_FR } from "@/lib/constants";
import { Profile, WeekdayHours } from "@/lib/types";

export function EmployeeEditForm({ profile, pinCode }: { profile: Profile; pinCode: string | null }) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(profile.full_name);
  const [functionTitle, setFunctionTitle] = React.useState(profile.function_title ?? "");
  const [company, setCompany] = React.useState(profile.company);
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [weeklyTarget, setWeeklyTarget] = React.useState(profile.weekly_target_hours);
  const [weekdayHours, setWeekdayHours] = React.useState<WeekdayHours>(profile.weekday_hours);
  const [active, setActive] = React.useState(profile.active);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pin, setPin] = React.useState(pinCode);
  const [regenerating, setRegenerating] = React.useState(false);

  async function handleRegeneratePin() {
    if (!confirm("Régénérer le code PIN ? L'ancien code ne fonctionnera plus.")) return;
    setRegenerating(true);
    const result = await regenerateEmployeePin(profile.id);
    setRegenerating(false);
    if (result?.pin) setPin(result.pin);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await updateEmployee({
      id: profile.id,
      full_name: fullName,
      function_title: functionTitle,
      company,
      phone,
      weekly_target_hours: weeklyTarget,
      weekday_hours: weekdayHours,
      active,
    });
    setSaving(false);
    if (result?.error) {
      setMessage(result.error);
    } else {
      setMessage("Enregistré.");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement ${profile.full_name} ?`)) return;
    await deleteEmployee(profile.id);
    router.push("/admin/employees");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-900 font-semibold">Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nom complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fonction</Label>
            <Input value={functionTitle} onChange={(e) => setFunctionTitle(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Société</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Heures/semaine cible</Label>
            <Input type="number" value={weeklyTarget} onChange={(e) => setWeeklyTarget(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Téléphone (annuaire partagé)</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 ..." />
        </div>

        <div className="space-y-1.5">
          <Label>Code PIN de pointage</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg tracking-widest rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-900">
              {pin ?? "—"}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleRegeneratePin} disabled={regenerating}>
              <RefreshCw className="h-3.5 w-3.5" />
              {regenerating ? "..." : "Régénérer"}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Utilisé par l&apos;employé pour pointer au poste de pointage bureau (QR partagé + code PIN).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Statut</Label>
          <Select value={active ? "active" : "inactive"} onChange={(e) => setActive(e.target.value === "active")}>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Heures standard par jour de semaine</Label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {WEEKDAY_NAMES_FR.map((name, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-xs text-slate-500">{name.slice(0, 3)}</span>
                <Input
                  type="number"
                  step="0.5"
                  value={weekdayHours[String(idx) as keyof WeekdayHours]}
                  onChange={(e) =>
                    setWeekdayHours((prev) => ({ ...prev, [String(idx)]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {message && <p className="text-sm text-slate-600">{message}</p>}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
            Supprimer l&apos;employé
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
