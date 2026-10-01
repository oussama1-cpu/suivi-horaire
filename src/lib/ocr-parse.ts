import "server-only";
import { normalizeDateString, normalizeTimeString } from "./csv-import";
import { computeDayHours } from "./hours";
import { DEFAULT_WEEKDAY_HOURS } from "./constants";

/** Une ligne "candidate" extraite du texte OCR, avant résolution de l'employé et
 * avant contrôle de validité (fait par le code appelant, qui connaît le contexte
 * métier — employé sélectionné, doublons déjà en base, etc.). */
export interface OcrParsedLine {
  line: number;
  raw_line: string;
  entry_date: string | null;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  hours: number;
}

const DATE_PATTERN = /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}|\d{4}-\d{2}-\d{2})/;
const TIME_PATTERN = /(\d{1,2}[:hH]\d{2})/g;

/** Corrige quelques confusions OCR fréquentes sur les caractères numériques
 * (O/o -> 0, l/I -> 1) avant d'essayer de reconnaître dates/heures dans une ligne. */
function cleanOcrLine(raw: string): string {
  return raw
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ");
}

/** Remplace les lettres visuellement proches de chiffres uniquement à l'intérieur
 * d'un motif date/heure repéré, pour ne pas abîmer le reste de la ligne (ex. un nom). */
function fixDigitLookalikes(token: string): string {
  return token.replace(/[oO]/g, "0").replace(/[lI]/g, "1");
}

/**
 * Analyse un texte OCR brut (une feuille de présence papier) et en extrait des lignes
 * candidates : une par occurrence de date reconnue, avec les deux premières heures
 * trouvées sur la même ligne (ou les lignes suivantes, si la feuille scinde date et
 * heures) interprétées comme heure d'arrivée / heure de départ.
 */
export function parseOcrTimesheetText(text: string): OcrParsedLine[] {
  const lines = text
    .split(/\r?\n/)
    .map(cleanOcrLine)
    .filter((l) => l.length > 0);

  const rows: OcrParsedLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const dateMatch = raw.match(DATE_PATTERN);
    if (!dateMatch) continue;

    const entry_date = normalizeDateString(fixDigitLookalikes(dateMatch[1]));
    if (!entry_date) continue;

    // Les heures peuvent être sur la même ligne que la date, ou sur la ligne suivante
    // (certaines feuilles papier mettent la date en tête de colonne).
    const searchSpace = `${raw} ${lines[i + 1] ?? ""}`;
    const timeMatches = [...searchSpace.matchAll(TIME_PATTERN)].map((m) => fixDigitLookalikes(m[1]));
    const start_time = timeMatches[0] ? normalizeTimeString(timeMatches[0]) : null;
    const end_time = timeMatches[1] ? normalizeTimeString(timeMatches[1]) : null;

    const hours = computeDayHours(
      { day_type: "normal", start_time, end_time, break_minutes: 0, entry_date },
      DEFAULT_WEEKDAY_HOURS
    );

    rows.push({
      line: i + 1,
      raw_line: raw,
      entry_date,
      start_time,
      end_time,
      break_minutes: 0,
      hours,
    });
  }

  return rows;
}

export interface OcrRowValidation {
  valid: boolean;
  issues: string[];
}

/** Contrôle qu'une ligne extraite est plausible avant de la proposer à l'import :
 * date raisonnable (ni trop ancienne, ni future), heures cohérentes, employé résolu. */
export function validateOcrRow(row: {
  entry_date: string | null;
  start_time: string | null;
  end_time: string | null;
  hours: number;
  profile_id: string | null;
}): OcrRowValidation {
  const issues: string[] = [];

  if (!row.entry_date) {
    issues.push("Date illisible ou non reconnue.");
  } else {
    const date = new Date(row.entry_date + "T00:00:00");
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (Number.isNaN(date.getTime())) issues.push("Date invalide.");
    else if (date < twoYearsAgo) issues.push("Date très ancienne (plus de 2 ans) — à vérifier.");
    else if (date > tomorrow) issues.push("Date dans le futur — à vérifier.");
  }

  if (row.start_time && row.end_time && row.start_time >= row.end_time) {
    issues.push("Heure de fin antérieure ou égale à l'heure de début.");
  }
  if (row.hours < 0 || row.hours > 16) {
    issues.push(`Nombre d'heures peu plausible (${row.hours.toFixed(2)} h).`);
  }
  if (!row.profile_id) {
    issues.push("Aucun employé associé à cette ligne.");
  }

  return { valid: issues.length === 0, issues };
}
