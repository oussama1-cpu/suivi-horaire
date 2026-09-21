"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createPersonalContact, deletePersonalContact } from "@/lib/queries";

export async function addPersonalContactAction(input: { full_name: string; phone: string; email: string; note: string }) {
  const me = await requireUser();
  if (!input.full_name.trim()) return { error: "Le nom est requis." };

  const contact = await createPersonalContact({ ...input, owner_id: me.id });
  revalidatePath("/contacts");
  return { success: true, contact };
}

export async function deletePersonalContactAction(id: string) {
  const me = await requireUser();
  await deletePersonalContact(id, me.id);
  revalidatePath("/contacts");
  return { success: true };
}
