"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createTask, setTaskDone, deleteTask } from "@/lib/queries";

function revalidate(profileId: string) {
  revalidatePath("/dashboard/tasks");
  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/employees/${profileId}`);
}

export async function addTaskAction(input: {
  task_date: string;
  title: string;
  description: string;
  is_innovation: boolean;
}) {
  const me = await requireUser();
  if (!input.title.trim()) return { error: "Le titre de la tâche est requis." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.task_date)) return { error: "Date invalide." };

  const task = await createTask({ ...input, profile_id: me.id });
  revalidate(me.id);
  return { success: true, task };
}

export async function toggleTaskAction(id: string, done: boolean) {
  const me = await requireUser();
  await setTaskDone(id, me.id, done);
  revalidate(me.id);
  return { success: true };
}

export async function deleteTaskAction(id: string) {
  const me = await requireUser();
  await deleteTask(id, me.id);
  revalidate(me.id);
  return { success: true };
}
