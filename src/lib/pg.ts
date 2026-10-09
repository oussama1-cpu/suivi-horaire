import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { generateId, hashPassword } from "./db";
import { DEFAULT_WEEKDAY_HOURS, DEFAULT_WEEKLY_TARGET_HOURS } from "./constants";

let _sql: NeonQueryFunction<false, false> | null = null;

export function sql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquant — configurer la connexion Postgres (Neon) dans les variables d'environnement.");
  }
  _sql = neon(url);
  return _sql;
}

// --- Seed des comptes démo ---------------------------------------------------

let seedPromise: Promise<void> | null = null;

/** Crée les comptes démo une seule fois par process, uniquement en développement
 * ou si SEED_DEMO=true. Identique au comportement précédent (withSeed). */
export function withSeed(): Promise<void> {
  if (seedPromise) return seedPromise;
  if (process.env.NODE_ENV !== "development" && process.env.SEED_DEMO !== "true") {
    seedPromise = Promise.resolve();
    return seedPromise;
  }
  seedPromise = (async () => {
    const db = sql();
    const now = new Date().toISOString();
    const rows = [
      {
        email: "admin@demo.com",
        full_name: "Admin RH",
        role: "admin",
        function_title: "Responsable RH",
        password: "admin123",
      },
      {
        email: "employe@demo.com",
        full_name: "Employé Démo",
        role: "employee",
        function_title: "Consultant",
        password: "employe123",
      },
    ];
    for (const r of rows) {
      const existing = await db`SELECT id FROM profiles WHERE lower(email) = lower(${r.email}) LIMIT 1`;
      if (existing.length > 0) continue;
      await db`INSERT INTO profiles (id, email, full_name, role, function_title, company, phone, weekly_target_hours, weekday_hours, monthly_salary, conge_days_per_month, maladie_days_per_month, active, created_at, password_hash, qr_token, pin_code)
        VALUES (${generateId()}, ${r.email}, ${r.full_name}, ${r.role}, ${r.function_title}, 'ELENI - Consulting', NULL, ${DEFAULT_WEEKLY_TARGET_HOURS}, ${JSON.stringify(DEFAULT_WEEKDAY_HOURS)}, 0, 1.5, 0.5, true, ${now}, ${hashPassword(r.password)}, ${generateId()}, NULL)`;
    }
  })().catch((e) => {
    seedPromise = null;
    throw e;
  });
  return seedPromise;
}

/** Convertit une valeur timestamptz (Date côté driver Neon) en ISO string. */
export function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v ?? "");
}
