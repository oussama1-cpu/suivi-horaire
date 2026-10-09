import "server-only";
import crypto from "crypto";
import { Profile } from "./types";

// Data persistence lives in Postgres (Neon) — see src/lib/pg.ts for the
// client init, and src/lib/queries.ts for the actual (async) data access
// functions. This module only keeps small framework-agnostic helpers
// (password hashing, id generation) and shared types used across the data
// layer.

export interface StoredProfile extends Profile {
  password_hash: string;
}

export interface SessionRecord {
  profileId: string;
  expires: number;
}

export interface DocumentRecord {
  id: string;
  profile_id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  size: number;
  note: string | null;
  category: "employe" | "paie" | "maladie" | "cv";
  uploaded_at: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
}

export function generateId(): string {
  return crypto.randomUUID();
}
