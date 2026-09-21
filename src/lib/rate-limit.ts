import "server-only";
import { headers } from "next/headers";
import { getDb } from "./firebase";
import { generateId } from "./db";

/**
 * Limitation de débit anti brute-force, persistée en base (fonctionne donc
 * aussi bien avec un serveur unique qu'avec plusieurs instances serverless).
 * Utilisée pour le login par mot de passe et le pointage par code PIN, qui
 * sont tous deux exposés sans authentification préalable.
 */

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

export async function isRateLimited(identifier: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const cutoff = Date.now() - windowMs;
  const snap = await getDb().collection("authAttempts").where("identifier", "==", identifier).get();
  const count = snap.docs.filter((d) => (d.data().created_at_ms as number) > cutoff).length;
  return count >= maxAttempts;
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  await getDb()
    .collection("authAttempts")
    .doc(generateId())
    .set({ identifier, created_at_ms: Date.now() });

  // Nettoyage opportuniste (probabiliste) pour éviter la croissance illimitée de la collection.
  if (Math.random() < 0.05) {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const snap = await getDb().collection("authAttempts").where("created_at_ms", "<", dayAgo).get();
    const batch = getDb().batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    if (snap.docs.length > 0) await batch.commit();
  }
}

export async function clearAttempts(identifier: string): Promise<void> {
  const snap = await getDb().collection("authAttempts").where("identifier", "==", identifier).get();
  const batch = getDb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (snap.docs.length > 0) await batch.commit();
}
