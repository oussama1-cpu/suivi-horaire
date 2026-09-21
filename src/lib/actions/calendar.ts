"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/session";
import { listEmployees, bulkSetDayType, BulkDayTypeUpdate, getEntriesInRange } from "@/lib/queries";
import { notifyNonWorkingDays } from "@/lib/notifications";
import { DayType } from "@/lib/types";
import { TUNISIA_FIXED_HOLIDAYS } from "@/lib/constants";

const COMPANY_DAY_TYPES: DayType[] = ["ferie_paye", "ferie_non_paye", "repos"];

export async function setCompanyDayType(date: string, dayType: DayType | null) {
  await requireAdmin();

  const employees = await listEmployees();
  await bulkSetDayType(
    employees.map((emp) => ({ profile_id: emp.id, entry_date: date, day_type: dayType })),
    COMPANY_DAY_TYPES
  );

  if (dayType) {
    after(() => notifyNonWorkingDays(employees, [{ date, dayType }]));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function importTunisianHolidays(year: number) {
  await requireAdmin();

  const employees = await listEmployees();
  const updates: BulkDayTypeUpdate[] = [];
  const holidays = TUNISIA_FIXED_HOLIDAYS.map((h) => ({
    date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    dayType: "ferie_paye" as DayType,
    label: h.label,
  }));

  // Seuls les jours réellement nouveaux sont notifiés (évite de renvoyer un email à chaque import).
  const reference = employees[0];
  const alreadySet = new Set(
    reference
      ? (await getEntriesInRange(reference.id, `${year}-01-01`, `${year}-12-31`))
          .filter((e) => e.day_type === "ferie_paye")
          .map((e) => e.entry_date)
      : []
  );
  const newHolidays = holidays.filter((h) => !alreadySet.has(h.date));

  for (const holiday of holidays) {
    for (const emp of employees) {
      updates.push({ profile_id: emp.id, entry_date: holiday.date, day_type: "ferie_paye", default_tasks: holiday.label });
    }
  }

  await bulkSetDayType(updates, COMPANY_DAY_TYPES);

  if (newHolidays.length > 0) {
    after(() => notifyNonWorkingDays(employees, newHolidays));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: true, count: TUNISIA_FIXED_HOLIDAYS.length };
}
