"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { parseHoursCsv, parseHoursXlsx, CsvParseResult } from "@/lib/csv-import";
import { findProfileByEmail, findProfileById, bulkImportTimeEntries, HistoricalHourRow } from "@/lib/queries";
import { DayType, WorkMode } from "@/lib/types";

const MAX_SIZE = 5 * 1024 * 1024;

export interface ImportSummary {
  imported: number;
  errors: string[];
}

/** Ligne prête à être importée, déjà résolue (profil trouvé) et affichée à l'admin
 * pour relecture/filtrage avant confirmation. */
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
  const { rows, errors, detectedHeaders, sampleRows, needsDefaultEmployee } = parsed;

  let defaultProfile: { id: string; full_name: string } | null = null;
  if (defaultProfileId) {
    const found = await findProfileById(defaultProfileId);
    defaultProfile = found ? { id: found.id, full_name: found.full_name } : null;
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

    if (!profile) {
      allErrors.push(
        row.email
          ? `Ligne ${row.line} : aucun compte trouvé pour "${row.email}".`
          : `Ligne ${row.line} : aucun email dans le fichier et aucun employé par défaut sélectionné.`
      );
      continue;
    }
    preview.push({
      line: row.line,
      profile_id: profile.id,
      email,
      full_name: profile.full_name,
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

  return { success: true, rows: preview, errors: allErrors, detectedHeaders, sampleRows, needsDefaultEmployee };
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

  const toImport: HistoricalHourRow[] = rows.map((row) => ({
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
