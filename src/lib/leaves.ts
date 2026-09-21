import { TimeEntry, LeaveType, WeekdayHours } from "./types";
import { workedHours, standardHoursFor } from "./hours";
import { DEFAULT_WEEKDAY_HOURS } from "./constants";

const LEAVE_DAY_TYPE: Record<LeaveType, TimeEntry["day_type"]> = {
  conge: "conge",
  maladie: "maladie",
};

/** Jours dont le travail est converti en jours de congé (récupération) au lieu d'être payé. */
const RECOVERY_DAY_TYPES: TimeEntry["day_type"][] = ["ferie_non_paye", "repos"];

export function countLeaveDaysUsed(entries: TimeEntry[], leaveType: LeaveType): number {
  const dayType = LEAVE_DAY_TYPE[leaveType];
  return entries.filter((e) => e.day_type === dayType).length;
}

/**
 * Jours de congé crédités pour du travail effectué un jour férié non payé / de repos :
 * heures travaillées / heures standard d'une journée (8h si le jour n'a pas d'horaire standard).
 */
export function countRecoveryDays(entries: TimeEntry[], weekdayHours: WeekdayHours = DEFAULT_WEEKDAY_HOURS): number {
  let days = 0;
  for (const e of entries) {
    if (!RECOVERY_DAY_TYPES.includes(e.day_type)) continue;
    const worked = workedHours(e);
    if (worked <= 0) continue;
    const standard = standardHoursFor(e.entry_date, weekdayHours) || 8;
    days += worked / standard;
  }
  return Math.round(days * 100) / 100;
}

export interface MonthlyLeaveSummary {
  congeAllowance: number; // droit mensuel fixe
  recoveryDays: number; // jours de récupération gagnés ce mois
  congeTotal: number; // droit + récupération
  congeUsed: number;
  congeRemaining: number;
  maladieTotal: number;
  maladieUsed: number;
  maladieRemaining: number;
}

/** Résumé des congés du mois : droit fixe par mois (non reportable) + récupération − jours pris. */
export function summarizeMonthlyLeave(
  monthEntries: TimeEntry[],
  profile: { conge_days_per_month: number; maladie_days_per_month: number; weekday_hours: WeekdayHours }
): MonthlyLeaveSummary {
  const recoveryDays = countRecoveryDays(monthEntries, profile.weekday_hours);
  const congeUsed = countLeaveDaysUsed(monthEntries, "conge");
  const maladieUsed = countLeaveDaysUsed(monthEntries, "maladie");
  const congeTotal = Math.round((profile.conge_days_per_month + recoveryDays) * 100) / 100;
  return {
    congeAllowance: profile.conge_days_per_month,
    recoveryDays,
    congeTotal,
    congeUsed,
    congeRemaining: Math.round((congeTotal - congeUsed) * 100) / 100,
    maladieTotal: profile.maladie_days_per_month,
    maladieUsed,
    maladieRemaining: Math.round((profile.maladie_days_per_month - maladieUsed) * 100) / 100,
  };
}
