"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireUser, requireAdmin } from "@/lib/session";
import {
  sendMessage,
  listEmployees,
  listAdmins,
  listComptables,
  markConversationRead,
  markBroadcastRead,
  findProfileById,
  listConversation,
} from "@/lib/queries";
import { notifyNewMessage } from "@/lib/notifications";

function revalidateAll() {
  revalidatePath("/messages");
}

/** Annonce diffusée par un admin à tous les employés actifs. */
export async function sendBroadcastAction(body: string) {
  const me = await requireAdmin();
  const text = body.trim();
  if (!text) return { error: "Le message est requis." };

  await sendMessage({ sender_id: me.id, recipient_id: null, body: text });

  const employees = await listEmployees();
  const recipients = employees.filter((e) => e.active);
  after(() => notifyNewMessage(recipients, me.full_name, text, true));

  revalidateAll();
  return { success: true };
}

/** Message direct entre deux comptes (n'importe quel rôle). */
export async function sendDirectMessageAction(recipientId: string, body: string) {
  const me = await requireUser();
  const text = body.trim();
  if (!text) return { error: "Le message est requis." };
  if (recipientId === me.id) return { error: "Vous ne pouvez pas vous envoyer un message à vous-même." };

  const recipient = await findProfileById(recipientId);
  if (!recipient) return { error: "Destinataire introuvable." };

  await sendMessage({ sender_id: me.id, recipient_id: recipientId, body: text });
  after(() => notifyNewMessage([recipient], me.full_name, text, false));

  revalidateAll();
  return { success: true };
}

export async function markConversationReadAction(otherId: string) {
  const me = await requireUser();
  await markConversationRead(me.id, otherId);
  revalidateAll();
  return { success: true };
}

export async function markBroadcastReadAction() {
  const me = await requireUser();
  await markBroadcastRead(me.id);
  revalidateAll();
  return { success: true };
}

/** Liste des comptes qu'un utilisateur peut contacter directement. */
export async function listContactableAccounts() {
  const me = await requireUser();
  const [employees, admins, comptables] = await Promise.all([listEmployees(), listAdmins(), listComptables()]);
  return [...employees, ...admins, ...comptables].filter((p) => p.active && p.id !== me.id);
}

/** Charge et marque comme lue la conversation avec un autre compte. */
export async function getConversationMessagesAction(otherId: string) {
  const me = await requireUser();
  const messages = await listConversation(me.id, otherId);
  await markConversationRead(me.id, otherId);
  return messages;
}
