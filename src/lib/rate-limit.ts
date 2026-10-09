import "server-only";
import { headers } from "next/headers";
import { sql } from "./pg";
import { generateId } from "./db";

/**
 * Limitation de débit anti brute-force, persistée en base (fonctionne donc
 * aussi bien avec un serveur unique qu'avec plusieurs instances serverless).
 * Utilisée pour le login par mot de passe, qui est exposé sans authentification
 * préalable.
 */

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

export async function isRateLimited(identifier: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const rows = await sql()`SELECT count(*)::int AS n FROM auth_attempts
    WHERE identifier = ${identifier} AND created_at > ${cutoff}`;
  return Number(rows[0].n) >= maxAttempts;
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  await sql()`INSERT INTO auth_attempts (id, identifier, created_at) VALUES (${generateId()}, ${identifier}, ${new Date().toISOString()})`;

  // Nettoyage opportuniste (probabiliste) pour éviter la croissance illimitée de la table.
  if (Math.random() < 0.05) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await sql()`DELETE FROM auth_attempts WHERE created_at < ${dayAgo}`;
  }
}

export async function clearAttempts(identifier: string): Promise<void> {
  await sql()`DELETE FROM auth_attempts WHERE identifier = ${identifier}`;
}
