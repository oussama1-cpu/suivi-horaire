"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { parseHoursCsv, parseHoursXlsx, CsvParseResult } from "@/lib/csv-import";
import { findProfileByEmail, findProfileById, listEmployees, bulkImportTimeEntries, HistoricalHourRow } from "@/lib/queries";
import { DayType, WorkMode } from "@/lib/types";

const MAX_SIZE = 5 * 1024 * 1024;

export interface ImportSummary {
  imported: number;
  errors: string[];
}

/** Ligne affichée à l'admin pour relecture/filtrage avant confirmation. `profile_id` est
 * vide tant que la ligne n'a pas encore été associée à un employé (fichier sans colonne
 * email et sans employé par défaut) : elle reste visible pour être assignée manuellement
 * dans l'aperçu, plutôt que d'être rejetée d'emblée. */
export interface ImportPreviewRow {
  line: number;
  profile_id: string;
  email: string;
  full_name: string;
  entry_date: string;
  day_type: DayType;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  work_mode: WorkMode;
  hours: number;
  tasks: string | null;
  remarks: string | null;
}

async function parseFile(file: File): Promise<CsvParseResult | { error: string }> {
  if (!file || file.size === 0) return { error: "Veuillez sélectionner un fichier CSV ou Excel." };
  if (file.size > MAX_SIZE) return { error: "Fichier trop volumineux (max 5 Mo)." };

  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith(".xlsx");
  const isCsv = fileName.endsWith(".csv");
  if (fileName.endsWith(".xls")) {
    return { error: "Le format .xls (Excel 97-2003) n'est pas supporté. Réenregistrez le fichier au format .xlsx." };
  }
  if (!isExcel && !isCsv) {
    return { error: "Le fichier doit être au format CSV (.csv) ou Excel (.xlsx)." };
  }

  return isExcel
    ? await parseHoursXlsx(Buffer.from(await file.arrayBuffer()))
    : parseHoursCsv(await file.text());
}

export interface AnalyzeImportResult {
  success: true;
  rows: ImportPreviewRow[];
  errors: string[];
  detectedHeaders: string[];
  sampleRows: string[][];
  needsDefaultEmployee: boolean;
  /** Employé suggéré par défaut si son nom a été repéré dans le fichier (ex. modèle
   * "Suivi horaire" avec "Nom d'employé : ..."), pour pré-remplir le sélecteur côté UI. */
  suggestedEmployee: { id: string; full_name: string; email: string } | null;
}

/** Étape 1 : analyse le fichier et renvoie un aperçu filtrable, sans rien écrire en base.
 * Si le fichier n'a pas de colonne email reconnaissable (ex. fichier mensuel propre à un
 * seul employé), `default_profile_id` permet d'appliquer un employé à toutes les lignes. */
export async function analyzeImportAction(
  formData: FormData
): Promise<{ error: string } | AnalyzeImportResult> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  const defaultProfileId = String(formData.get("default_profile_id") || "").trim() || null;

  const parsed = file ? await parseFile(file) : { error: "Veuillez sélectionner un fichier CSV ou Excel." };
  if ("error" in parsed) return parsed;
  const { rows, errors, detectedHeaders, sampleRows, needsDefaultEmployee, detectedEmployeeName } = parsed;

  let defaultProfile: { id: string; full_name: string } | null = null;
  if (defaultProfileId) {
    const found = await findProfileById(defaultProfileId);
    defaultProfile = found ? { id: found.id, full_name: found.full_name } : null;
  }

  // Si le fichier indique un nom d'employé (ex. modèle "Suivi horaire") et qu'aucun employé
  // par défaut n'a été choisi explicitement, on suggère la correspondance la plus proche.
  let suggestedEmployee: { id: string; full_name: string; email: string } | null = null;
  if (!defaultProfile && detectedEmployeeName) {
    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const target = normalize(detectedEmployeeName);
    const employees = await listEmployees();
    const match = employees.find((e) => normalize(e.full_name) === target) ??
      employees.find((e) => normalize(e.full_name).includes(target) || target.includes(normalize(e.full_name)));
    if (match) {
      suggestedEmployee = { id: match.id, full_name: match.full_name, email: match.email };
      defaultProfile = match;
    }
  }

  // Résout l'email de chaque ligne vers un profil existant (ou retombe sur l'employé
  // par défaut choisi si le fichier n'a pas de colonne email) ; les lignes dont
  // l'employé est introuvable sont rejetées avec un message explicite.
  const emailCache = new Map<string, { id: string; full_name: string } | null>();
  const preview: ImportPreviewRow[] = [];
  const allErrors = [...errors];

  for (const row of rows) {
    let profile: { id: string; full_name: string } | null;
    let email = row.email;

    if (row.email) {
      const cached = emailCache.get(row.email);
      if (cached !== undefined) {
        profile = cached;
      } else {
        const found = await findProfileByEmail(row.email);
        profile = found ? { id: found.id, full_name: found.full_name } : null;
        emailCache.set(row.email, profile);
      }
    } else if (defaultProfile) {
      profile = defaultProfile;
      email = defaultProfile.full_name;
    } else {
      profile = null;
    }

    // Une ligne avec un email présent mais introuvable est une vraie erreur (compte
    // inexistant) : elle est rejetée. En revanche, l'absence d'email (fichier mensuel
    // sans colonne email et sans employé par défaut choisi) n'est plus bloquante : la
    // ligne reste dans l'aperçu, non assignée, pour être associée manuellement ensuite.
    if (row.email && !profile) {
      allErrors.push(`Ligne ${row.line} : aucun compte trouvé pour "${row.email}".`);
      continue;
    }
    preview.push({
      line: row.line,
      profile_id: profile?.id ?? "",
      email: profile ? email : "",
      full_name: profile?.full_name ?? "",
      entry_date: row.entry_date,
      day_type: row.day_type,
      start_time: row.start_time,
      end_time: row.end_time,
      break_minutes: row.break_minutes,
      work_mode: row.work_mode,
      hours: row.hours,
      tasks: row.tasks,
      remarks: row.remarks,
    });
  }

  return { success: true, rows: preview, errors: allErrors, detectedHeaders, sampleRows, needsDefaultEmployee, suggestedEmployee };
}

/** Étape 2 : écrit en base les lignes sélectionnées par l'admin après relecture.
 * Chaque ligne fusionne avec l'entrée existante du même jour (mise à jour partielle),
 * les autres jours/employés déjà en base ne sont pas affectés. */
export async function confirmImportAction(
  rows: ImportPreviewRow[]
): Promise<{ error: string } | ({ success: true } & ImportSummary)> {
  await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Aucune ligne sélectionnée à importer." };
  }

  const resolvedRows = rows.filter((row) => row.profile_id);
  if (resolvedRows.length === 0) {
    return { error: "Aucune ligne sélectionnée n'est associée à un employé : assignez un employé avant de confirmer." };
  }

  const toImport: HistoricalHourRow[] = resolvedRows.map((row) => ({
    profile_id: row.profile_id,
    entry_date: row.entry_date,
    day_type: row.day_type,
    start_time: row.start_time,
    end_time: row.end_time,
    break_minutes: row.break_minutes,
    work_mode: row.work_mode,
    hours: row.hours,
    tasks: row.tasks,
    remarks: row.remarks,
  }));

  const imported = await bulkImportTimeEntries(toImport);

  revalidatePath("/dashboard");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/salaries");

  return { success: true, imported, errors: [] };
}
