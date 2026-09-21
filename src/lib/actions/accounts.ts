"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { updateAccount } from "@/lib/queries";
import { Role } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export interface UpdateAccountActionInput {
  email?: string;
  password?: string;
  role?: Role;
}

/** Gestion administrative des comptes : email, mot de passe, rôle (admin uniquement). */
export async function updateAccountAction(id: string, input: UpdateAccountActionInput) {
  const me = await requireAdmin();

  const payload: UpdateAccountActionInput = {};
  if (input.email) {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };
    payload.email = email;
  }
  if (input.password) {
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
    }
    payload.password = input.password;
  }
  if (input.role) {
    if (id === me.id && input.role !== "admin") {
      return { error: "Vous ne pouvez pas retirer votre propre rôle admin." };
    }
    payload.role = input.role;
  }

  const result = await updateAccount(id, payload);
  if (result.error) return { error: result.error };

  revalidatePath("/admin/accounts");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
  revalidatePath("/admin/comptables");
  return { success: true };
}
