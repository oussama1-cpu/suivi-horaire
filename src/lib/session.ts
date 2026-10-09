import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql, withSeed } from "./pg";
import { generateId } from "./db";
import { findProfileById } from "./queries";
import { Profile } from "./types";

const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(profileId: string) {
  await withSeed();
  const token = generateId();
  const expires = Date.now() + SESSION_DURATION_MS;
  await sql()`INSERT INTO sessions (token, profile_id, expires) VALUES (${token}, ${profileId}, ${expires})`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await sql()`DELETE FROM sessions WHERE token = ${token}`;
  }
  cookieStore.delete(COOKIE_NAME);
}

export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  await withSeed();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await sql()`SELECT profile_id, expires FROM sessions WHERE token = ${token}`;
  const session = rows[0] as { profile_id: string; expires: string } | undefined;
  if (!session || Number(session.expires) < Date.now()) return null;

  return findProfileById(session.profile_id);
});

export async function requireUser(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

export async function requireComptable(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin" && profile.role !== "comptable") redirect("/dashboard");
  return profile;
}
