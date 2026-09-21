"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findProfileByQrToken, findProfileByPin, getEntryByDate, punchIn, punchOut } from "@/lib/queries";
import { getClientIp, isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";

// Un code PIN ne comporte que 4 chiffres (10 000 combinaisons) : sans limite
// de débit, une station de pointage publique serait triviale à attaquer par
// force brute. On limite les tentatives par adresse IP.
const MAX_PIN_ATTEMPTS = 10;
const PIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function scanQrCode(token: string) {
  const profile = await findProfileByQrToken(token);
  if (!profile) {
    redirect(`/checkin/${token}?error=invalid`);
  }
  if (!profile.active) {
    redirect(`/checkin/${token}?error=inactive`);
  }

  const entry = await getEntryByDate(profile.id, todayStr());

  if (!entry || !entry.start_time) {
    const result = await punchIn(profile.id);
    if (result.error) redirect(`/checkin/${token}?error=${encodeURIComponent(result.error)}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/entries");
    redirect(`/checkin/${token}?success=in&time=${result.entry?.start_time ?? ""}`);
  }

  if (!entry.end_time) {
    const result = await punchOut(profile.id);
    if (result.error) redirect(`/checkin/${token}?error=${encodeURIComponent(result.error)}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/entries");
    redirect(`/checkin/${token}?success=out&time=${result.entry?.end_time ?? ""}`);
  }

  redirect(`/checkin/${token}?error=already`);
}

export async function verifyPinAndPunch(pin: string) {
  const cleanPin = pin.trim();
  if (!cleanPin) return { error: "Code PIN requis." };

  const ip = await getClientIp();
  const key = `pin:${ip}`;
  if (await isRateLimited(key, MAX_PIN_ATTEMPTS, PIN_WINDOW_MS)) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const profile = await findProfileByPin(cleanPin);
  if (!profile) {
    await recordFailedAttempt(key);
    return { error: "Code PIN invalide." };
  }
  if (!profile.active) return { error: "Ce compte employé est désactivé." };

  const entry = await getEntryByDate(profile.id, todayStr());

  if (!entry || !entry.start_time) {
    const result = await punchIn(profile.id);
    if (result.error) return { error: result.error };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/entries");
    return { success: true, action: "in" as const, name: profile.full_name, time: result.entry?.start_time };
  }

  if (!entry.end_time) {
    const result = await punchOut(profile.id);
    if (result.error) return { error: result.error };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/entries");
    return { success: true, action: "out" as const, name: profile.full_name, time: result.entry?.end_time };
  }

  return { error: "Pointage déjà complet aujourd'hui." };
}
