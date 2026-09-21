"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { markNotificationsRead } from "@/lib/queries";

export async function markMyNotificationsRead(ids?: string[]) {
  const me = await requireUser();
  await markNotificationsRead(me.id, ids);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/comptable");
  return { success: true };
}
