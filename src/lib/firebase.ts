import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { initializeFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import crypto from "crypto";
import { hashPassword } from "./db";
import { DEFAULT_WEEKDAY_HOURS, DEFAULT_WEEKLY_TARGET_HOURS } from "./constants";

declare global {
  var __firebaseApp: App | undefined;
  var __firestoreDb: Firestore | undefined;
  var __firebaseSeedReady: Promise<void> | undefined;
}

function createApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Configuration Firebase manquante. Renseigne FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
        "FIREBASE_PRIVATE_KEY (et FIREBASE_STORAGE_BUCKET) — voir la console Firebase, Paramètres du " +
        "projet > Comptes de service > Générer une nouvelle clé privée."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });
}

// Réutilise l'app/le pool entre hot-reloads et invocations du même process
// (Node.js runtime pour Server Actions / Proxy / RSC), comme pg.ts le faisait pour Postgres.
export function getFirebaseApp(): App {
  if (!global.__firebaseApp) {
    global.__firebaseApp = getApps()[0] ?? createApp();
  }
  return global.__firebaseApp;
}

export function getDb(): Firestore {
  if (!global.__firestoreDb) {
    // preferRest : évite les connexions gRPC persistantes, qui saturent sur les
    // fonctions serverless (RESOURCE_EXHAUSTED sur Vercel). Le transport HTTP/REST
    // est stateless et n'a pas cette limite.
    global.__firestoreDb = initializeFirestore(getFirebaseApp(), { preferRest: true });
  }
  return global.__firestoreDb;
}

export function getBucket() {
  return getStorage(getFirebaseApp()).bucket();
}

async function seedIfEmpty(): Promise<void> {
  const db = getDb();
  const snap = await db.collection("profiles").limit(1).get();
  if (!snap.empty) return;

  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const adminId = crypto.randomUUID();
  const employeeId = crypto.randomUUID();

  const batch = db.batch();
  batch.set(db.collection("profiles").doc(adminId), {
    id: adminId,
    email: "admin@demo.com",
    email_lower: "admin@demo.com",
    full_name: "Admin RH",
    role: "admin",
    function_title: "Responsable RH",
    company: "ELENI - Consulting",
    phone: null,
    weekly_target_hours: DEFAULT_WEEKLY_TARGET_HOURS,
    weekday_hours: DEFAULT_WEEKDAY_HOURS,
    monthly_salary: 0,
    conge_days_per_month: 1.5,
    maladie_days_per_month: 0.5,
    active: true,
    created_at: now,
    password_hash: hashPassword("admin123"),
    qr_token: crypto.randomUUID(),
    pin_code: null,
  });
  batch.set(db.collection("profiles").doc(employeeId), {
    id: employeeId,
    email: "employe@demo.com",
    email_lower: "employe@demo.com",
    full_name: "Employé Démo",
    role: "employee",
    function_title: "Consultant",
    company: "ELENI - Consulting",
    phone: null,
    weekly_target_hours: DEFAULT_WEEKLY_TARGET_HOURS,
    weekday_hours: DEFAULT_WEEKDAY_HOURS,
    monthly_salary: 0,
    conge_days_per_month: 1.5,
    maladie_days_per_month: 0.5,
    active: true,
    created_at: now,
    password_hash: hashPassword("employe123"),
    qr_token: crypto.randomUUID(),
    pin_code: "1234",
  });
  batch.set(db.collection("leaveBalances").doc(`${employeeId}__${year}__conge`), {
    id: crypto.randomUUID(),
    profile_id: employeeId,
    year,
    leave_type: "conge",
    total: 18,
    used: 0,
  });
  batch.set(db.collection("leaveBalances").doc(`${employeeId}__${year}__maladie`), {
    id: crypto.randomUUID(),
    profile_id: employeeId,
    year,
    leave_type: "maladie",
    total: 6,
    used: 0,
  });
  await batch.commit();
}

/** Sème les comptes de démo une seule fois par process ; jamais en production
 * sauf si SEED_DEMO=true est explicitement défini. */
export function withSeed(): Promise<void> {
  if (!global.__firebaseSeedReady) {
    global.__firebaseSeedReady =
      process.env.NODE_ENV !== "production" || process.env.SEED_DEMO === "true"
        ? seedIfEmpty()
        : Promise.resolve();
  }
  return global.__firebaseSeedReady;
}
