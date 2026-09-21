"use client";

import * as React from "react";
import { Download, Upload, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { analyzeImportAction, confirmImportAction, ImportPreviewRow, AnalyzeImportResult } from "@/lib/actions/import";

const CSV_HEADER = "email,date,type_jour,heure_debut,heure_fin,pause_minutes,mode,taches,remarques";
const CSV_EXAMPLE = `${CSV_HEADER}
employe@demo.com,2025-01-06,normal,08:00,17:00,60,presentiel,Suivi dossiers,
employe@demo.com,2025-01-07,conge,,,,,,\n`;

const DAY_TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  conge: "Congé",
  maladie: "Maladie",
  ferie_paye: "Férié payé",
  ferie_non_paye: "Férié non payé",
  repos: "Repos",
};

function downloadTemplate() {
  const blob = new Blob([CSV_EXAMPLE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-import-heures.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface EmployeeOption {
  id: string;
  full_name: string;
  email: string;
}

export function ImportHoursForm({ employees }: { employees: EmployeeOption[] }) {
  const [pending, setPending] = React.useState(false);
  const [analyzeError, setAnalyzeError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<Omit<AnalyzeImportResult, "success"> | null>(null);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [search, setSearch] = React.useState("");
  const [dayTypeFilter, setDayTypeFilter] = React.useState("all");
  const [finalResult, setFinalResult] = React.useState<{ imported?: number; error?: string } | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [defaultEmployee, setDefaultEmployee] = React.useState("");

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setAnalyzeError(null);
    setFinalResult(null);
    setPreview(null);
    const formData = new FormData(e.currentTarget);
    const res = await analyzeImportAction(formData);
    setPending(false);
    if ("error" in res) {
      setAnalyzeError(res.error);
      return;
    }
    setPreview(res);
    setSelected(new Set(res.rows.map((r) => r.line)));
  }

  const filteredRows = React.useMemo(() => {
    if (!preview) return [];
    const term = search.trim().toLowerCase();
    return preview.rows.filter((r) => {
      if (dayTypeFilter !== "all" && r.day_type !== dayTypeFilter) return false;
      if (term && !r.email.toLowerCase().includes(term) && !r.full_name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [preview, search, dayTypeFilter]);

  function toggleRow(line: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  }

  function toggleAllFiltered(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of filteredRows) {
        if (checked) next.add(r.line);
        else next.delete(r.line);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!preview) return;
    const rowsToImport: ImportPreviewRow[] = preview.rows.filter((r) => selected.has(r.line));
    if (rowsToImport.length === 0) {
      setFinalResult({ error: "Veuillez sélectionner au moins une ligne à importer." });
      return;
    }
    setConfirming(true);
    setFinalResult(null);
    const res = await confirmImportAction(rowsToImport);
    setConfirming(false);
    if ("error" in res) {
      setFinalResult({ error: res.error });
      return;
    }
    setFinalResult({ imported: res.imported });
    setPreview(null);
    setSelected(new Set());
  }

  const allFilteredSelected = filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.line));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Format attendu</h2>
        <p className="text-sm text-slate-600">
          Fichier CSV ou Excel (.xlsx) avec en-tête, colonnes reconnues :{" "}
          <code className="bg-slate-100 px-1 rounded">{CSV_HEADER}</code>
        </p>
        <ul className="text-xs text-slate-500 list-disc pl-5 space-y-0.5">
          <li>Les en-têtes sont reconnus même avec des variantes (accents, majuscules, synonymes FR/EN comme &quot;Arrivée&quot;/&quot;Départ&quot;).</li>
          <li><code>email</code> : optionnel — si absent, sélectionnez un employé par défaut ci-dessous (fichier mensuel propre à une personne).</li>
          <li><code>date</code> : détectée automatiquement même sans en-tête exact (formats YYYY-MM-DD ou JJ/MM/AAAA).</li>
          <li><code>type_jour</code> : normal, congé, maladie, férié payé, férié non payé ou repos (par défaut : normal).</li>
          <li><code>heure_debut</code> / <code>heure_fin</code> : HH:MM, 8h30, etc. — optionnel selon le type de jour.</li>
        </ul>
        <p className="text-xs text-slate-500">
          L&apos;import fusionne avec les données déjà existantes : seules les dates présentes dans le fichier sont
          mises à jour, le reste de l&apos;historique de chaque employé n&apos;est pas modifié.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-3.5 w-3.5" /> Télécharger le modèle CSV
        </Button>
      </div>

      <form onSubmit={handleAnalyze} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="csv-file">Fichier CSV ou Excel (.xlsx)</Label>
          <Input id="csv-file" name="file" type="file" accept=".csv,.xlsx" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="default-employee">
            Employé par défaut <span className="text-slate-400 font-normal">(si le fichier n&apos;a pas de colonne email)</span>
          </Label>
          <Select
            id="default-employee"
            name="default_profile_id"
            value={defaultEmployee}
            onChange={(e) => setDefaultEmployee(e.target.value)}
          >
            <option value="">— Aucun —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          <Upload className="h-3.5 w-3.5" />
          {pending ? "Analyse en cours..." : "Analyser le fichier"}
        </Button>
        {analyzeError && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{analyzeError}</p>}
      </form>

      {preview && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">En-têtes détectés dans le fichier :</p>
            <div className="flex flex-wrap gap-1.5">
              {preview.detectedHeaders.map((h, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {h.trim() || `(colonne ${i + 1})`}
                </span>
              ))}
            </div>
          </div>

          {preview.needsDefaultEmployee && !defaultEmployee && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              Aucune colonne email détectée dans ce fichier. Sélectionnez un employé par défaut ci-dessus puis
              relancez l&apos;analyse pour associer les lignes à un compte.
            </p>
          )}

          {preview.sampleRows.length > 0 && (
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer select-none">Voir un extrait brut du fichier (avant interprétation)</summary>
              <div className="mt-2 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <tbody>
                    {preview.sampleRows.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100 first:border-t-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 whitespace-nowrap">{cell || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Aperçu — {preview.rows.length} ligne(s) valide(s)
              {preview.errors.length > 0 && `, ${preview.errors.length} ignorée(s)`}
            </h2>
          </div>

          {preview.errors.length > 0 && (
            <div className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
              <p className="font-medium mb-1">Lignes ignorées :</p>
              <ul className="list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto">
                {preview.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.rows.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="space-y-1 flex-1 min-w-[180px]">
                  <Label htmlFor="filter-search">Filtrer par employé</Label>
                  <Input
                    id="filter-search"
                    placeholder="Nom ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-[160px]">
                  <Label htmlFor="filter-daytype">Type de jour</Label>
                  <Select
                    id="filter-daytype"
                    value={dayTypeFilter}
                    onChange={(e) => setDayTypeFilter(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    {Object.entries(DAY_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={(e) => toggleAllFiltered(e.target.checked)}
                        />
                      </th>
                      <th className="px-2 py-2 text-left">Employé</th>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Type</th>
                      <th className="px-2 py-2 text-left">Début</th>
                      <th className="px-2 py-2 text-left">Fin</th>
                      <th className="px-2 py-2 text-left">Pause</th>
                      <th className="px-2 py-2 text-left">Heures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => (
                      <tr key={r.line} className="border-t border-slate-100">
                        <td className="px-2 py-1.5">
                          <input type="checkbox" checked={selected.has(r.line)} onChange={() => toggleRow(r.line)} />
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="font-medium text-slate-800">{r.full_name}</div>
                          <div className="text-xs text-slate-400">{r.email}</div>
                        </td>
                        <td className="px-2 py-1.5">{r.entry_date}</td>
                        <td className="px-2 py-1.5">{DAY_TYPE_LABELS[r.day_type] ?? r.day_type}</td>
                        <td className="px-2 py-1.5">{r.start_time ?? "—"}</td>
                        <td className="px-2 py-1.5">{r.end_time ?? "—"}</td>
                        <td className="px-2 py-1.5">{r.break_minutes} min</td>
                        <td className="px-2 py-1.5">{r.hours.toFixed(2)} h</td>
                      </tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-2 py-4 text-center text-slate-400">
                          Aucune ligne ne correspond aux filtres.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-500">{selected.size} ligne(s) sélectionnée(s) sur {preview.rows.length}</p>
                <Button type="button" onClick={handleConfirm} disabled={confirming || selected.size === 0}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {confirming ? "Import en cours..." : `Confirmer l'import (${selected.size})`}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {finalResult && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {finalResult.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" /> {finalResult.error}
            </p>
          )}
          {finalResult.imported !== undefined && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {finalResult.imported} entrée(s) importée(s) avec succès.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
