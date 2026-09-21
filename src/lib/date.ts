export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    dates.push(toDateStr(d));
  }
  return dates;
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const dates = getMonthDates(year, month);
  return { start: dates[0], end: dates[dates.length - 1] };
}

export function getYearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** Toutes les dates (YYYY-MM-DD) entre start et end inclus. */
export function getDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cursor <= last) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/**
 * Retourne une grille de semaines (Lundi -> Dimanche) pour un mois donné.
 * Les cases hors du mois sont `null`.
 */
export function getMonthGrid(year: number, month: number): (string | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Dimanche
  const leadingBlanks = firstWeekday === 0 ? 6 : firstWeekday - 1; // Lundi en premier

  const cells: (string | null)[] = Array(leadingBlanks).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateStr(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
