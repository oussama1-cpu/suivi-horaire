"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  upsertEntry as upsertEntryDb,
  deleteEntry as deleteEntryDb,
  UpsertEntryInput,
} from "@/lib/queries";

export type { UpsertEntryInput };

export async function upsertEntry(input: UpsertEntryInput) {
  const me = await requireUser();

  if (me.role !== "admin") {
    return { error: "Seul l'administrateur peut modifier les heures. Utilisez le pointage." };
  }

  const result = await upsertEntryDb(input);
  if (result.error) return { error: result.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/entries");
  revalidatePath(`/admin/employees/${input.profile_id}`);
  return { success: true, hours: result.hours };
}

export async function deleteEntry(id: string, profileId: string) {
  const me = await requireUser();
  if (me.role !== "admin") {
    return { error: "Seul l'administrateur peut modifier les heures." };
  }

  await deleteEntryDb(id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/entries");
  revalidatePath(`/admin/employees/${profileId}`);
  return { success: true };
}
