"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { punchIn, punchOut, startBreak, endBreak, setTodayWorkMode } from "@/lib/queries";
import { WorkMode } from "@/lib/types";

function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/entries");
}

async function requireEmployee() {
  const me = await requireUser();
  if (me.role !== "employee") return { error: "Le pointage est réservé aux employés." };
  if (!me.active) return { error: "Ce compte employé est désactivé." };
  return { me };
}

export async function punchInAction(workMode: Exclude<WorkMode, null>) {
  const { me, error } = await requireEmployee();
  if (!me) return { error };
  const result = await punchIn(me.id, workMode);
  if (result.error) return { error: result.error };
  revalidateDashboard();
  return { success: true, entry: result.entry };
}

export async function startBreakAction() {
  const { me, error } = await requireEmployee();
  if (!me) return { error };
  const result = await startBreak(me.id);
  if (result.error) return { error: result.error };
  revalidateDashboard();
  return { success: true, entry: result.entry };
}

export async function endBreakAction() {
  const { me, error } = await requireEmployee();
  if (!me) return { error };
  const result = await endBreak(me.id);
  if (result.error) return { error: result.error };
  revalidateDashboard();
  return { success: true, entry: result.entry };
}

export async function punchOutAction() {
  const { me, error } = await requireEmployee();
  if (!me) return { error };
  const result = await punchOut(me.id);
  if (result.error) return { error: result.error };
  revalidateDashboard();
  return { success: true, entry: result.entry };
}

export async function setWorkModeAction(workMode: Exclude<WorkMode, null>) {
  const { me, error } = await requireEmployee();
  if (!me) return { error };
  const result = await setTodayWorkMode(me.id, workMode);
  if (result.error) return { error: result.error };
  revalidateDashboard();
  return { success: true, entry: result.entry };
}
