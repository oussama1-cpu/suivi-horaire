"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  createEmployeeProfile,
  createComptableProfile,
  CreateComptableInput,
  updateProfile,
  deleteProfile,
  updateMonthlySettings,
  MonthlySettingsInput,
  findProfileById,
} from "@/lib/queries";
import { notifySalaryUpdated } from "@/lib/notifications";
import { WeekdayHours } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export interface CreateEmployeeInput {
  email: string;
  password: string;
  full_name: string;
  function_title: string;
  company: string;
  weekly_target_hours: number;
  weekday_hours: WeekdayHours;
  monthly_salary: number;
  conge_days_per_month: number;
  maladie_days_per_month: number;
}

export async function createEmployee(input: CreateEmployeeInput) {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };
  if (!input.full_name.trim()) return { error: "Le nom complet est requis." };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }

  const result = await createEmployeeProfile({ ...input, email });
  if (result.error) return { error: result.error };

  revalidatePath("/admin/employees");
  return { success: true };
}

export interface UpdateEmployeeInput {
  id: string;
  full_name: string;
  function_title: string;
  company: string;
  phone?: string;
  weekly_target_hours: number;
  weekday_hours: WeekdayHours;
  active: boolean;
}

export async function updateEmployee(input: UpdateEmployeeInput) {
  await requireAdmin();

  const result = await updateProfile(input);
  if (result.error) return { error: result.error };

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${input.id}`);
  return { success: true };
}

export async function updateMonthlySettingsAction(profileId: string, input: MonthlySettingsInput) {
  await requireAdmin();

  if ([input.monthly_salary, input.conge_days_per_month, input.maladie_days_per_month].some((v) => !Number.isFinite(v) || v < 0)) {
    return { error: "Valeurs invalides." };
  }

  const before = await findProfileById(profileId);
  if (!before) return { error: "Employé introuvable." };

  await updateMonthlySettings(profileId, input);

  const changed = {
    salary: before.monthly_salary !== input.monthly_salary,
    conge: before.conge_days_per_month !== input.conge_days_per_month,
    maladie: before.maladie_days_per_month !== input.maladie_days_per_month,
  };
  if (changed.salary || changed.conge || changed.maladie) {
    const updated = { ...before, ...input };
    after(() => notifySalaryUpdated(updated, changed));
  }

  revalidatePath(`/admin/employees/${profileId}`);
  revalidatePath("/admin/salaries");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leaves");
  return { success: true };
}

export async function deleteEmployee(id: string) {
  await requireAdmin();
  await deleteProfile(id);
  revalidatePath("/admin/employees");
  return { success: true };
}

export async function createComptable(input: CreateComptableInput) {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };
  if (!input.full_name.trim()) return { error: "Le nom complet est requis." };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }

  const result = await createComptableProfile({ ...input, email });
  if (result.error) return { error: result.error };

  revalidatePath("/admin/comptables");
  return { success: true };
}

export async function deleteComptable(id: string) {
  await requireAdmin();
  await deleteProfile(id);
  revalidatePath("/admin/comptables");
  return { success: true };
}
