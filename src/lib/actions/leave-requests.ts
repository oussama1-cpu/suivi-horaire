"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireUser, requireAdmin } from "@/lib/session";
import { notifyAdminsNewRequest, notifyLeaveDecision, notifyTeamLeaveApproved } from "@/lib/notifications";
import {
  createLeaveRequest,
  cancelLeaveRequest,
  decideLeaveRequest,
  getLeaveRequestById,
  findProfileById,
  getEntriesInRange,
  bulkSetDayType,
  listEmployees,
} from "@/lib/queries";
import { getDatesBetween } from "@/lib/date";
import { LeaveType, WeekdayHours } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COMPANY_DAY_TYPES = ["ferie_paye", "ferie_non_paye", "repos"];

function revalidateAll(profileId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leaves");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/entries");
  revalidatePath("/admin");
  revalidatePath("/admin/leave-requests");
  revalidatePath("/admin/calendar");
  revalidatePath(`/admin/employees/${profileId}`);
}

export async function submitLeaveRequest(input: {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  comment: string;
}) {
  const me = await requireUser();
  if (me.role !== "employee") return { error: "Seuls les employés peuvent faire une demande." };
  if (!["conge", "maladie"].includes(input.leave_type)) return { error: "Type de demande invalide." };
  if (!DATE_RE.test(input.start_date) || !DATE_RE.test(input.end_date)) return { error: "Dates invalides." };
  if (input.end_date < input.start_date) return { error: "La date de fin doit être après la date de début." };
  if (getDatesBetween(input.start_date, input.end_date).length > 62) {
    return { error: "Une demande ne peut pas dépasser 2 mois." };
  }

  const request = await createLeaveRequest({ ...input, profile_id: me.id });
  after(() => notifyAdminsNewRequest(me, request));
  revalidateAll(me.id);
  return { success: true, request };
}

export async function cancelMyLeaveRequest(id: string) {
  const me = await requireUser();
  const result = await cancelLeaveRequest(id, me.id);
  if (result.error) return { error: result.error };
  revalidateAll(me.id);
  return { success: true };
}

export async function approveLeaveRequest(id: string, adminComment = "") {
  await requireAdmin();

  const request = await getLeaveRequestById(id);
  if (!request) return { error: "Demande introuvable." };
  if (request.status !== "pending") return { error: "Cette demande a déjà été traitée." };

  const profile = await findProfileById(request.profile_id);
  if (!profile) return { error: "Employé introuvable." };

  const existing = await getEntriesInRange(request.profile_id, request.start_date, request.end_date);
  const blocked = new Set(existing.filter((e) => COMPANY_DAY_TYPES.includes(e.day_type)).map((e) => e.entry_date));

  // Seuls les jours travaillés (heures standard > 0) et non fériés sont posés.
  const dates = getDatesBetween(request.start_date, request.end_date).filter((date) => {
    const weekday = String(new Date(date + "T00:00:00").getDay()) as keyof WeekdayHours;
    return profile.weekday_hours[weekday] > 0 && !blocked.has(date);
  });

  await bulkSetDayType(
    dates.map((date) => ({
      profile_id: request.profile_id,
      entry_date: date,
      day_type: request.leave_type,
      default_tasks: request.comment ?? "",
    })),
    []
  );

  const result = await decideLeaveRequest(id, "approved", adminComment);
  if (result.error) return { error: result.error };

  const decided = result.request!;
  after(() => notifyLeaveDecision(profile, decided, dates.length));

  // Une absence acceptée (congé ou maladie) est affichée à toute l'équipe.
  const team = await listEmployees();
  after(() => notifyTeamLeaveApproved(profile, decided, team));

  revalidateAll(request.profile_id);
  return { success: true, days: dates.length };
}

export async function rejectLeaveRequest(id: string, adminComment = "") {
  await requireAdmin();

  const request = await getLeaveRequestById(id);
  if (!request) return { error: "Demande introuvable." };

  const result = await decideLeaveRequest(id, "rejected", adminComment);
  if (result.error) return { error: result.error };

  const profile = await findProfileById(request.profile_id);
  const decided = result.request!;
  if (profile) after(() => notifyLeaveDecision(profile, decided));

  revalidateAll(request.profile_id);
  return { success: true };
}
