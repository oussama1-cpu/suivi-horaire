import "server-only";
import path from "path";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getDb, getBucket, withSeed } from "./firebase";
import { generateId, hashPassword, StoredProfile, DocumentRecord } from "./db";
import { computeDayHours, NON_WORKING_DAY_TYPES } from "./hours";
import { DEFAULT_WEEKDAY_HOURS, DEFAULT_WEEKLY_TARGET_HOURS } from "./constants";
import {
  Profile,
  TimeEntry,
  LeaveBalance,
  WeekdayHours,
  DayType,
  WorkMode,
  EmployeeTask,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
  AppNotification,
  NotificationType,
  Meeting,
  MeetingParticipant,
  MeetingAttachment,
  Message,
  ConversationSummary,
  OcrDraftRow,
  OcrDraftStatus,
} from "./types";

async function db() {
  await withSeed();
  return getDb();
}

function stripPassword(p: StoredProfile): Profile {
  const { password_hash, ...rest } = p;
  void password_hash;
  return rest;
}

function mapProfileDoc(data: FirebaseFirestore.DocumentData): StoredProfile {
  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    function_title: data.function_title ?? null,
    company: data.company,
    phone: data.phone ?? null,
    weekly_target_hours: Number(data.weekly_target_hours ?? 0),
    weekday_hours: data.weekday_hours,
    monthly_salary: Number(data.monthly_salary ?? 0),
    conge_days_per_month: Number(data.conge_days_per_month ?? 1.5),
    maladie_days_per_month: Number(data.maladie_days_per_month ?? 0.5),
    active: !!data.active,
    created_at: data.created_at,
    password_hash: data.password_hash,
    qr_token: data.qr_token,
    pin_code: data.pin_code ?? null,
  };
}

// --- Profiles ---------------------------------------------------------------------

export async function findProfileByEmail(email: string): Promise<StoredProfile | null> {
  const snap = await (await db())
    .collection("profiles")
    .where("email_lower", "==", email.toLowerCase())
    .limit(1)
    .get();
  return snap.empty ? null : mapProfileDoc(snap.docs[0].data());
}

export async function findProfileById(id: string): Promise<Profile | null> {
  const snap = await (await db()).collection("profiles").doc(id).get();
  return snap.exists ? stripPassword(mapProfileDoc(snap.data()!)) : null;
}

export async function findProfileByQrToken(token: string): Promise<Profile | null> {
  const snap = await (await db()).collection("profiles").where("qr_token", "==", token).limit(1).get();
  return snap.empty ? null : stripPassword(mapProfileDoc(snap.docs[0].data()));
}

export async function getQrToken(profileId: string): Promise<string | null> {
  const snap = await (await db()).collection("profiles").doc(profileId).get();
  return snap.exists ? snap.data()!.qr_token ?? null : null;
}

export async function findProfileByPin(pin: string): Promise<Profile | null> {
  const snap = await (await db()).collection("profiles").where("pin_code", "==", pin).limit(1).get();
  return snap.empty ? null : stripPassword(mapProfileDoc(snap.docs[0].data()));
}

export async function getPinCode(profileId: string): Promise<string | null> {
  const snap = await (await db()).collection("profiles").doc(profileId).get();
  return snap.exists ? snap.data()!.pin_code ?? null : null;
}

async function generateUniquePin(): Promise<string> {
  const firestore = await db();
  for (let i = 0; i < 20; i++) {
    // crypto.randomInt (CSPRNG) plutôt que Math.random pour un code PIN non prédictible.
    const pin = String(crypto.randomInt(1000, 10000));
    const existing = await firestore.collection("profiles").where("pin_code", "==", pin).limit(1).get();
    if (existing.empty) return pin;
  }
  throw new Error("Impossible de générer un code PIN unique.");
}

export async function regeneratePin(profileId: string): Promise<string> {
  const pin = await generateUniquePin();
  await (await db()).collection("profiles").doc(profileId).update({ pin_code: pin });
  return pin;
}

export async function listEmployees(): Promise<Profile[]> {
  const snap = await (await db()).collection("profiles").where("role", "==", "employee").get();
  return snap.docs
    .map((d) => stripPassword(mapProfileDoc(d.data())))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function listAdmins(): Promise<Profile[]> {
  const snap = await (await db()).collection("profiles").where("role", "==", "admin").get();
  return snap.docs
    .map((d) => stripPassword(mapProfileDoc(d.data())))
    .filter((p) => p.active)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export interface CreateProfileInput {
  email: string;
  password: string;
  full_name: string;
  function_title: string;
  company: string;
  weekly_target_hours: number;
  weekday_hours: WeekdayHours;
  monthly_salary: number;
  conge_days_per_month: number;
  maladie_days_per_month: number;
}

export async function createEmployeeProfile(input: CreateProfileInput): Promise<{ error?: string; id?: string }> {
  if (await findProfileByEmail(input.email)) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const id = generateId();
  const now = new Date().toISOString();
  const pin = await generateUniquePin();

  await (await db())
    .collection("profiles")
    .doc(id)
    .set({
      id,
      email: input.email,
      email_lower: input.email.toLowerCase(),
      full_name: input.full_name,
      role: "employee",
      function_title: input.function_title || null,
      company: input.company,
      phone: null,
      weekly_target_hours: input.weekly_target_hours || DEFAULT_WEEKLY_TARGET_HOURS,
      weekday_hours: input.weekday_hours || DEFAULT_WEEKDAY_HOURS,
      active: true,
      created_at: now,
      password_hash: hashPassword(input.password),
      qr_token: generateId(),
      pin_code: pin,
      monthly_salary: input.monthly_salary ?? 0,
      conge_days_per_month: input.conge_days_per_month ?? 1.5,
      maladie_days_per_month: input.maladie_days_per_month ?? 0.5,
    });

  return { id };
}

export interface MonthlySettingsInput {
  monthly_salary: number;
  conge_days_per_month: number;
  maladie_days_per_month: number;
}

export async function updateMonthlySettings(id: string, input: MonthlySettingsInput): Promise<void> {
  await (await db())
    .collection("profiles")
    .doc(id)
    .update({
      monthly_salary: input.monthly_salary,
      conge_days_per_month: input.conge_days_per_month,
      maladie_days_per_month: input.maladie_days_per_month,
    });
}

export interface CreateComptableInput {
  email: string;
  password: string;
  full_name: string;
  function_title: string;
  company: string;
}

export async function listComptables(): Promise<Profile[]> {
  const snap = await (await db()).collection("profiles").where("role", "==", "comptable").get();
  return snap.docs
    .map((d) => stripPassword(mapProfileDoc(d.data())))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function createComptableProfile(input: CreateComptableInput): Promise<{ error?: string; id?: string }> {
  if (await findProfileByEmail(input.email)) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const id = generateId();
  const now = new Date().toISOString();

  await (await db())
    .collection("profiles")
    .doc(id)
    .set({
      id,
      email: input.email,
      email_lower: input.email.toLowerCase(),
      full_name: input.full_name,
      role: "comptable",
      function_title: input.function_title || null,
      company: input.company,
      phone: null,
      weekly_target_hours: 0,
      weekday_hours: DEFAULT_WEEKDAY_HOURS,
      active: true,
      created_at: now,
      password_hash: hashPassword(input.password),
      qr_token: generateId(),
      pin_code: null,
      monthly_salary: 0,
      conge_days_per_month: 1.5,
      maladie_days_per_month: 0.5,
    });

  return { id };
}

export interface UpdateProfileInput {
  id: string;
  full_name: string;
  function_title: string;
  company: string;
  phone?: string;
  weekly_target_hours: number;
  weekday_hours: WeekdayHours;
  active: boolean;
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ error?: string }> {
  await (await db())
    .collection("profiles")
    .doc(input.id)
    .update({
      full_name: input.full_name,
      function_title: input.function_title || null,
      company: input.company,
      weekly_target_hours: input.weekly_target_hours,
      weekday_hours: input.weekday_hours,
      active: input.active,
      phone: input.phone || null,
    });
  return {};
}

export interface UpdateAccountInput {
  email?: string;
  password?: string;
  role?: Profile["role"];
}

/** Gestion administrative du compte : email, mot de passe, rôle. Séparé de
 * `updateProfile` car ce sont des champs sensibles (identité de connexion). */
export async function updateAccount(id: string, input: UpdateAccountInput): Promise<{ error?: string }> {
  if (input.email) {
    const existing = await findProfileByEmail(input.email);
    if (existing && existing.id !== id) return { error: "Un autre compte utilise déjà cet email." };
  }

  const fields: Record<string, unknown> = {};
  if (input.email) {
    fields.email = input.email;
    fields.email_lower = input.email.toLowerCase();
  }
  if (input.password) fields.password_hash = hashPassword(input.password);
  if (input.role) fields.role = input.role;
  if (Object.keys(fields).length === 0) return {};

  await (await db()).collection("profiles").doc(id).update(fields);
  return {};
}

/** Supprime en cascade (best-effort) tout ce qui référence ce profil. */
export async function deleteProfile(id: string): Promise<void> {
  const firestore = await db();

  async function deleteWhere(collection: string, field: string) {
    const snap = await firestore.collection(collection).where(field, "==", id).get();
    if (snap.empty) return;
    const batch = firestore.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await Promise.all([
    deleteWhere("sessions", "profile_id"),
    deleteWhere("timeEntries", "profile_id"),
    deleteWhere("leaveBalances", "profile_id"),
    deleteWhere("employeeTasks", "profile_id"),
    deleteWhere("leaveRequests", "profile_id"),
    deleteWhere("notifications", "profile_id"),
  ]);

  // Documents : suppression du contenu dans Storage puis des métadonnées.
  const docsSnap = await firestore.collection("documents").where("profile_id", "==", id).get();
  await Promise.all(docsSnap.docs.map((d) => getBucket().file(`documents/${d.id}`).delete({ ignoreNotFound: true })));
  if (!docsSnap.empty) {
    const batch = firestore.batch();
    docsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // Messages envoyés/reçus par ce profil.
  const msgSnap = await firestore.collection("messages").where("participant_ids", "array-contains", id).get();
  if (!msgSnap.empty) {
    const batch = firestore.batch();
    msgSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // Retire ce profil des listes de participants aux réunions.
  const meetingsSnap = await firestore.collection("meetings").where("participant_ids", "array-contains", id).get();
  await Promise.all(
    meetingsSnap.docs.map((d) => d.ref.update({ participant_ids: FieldValue.arrayRemove(id) }))
  );

  await firestore.collection("profiles").doc(id).delete();
}

// --- Leave balances (non utilisé actuellement par l'UI, conservé pour compatibilité) ---

function leaveBalanceDocId(profileId: string, year: number, leaveType: string) {
  return `${profileId}__${year}__${leaveType}`;
}

export async function getLeaveBalances(profileId: string, year: number): Promise<LeaveBalance[]> {
  const snap = await (await db()).collection("leaveBalances").where("profile_id", "==", profileId).get();
  return snap.docs
    .map((d) => d.data() as LeaveBalance)
    .filter((b) => b.year === year)
    .map((b) => ({ ...b, total: Number(b.total), used: Number(b.used) }));
}

export async function upsertLeaveBalance(
  profileId: string,
  year: number,
  leaveType: "conge" | "maladie",
  total: number
): Promise<void> {
  const ref = (await db()).collection("leaveBalances").doc(leaveBalanceDocId(profileId, year, leaveType));
  const snap = await ref.get();
  await ref.set({
    id: snap.exists ? snap.data()!.id : generateId(),
    profile_id: profileId,
    year,
    leave_type: leaveType,
    total,
    used: snap.exists ? snap.data()!.used : 0,
  });
}

// --- Time entries -------------------------------------------------------------------

function timeEntryDocId(profileId: string, date: string) {
  return `${profileId}__${date}`;
}

function mapTimeEntryData(data: FirebaseFirestore.DocumentData): TimeEntry {
  return {
    id: data.id,
    profile_id: data.profile_id,
    entry_date: data.entry_date,
    day_type: data.day_type,
    work_mode: data.work_mode ?? null,
    start_time: data.start_time ?? null,
    end_time: data.end_time ?? null,
    break_minutes: Number(data.break_minutes ?? 0),
    break_start: data.break_start ?? null,
    hours: Number(data.hours ?? 0),
    tasks: data.tasks ?? null,
    remarks: data.remarks ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

async function readTimeEntry(profileId: string, date: string): Promise<TimeEntry | null> {
  const snap = await (await db()).collection("timeEntries").doc(timeEntryDocId(profileId, date)).get();
  return snap.exists ? mapTimeEntryData(snap.data()!) : null;
}

/** Écrit une entrée en préservant les champs non fournis (comme un UPDATE partiel SQL). */
async function writeTimeEntry(
  profileId: string,
  date: string,
  fields: Partial<Omit<TimeEntry, "id" | "profile_id" | "entry_date" | "created_at" | "updated_at">>
): Promise<TimeEntry> {
  const firestore = await db();
  const ref = firestore.collection("timeEntries").doc(timeEntryDocId(profileId, date));
  const existing = await ref.get();
  const now = new Date().toISOString();
  const base = {
    day_type: "normal" as DayType,
    work_mode: null as WorkMode,
    start_time: null as string | null,
    end_time: null as string | null,
    break_minutes: 0,
    break_start: null as string | null,
    hours: 0,
    tasks: null as string | null,
    remarks: null as string | null,
  };
  const data = {
    ...base,
    ...(existing.exists ? existing.data() : {}),
    ...fields,
    id: timeEntryDocId(profileId, date),
    profile_id: profileId,
    entry_date: date,
    created_at: existing.exists ? existing.data()!.created_at : now,
    updated_at: now,
  };
  await ref.set(data);
  return mapTimeEntryData(data);
}

export async function getEntriesInRange(profileId: string, start: string, end: string): Promise<TimeEntry[]> {
  const snap = await (await db()).collection("timeEntries").where("profile_id", "==", profileId).get();
  return snap.docs
    .map((d) => mapTimeEntryData(d.data()))
    .filter((e) => e.entry_date >= start && e.entry_date <= end)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

export async function getAllEntriesInRange(start: string, end: string): Promise<TimeEntry[]> {
  const snap = await (await db())
    .collection("timeEntries")
    .where("entry_date", ">=", start)
    .where("entry_date", "<=", end)
    .get();
  return snap.docs.map((d) => mapTimeEntryData(d.data()));
}

export interface UpsertEntryInput {
  id?: string;
  profile_id: string;
  entry_date: string;
  day_type: DayType;
  work_mode: WorkMode;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  tasks: string;
  remarks: string;
}

export async function upsertEntry(input: UpsertEntryInput): Promise<{ error?: string; hours?: number }> {
  const profileSnap = await (await db()).collection("profiles").doc(input.profile_id).get();
  if (!profileSnap.exists) return { error: "Employé introuvable." };
  const weekdayHours = profileSnap.data()!.weekday_hours as WeekdayHours;

  const hours = computeDayHours(
    {
      day_type: input.day_type,
      start_time: input.start_time,
      end_time: input.end_time,
      break_minutes: input.break_minutes,
      entry_date: input.entry_date,
    },
    weekdayHours
  );

  await writeTimeEntry(input.profile_id, input.entry_date, {
    day_type: input.day_type,
    work_mode: input.work_mode,
    start_time: input.start_time,
    end_time: input.end_time,
    break_minutes: input.break_minutes,
    hours,
    tasks: input.tasks,
    remarks: input.remarks,
  });

  return { hours };
}

export interface BulkDayTypeUpdate {
  profile_id: string;
  entry_date: string;
  day_type: DayType | null; // null = remove the entry if it currently has a removable day type
  default_tasks?: string;
}

/**
 * Applies many day-type updates (e.g. company-wide holidays across all employees).
 */
export async function bulkSetDayType(updates: BulkDayTypeUpdate[], removableTypes: DayType[]): Promise<void> {
  if (updates.length === 0) return;
  const firestore = await db();

  const profileIds = [...new Set(updates.map((u) => u.profile_id))];
  const weekdayHoursById = new Map<string, WeekdayHours>();
  await Promise.all(
    profileIds.map(async (id) => {
      const snap = await firestore.collection("profiles").doc(id).get();
      if (snap.exists) weekdayHoursById.set(id, snap.data()!.weekday_hours);
    })
  );

  for (const u of updates) {
    const weekdayHours = weekdayHoursById.get(u.profile_id);
    if (!weekdayHours) continue;

    if (u.day_type === null) {
      const existing = await readTimeEntry(u.profile_id, u.entry_date);
      if (existing && removableTypes.includes(existing.day_type)) {
        await firestore.collection("timeEntries").doc(timeEntryDocId(u.profile_id, u.entry_date)).delete();
      }
      continue;
    }

    // Sur un jour non travaillé (férié / repos), un pointage déjà effectué est conservé
    // et les heures réellement travaillées restent comptabilisées.
    const existing = NON_WORKING_DAY_TYPES.includes(u.day_type)
      ? await readTimeEntry(u.profile_id, u.entry_date)
      : null;
    const keepPunch = !!existing?.start_time;

    const hours = computeDayHours(
      {
        day_type: u.day_type,
        start_time: keepPunch ? existing!.start_time : null,
        end_time: keepPunch ? existing!.end_time : null,
        break_minutes: keepPunch ? existing!.break_minutes : 0,
        entry_date: u.entry_date,
      },
      weekdayHours
    );

    const tasksValue =
      existing?.tasks && existing.tasks !== "" ? existing.tasks : u.default_tasks ?? "";

    await writeTimeEntry(u.profile_id, u.entry_date, {
      day_type: u.day_type,
      work_mode: keepPunch ? existing!.work_mode : null,
      start_time: keepPunch ? existing!.start_time : null,
      end_time: keepPunch ? existing!.end_time : null,
      break_minutes: keepPunch ? existing!.break_minutes : 0,
      break_start: keepPunch ? existing!.break_start ?? null : null,
      hours,
      tasks: tasksValue,
    });
  }
}

export async function deleteEntry(id: string): Promise<void> {
  await (await db()).collection("timeEntries").doc(id).delete();
}

export async function getEntryByDate(profileId: string, date: string): Promise<TimeEntry | null> {
  return readTimeEntry(profileId, date);
}

// --- Documents (métadonnées Firestore + contenu Firebase Storage) ------------------

function mapDocumentData(data: FirebaseFirestore.DocumentData): DocumentRecord {
  return {
    id: data.id,
    profile_id: data.profile_id,
    file_name: data.file_name,
    original_name: data.original_name,
    mime_type: data.mime_type,
    size: Number(data.size),
    note: data.note ?? null,
    category: data.category,
    uploaded_at: data.uploaded_at,
  };
}

export interface CreateDocumentInput {
  profile_id: string;
  original_name: string;
  mime_type: string;
  size: number;
  buffer: Buffer;
  category: DocumentRecord["category"];
  note: string | null;
}

export async function createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
  const id = generateId();
  const ext = path.extname(input.original_name);
  const file_name = `${id}${ext}`;
  const now = new Date().toISOString();

  await getBucket().file(`documents/${id}`).save(input.buffer, { contentType: input.mime_type });

  const data = {
    id,
    profile_id: input.profile_id,
    file_name,
    original_name: input.original_name,
    mime_type: input.mime_type,
    size: input.size,
    note: input.note ? input.note.trim() : null,
    category: input.category,
    uploaded_at: now,
  };
  await (await db()).collection("documents").doc(id).set(data);
  return mapDocumentData(data);
}

export async function listDocumentsByProfile(
  profileId: string,
  category?: DocumentRecord["category"]
): Promise<DocumentRecord[]> {
  const snap = await (await db()).collection("documents").where("profile_id", "==", profileId).get();
  return snap.docs
    .map((d) => mapDocumentData(d.data()))
    .filter((d) => !category || d.category === category)
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

/** Compte les documents d'une catégorie pour plusieurs profils en une seule requête
 * (évite N requêtes séquentielles/parallèles sur les pages de synthèse, ex. salaires admin). */
export async function countDocumentsByProfiles(
  profileIds: string[],
  category: DocumentRecord["category"]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (profileIds.length === 0) return result;
  const idSet = new Set(profileIds);
  const snap = await (await db()).collection("documents").where("category", "==", category).get();
  for (const doc of snap.docs) {
    const profileId = doc.data().profile_id as string;
    if (idSet.has(profileId)) result.set(profileId, (result.get(profileId) ?? 0) + 1);
  }
  return result;
}

export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  const snap = await (await db()).collection("documents").doc(id).get();
  return snap.exists ? mapDocumentData(snap.data()!) : null;
}

export async function getDocumentContent(
  id: string
): Promise<{ content: Buffer; mime_type: string; original_name: string } | null> {
  const snap = await (await db()).collection("documents").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  const [content] = await getBucket().file(`documents/${id}`).download();
  return { content, mime_type: data.mime_type, original_name: data.original_name };
}

export async function deleteDocumentRecord(id: string): Promise<{ error?: string }> {
  const ref = (await db()).collection("documents").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Document introuvable." };
  await getBucket().file(`documents/${id}`).delete({ ignoreNotFound: true });
  await ref.delete();
  return {};
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getWeekdayHours(profileId: string): Promise<WeekdayHours | null> {
  const snap = await (await db()).collection("profiles").doc(profileId).get();
  return snap.exists ? snap.data()!.weekday_hours ?? null : null;
}

export async function punchIn(
  profileId: string,
  workMode: WorkMode = null
): Promise<{ error?: string; entry?: TimeEntry }> {
  const weekdayHours = await getWeekdayHours(profileId);
  if (!weekdayHours) return { error: "Employé introuvable." };

  const date = todayStr();
  const time = nowHHMM();
  const existing = await getEntryByDate(profileId, date);

  if (existing?.start_time) return { error: "Arrivée déjà pointée aujourd'hui." };

  const mode = workMode ?? existing?.work_mode ?? "presentiel";
  // Un jour férié / de repos reste typé ainsi : les heures pointées viendront s'y ajouter.
  const dayType: DayType =
    existing && NON_WORKING_DAY_TYPES.includes(existing.day_type) ? existing.day_type : "normal";
  const hours = computeDayHours(
    {
      day_type: dayType,
      start_time: time,
      end_time: existing?.end_time ?? null,
      break_minutes: existing?.break_minutes ?? 0,
      entry_date: date,
    },
    weekdayHours
  );

  const entry = await writeTimeEntry(profileId, date, { day_type: dayType, work_mode: mode, start_time: time, hours });
  return { entry };
}

/** Minutes elapsed since `from` (HH:MM) until now, never negative. */
function minutesSince(from: string): number {
  const [h, m] = from.split(":").map(Number);
  const d = new Date();
  return Math.max(0, d.getHours() * 60 + d.getMinutes() - (h * 60 + (m || 0)));
}

export async function startBreak(profileId: string): Promise<{ error?: string; entry?: TimeEntry }> {
  const date = todayStr();
  const existing = await getEntryByDate(profileId, date);

  if (!existing || !existing.start_time) return { error: "Vous devez d'abord pointer votre arrivée." };
  if (existing.end_time) return { error: "Départ déjà pointé aujourd'hui." };
  if (existing.break_start) return { error: "Une pause est déjà en cours." };

  const entry = await writeTimeEntry(profileId, date, { break_start: nowHHMM() });
  return { entry };
}

export async function endBreak(profileId: string): Promise<{ error?: string; entry?: TimeEntry }> {
  const weekdayHours = await getWeekdayHours(profileId);
  if (!weekdayHours) return { error: "Employé introuvable." };

  const date = todayStr();
  const existing = await getEntryByDate(profileId, date);
  if (!existing?.break_start) return { error: "Aucune pause en cours." };

  const breakMinutes = existing.break_minutes + minutesSince(existing.break_start);
  const hours = computeDayHours({ ...existing, break_minutes: breakMinutes }, weekdayHours);

  const entry = await writeTimeEntry(profileId, date, { break_start: null, break_minutes: breakMinutes, hours });
  return { entry };
}

export async function setTodayWorkMode(
  profileId: string,
  workMode: Exclude<WorkMode, null>
): Promise<{ error?: string; entry?: TimeEntry }> {
  const date = todayStr();
  const existing = await getEntryByDate(profileId, date);
  if (!existing || !existing.start_time || (existing.day_type !== "normal" && !NON_WORKING_DAY_TYPES.includes(existing.day_type))) {
    return { error: "Aucune journée de travail pointée aujourd'hui." };
  }

  const entry = await writeTimeEntry(profileId, date, { work_mode: workMode });
  return { entry };
}

export async function punchOut(profileId: string): Promise<{ error?: string; entry?: TimeEntry }> {
  const weekdayHours = await getWeekdayHours(profileId);
  if (!weekdayHours) return { error: "Employé introuvable." };

  const date = todayStr();
  const existing = await getEntryByDate(profileId, date);

  if (!existing || !existing.start_time) return { error: "Vous devez d'abord pointer votre arrivée." };
  if (existing.end_time) return { error: "Départ déjà pointé aujourd'hui." };

  const endTime = nowHHMM();
  // Une pause encore ouverte est clôturée automatiquement au départ.
  const breakMinutes = existing.break_minutes + (existing.break_start ? minutesSince(existing.break_start) : 0);
  const hours = computeDayHours({ ...existing, end_time: endTime, break_minutes: breakMinutes }, weekdayHours);

  const entry = await writeTimeEntry(profileId, date, {
    end_time: endTime,
    hours,
    break_minutes: breakMinutes,
    break_start: null,
  });

  return { entry };
}

// --- Employee tasks --------------------------------------------------------------

function mapTaskData(data: FirebaseFirestore.DocumentData): EmployeeTask {
  return {
    id: data.id,
    profile_id: data.profile_id,
    task_date: data.task_date,
    title: data.title,
    description: data.description ?? null,
    is_innovation: !!data.is_innovation,
    done: !!data.done,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

function sortTasks(tasks: EmployeeTask[]): EmployeeTask[] {
  return tasks.sort(
    (a, b) => b.task_date.localeCompare(a.task_date) || b.created_at.localeCompare(a.created_at)
  );
}

export async function listTasks(profileId: string, start: string, end: string): Promise<EmployeeTask[]> {
  const snap = await (await db()).collection("employeeTasks").where("profile_id", "==", profileId).get();
  return sortTasks(
    snap.docs.map((d) => mapTaskData(d.data())).filter((t) => t.task_date >= start && t.task_date <= end)
  );
}

export async function listAllTasks(start: string, end: string): Promise<EmployeeTask[]> {
  const snap = await (await db())
    .collection("employeeTasks")
    .where("task_date", ">=", start)
    .where("task_date", "<=", end)
    .get();
  return sortTasks(snap.docs.map((d) => mapTaskData(d.data())));
}

export interface CreateTaskInput {
  profile_id: string;
  task_date: string;
  title: string;
  description: string;
  is_innovation: boolean;
}

export async function createTask(input: CreateTaskInput): Promise<EmployeeTask> {
  const id = generateId();
  const now = new Date().toISOString();
  const data = {
    id,
    profile_id: input.profile_id,
    task_date: input.task_date,
    title: input.title.trim(),
    description: input.description.trim() || null,
    is_innovation: input.is_innovation,
    done: false,
    created_at: now,
    updated_at: now,
  };
  await (await db()).collection("employeeTasks").doc(id).set(data);
  return mapTaskData(data);
}

export async function setTaskDone(id: string, profileId: string, done: boolean): Promise<void> {
  const ref = (await db()).collection("employeeTasks").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.profile_id !== profileId) return;
  await ref.update({ done, updated_at: new Date().toISOString() });
}

export async function deleteTask(id: string, profileId: string): Promise<void> {
  const ref = (await db()).collection("employeeTasks").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.profile_id !== profileId) return;
  await ref.delete();
}

// --- Leave requests ---------------------------------------------------------------

function mapLeaveRequestData(data: FirebaseFirestore.DocumentData): LeaveRequest {
  return {
    id: data.id,
    profile_id: data.profile_id,
    leave_type: data.leave_type,
    start_date: data.start_date,
    end_date: data.end_date,
    comment: data.comment ?? null,
    status: data.status,
    admin_comment: data.admin_comment ?? null,
    created_at: data.created_at,
    decided_at: data.decided_at ?? null,
  };
}

export async function listLeaveRequests(profileId: string): Promise<LeaveRequest[]> {
  const snap = await (await db()).collection("leaveRequests").where("profile_id", "==", profileId).get();
  return snap.docs.map((d) => mapLeaveRequestData(d.data())).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listAllLeaveRequests(status?: LeaveRequestStatus): Promise<LeaveRequest[]> {
  const col = (await db()).collection("leaveRequests");
  const snap = status ? await col.where("status", "==", status).get() : await col.get();
  return snap.docs.map((d) => mapLeaveRequestData(d.data())).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function countPendingLeaveRequests(): Promise<number> {
  const snap = await (await db()).collection("leaveRequests").where("status", "==", "pending").get();
  return snap.size;
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest | null> {
  const snap = await (await db()).collection("leaveRequests").doc(id).get();
  return snap.exists ? mapLeaveRequestData(snap.data()!) : null;
}

export interface CreateLeaveRequestInput {
  profile_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  comment: string;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
  const id = generateId();
  const data = {
    id,
    profile_id: input.profile_id,
    leave_type: input.leave_type,
    start_date: input.start_date,
    end_date: input.end_date,
    comment: input.comment.trim() || null,
    status: "pending" as LeaveRequestStatus,
    admin_comment: null,
    created_at: new Date().toISOString(),
    decided_at: null,
  };
  await (await db()).collection("leaveRequests").doc(id).set(data);
  return mapLeaveRequestData(data);
}

export async function cancelLeaveRequest(id: string, profileId: string): Promise<{ error?: string }> {
  const ref = (await db()).collection("leaveRequests").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.profile_id !== profileId || snap.data()!.status !== "pending") {
    return { error: "Seule une demande en attente peut être annulée." };
  }
  await ref.delete();
  return {};
}

export async function decideLeaveRequest(
  id: string,
  status: Exclude<LeaveRequestStatus, "pending">,
  adminComment: string
): Promise<{ error?: string; request?: LeaveRequest }> {
  const ref = (await db()).collection("leaveRequests").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.status !== "pending") {
    return { error: "Demande introuvable ou déjà traitée." };
  }
  const update = { status, admin_comment: adminComment.trim() || null, decided_at: new Date().toISOString() };
  await ref.update(update);
  return { request: mapLeaveRequestData({ ...snap.data(), ...update }) };
}

// --- In-app notifications ---------------------------------------------------------

function mapNotificationData(data: FirebaseFirestore.DocumentData): AppNotification {
  return {
    id: data.id,
    profile_id: data.profile_id,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
    link: data.link ?? null,
    read: !!data.read,
    created_at: data.created_at,
  };
}

export interface NotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export async function createNotifications(profileIds: string[], input: NotificationInput): Promise<void> {
  const ids = [...new Set(profileIds)].filter(Boolean);
  if (ids.length === 0) return;
  const firestore = await db();
  const now = new Date().toISOString();
  const batch = firestore.batch();
  for (const profileId of ids) {
    const id = generateId();
    batch.set(firestore.collection("notifications").doc(id), {
      id,
      profile_id: profileId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      read: false,
      created_at: now,
    });
  }
  await batch.commit();
}

export async function listNotifications(profileId: string, limit = 15): Promise<AppNotification[]> {
  const snap = await (await db()).collection("notifications").where("profile_id", "==", profileId).get();
  return snap.docs
    .map((d) => mapNotificationData(d.data()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export async function countUnreadNotifications(profileId: string): Promise<number> {
  const snap = await (await db()).collection("notifications").where("profile_id", "==", profileId).get();
  return snap.docs.filter((d) => !d.data().read).length;
}

export async function markNotificationsRead(profileId: string, ids?: string[]): Promise<void> {
  const firestore = await db();
  const col = firestore.collection("notifications");
  if (ids && ids.length > 0) {
    const batch = firestore.batch();
    for (const id of ids) {
      const snap = await col.doc(id).get();
      if (snap.exists && snap.data()!.profile_id === profileId) batch.update(snap.ref, { read: true });
    }
    await batch.commit();
  } else {
    const snap = await col.where("profile_id", "==", profileId).get();
    const unread = snap.docs.filter((d) => !d.data().read);
    if (unread.length === 0) return;
    const batch = firestore.batch();
    unread.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
}

// --- Comptes : liste globale pour l'admin -----------------------------------

function sortByRoleThenName(a: Profile, b: Profile): number {
  return a.role.localeCompare(b.role) || a.full_name.localeCompare(b.full_name);
}

export async function listAllAccounts(): Promise<Profile[]> {
  const snap = await (await db()).collection("profiles").get();
  return snap.docs.map((d) => stripPassword(mapProfileDoc(d.data()))).sort(sortByRoleThenName);
}

// --- Réunions ----------------------------------------------------------------

function mapMeetingData(data: FirebaseFirestore.DocumentData): Meeting {
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? null,
    location: data.location ?? null,
    meeting_link: data.meeting_link ?? null,
    start_at: data.start_at,
    end_at: data.end_at ?? null,
    created_by: data.created_by,
    recurrence: data.recurrence,
    minutes: data.minutes ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export interface CreateMeetingInput {
  title: string;
  description: string;
  location: string;
  meeting_link: string;
  start_at: string;
  end_at: string | null;
  created_by: string;
  recurrence: Meeting["recurrence"];
  recurrence_until: string | null;
  participant_ids: string[];
}

/** Crée une réunion. Si récurrente (hebdo/mensuelle) jusqu'à `recurrence_until`,
 * génère une ligne par occurrence (plus simple et cohérent avec le reste de
 * l'app qui modélise chaque jour individuellement, ex. time_entries). */
export async function createMeeting(input: CreateMeetingInput): Promise<Meeting[]> {
  const occurrences: { start: Date; end: Date | null }[] = [];
  const start = new Date(input.start_at);
  const end = input.end_at ? new Date(input.end_at) : null;
  const durationMs = end ? end.getTime() - start.getTime() : null;

  if (input.recurrence === "none" || !input.recurrence_until) {
    occurrences.push({ start, end });
  } else {
    const until = new Date(input.recurrence_until + "T23:59:59");
    let cursor = new Date(start);
    let guard = 0;
    while (cursor <= until && guard < 104) {
      occurrences.push({ start: new Date(cursor), end: durationMs !== null ? new Date(cursor.getTime() + durationMs) : null });
      cursor = new Date(cursor);
      if (input.recurrence === "weekly") cursor.setDate(cursor.getDate() + 7);
      else cursor.setMonth(cursor.getMonth() + 1);
      guard++;
    }
  }

  const firestore = await db();
  const now = new Date().toISOString();
  const created: Meeting[] = [];
  for (const occ of occurrences) {
    const id = generateId();
    const data = {
      id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      location: input.location.trim() || null,
      meeting_link: input.meeting_link.trim() || null,
      start_at: occ.start.toISOString(),
      end_at: occ.end ? occ.end.toISOString() : null,
      created_by: input.created_by,
      recurrence: input.recurrence,
      minutes: null,
      participant_ids: input.participant_ids,
      created_at: now,
      updated_at: now,
    };
    await firestore.collection("meetings").doc(id).set(data);
    created.push(mapMeetingData(data));
  }
  return created;
}

export async function updateMeeting(
  id: string,
  input: {
    title: string;
    description: string;
    location: string;
    meeting_link: string;
    start_at: string;
    end_at: string | null;
    participant_ids: string[];
  }
): Promise<{ error?: string }> {
  await (await db())
    .collection("meetings")
    .doc(id)
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      location: input.location.trim() || null,
      meeting_link: input.meeting_link.trim() || null,
      start_at: input.start_at,
      end_at: input.end_at,
      participant_ids: input.participant_ids,
      updated_at: new Date().toISOString(),
    });
  return {};
}

export async function saveMeetingMinutes(id: string, minutes: string): Promise<void> {
  await (await db())
    .collection("meetings")
    .doc(id)
    .update({ minutes: minutes.trim() || null, updated_at: new Date().toISOString() });
}

export async function deleteMeeting(id: string): Promise<void> {
  const firestore = await db();
  const attachSnap = await firestore.collection("meetingAttachments").where("meeting_id", "==", id).get();
  await Promise.all(
    attachSnap.docs.map((d) => getBucket().file(`meeting-attachments/${d.id}`).delete({ ignoreNotFound: true }))
  );
  if (!attachSnap.empty) {
    const batch = firestore.batch();
    attachSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await firestore.collection("meetings").doc(id).delete();
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const snap = await (await db()).collection("meetings").doc(id).get();
  return snap.exists ? mapMeetingData(snap.data()!) : null;
}

export async function listMeetingParticipants(meetingId: string): Promise<MeetingParticipant[]> {
  const firestore = await db();
  const meetingSnap = await firestore.collection("meetings").doc(meetingId).get();
  const participantIds: string[] = meetingSnap.exists ? meetingSnap.data()!.participant_ids ?? [] : [];
  if (participantIds.length === 0) return [];

  const profiles = await Promise.all(participantIds.map((pid) => firestore.collection("profiles").doc(pid).get()));
  return profiles
    .filter((p) => p.exists)
    .map((p) => ({ meeting_id: meetingId, profile_id: p.id, full_name: p.data()!.full_name }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

/** Réunions à venir/passées visibles par un profil : celles qu'il a créées ou
 * auxquelles il est invité. Les admins voient toutes les réunions. */
export async function listMeetingsFor(profile: Profile): Promise<Meeting[]> {
  const firestore = await db();
  if (profile.role === "admin") {
    const snap = await firestore.collection("meetings").get();
    return snap.docs.map((d) => mapMeetingData(d.data())).sort((a, b) => b.start_at.localeCompare(a.start_at));
  }

  const [createdSnap, invitedSnap] = await Promise.all([
    firestore.collection("meetings").where("created_by", "==", profile.id).get(),
    firestore.collection("meetings").where("participant_ids", "array-contains", profile.id).get(),
  ]);
  const byId = new Map<string, Meeting>();
  [...createdSnap.docs, ...invitedSnap.docs].forEach((d) => byId.set(d.id, mapMeetingData(d.data())));
  return [...byId.values()].sort((a, b) => b.start_at.localeCompare(a.start_at));
}

function mapMeetingAttachmentData(id: string, data: FirebaseFirestore.DocumentData): MeetingAttachment & { meeting_id: string } {
  return {
    id,
    meeting_id: data.meeting_id,
    original_name: data.original_name,
    mime_type: data.mime_type,
    size: Number(data.size),
    uploaded_at: data.uploaded_at,
  };
}

export interface CreateMeetingAttachmentInput {
  meeting_id: string;
  original_name: string;
  mime_type: string;
  size: number;
  buffer: Buffer;
}

export async function createMeetingAttachment(input: CreateMeetingAttachmentInput): Promise<MeetingAttachment> {
  const id = generateId();
  const now = new Date().toISOString();
  await getBucket().file(`meeting-attachments/${id}`).save(input.buffer, { contentType: input.mime_type });
  const data = {
    meeting_id: input.meeting_id,
    original_name: input.original_name,
    mime_type: input.mime_type,
    size: input.size,
    uploaded_at: now,
  };
  await (await db()).collection("meetingAttachments").doc(id).set(data);
  return mapMeetingAttachmentData(id, data);
}

export async function listMeetingAttachments(meetingId: string): Promise<MeetingAttachment[]> {
  const snap = await (await db()).collection("meetingAttachments").where("meeting_id", "==", meetingId).get();
  return snap.docs
    .map((d) => mapMeetingAttachmentData(d.id, d.data()))
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

export async function getMeetingAttachmentById(id: string): Promise<(MeetingAttachment & { meeting_id: string }) | null> {
  const snap = await (await db()).collection("meetingAttachments").doc(id).get();
  return snap.exists ? mapMeetingAttachmentData(id, snap.data()!) : null;
}

export async function getMeetingAttachmentContent(
  id: string
): Promise<{ content: Buffer; mime_type: string; original_name: string } | null> {
  const snap = await (await db()).collection("meetingAttachments").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  const [content] = await getBucket().file(`meeting-attachments/${id}`).download();
  return { content, mime_type: data.mime_type, original_name: data.original_name };
}

export async function deleteMeetingAttachment(id: string): Promise<void> {
  await getBucket().file(`meeting-attachments/${id}`).delete({ ignoreNotFound: true });
  await (await db()).collection("meetingAttachments").doc(id).delete();
}

// --- Messagerie interne --------------------------------------------------------

function mapMessageData(data: FirebaseFirestore.DocumentData, viewerReadField: "recipient" | string): Message {
  const readBy: string[] = data.read_by ?? [];
  const readTarget = viewerReadField === "recipient" ? data.recipient_id : viewerReadField;
  return {
    id: data.id,
    sender_id: data.sender_id,
    sender_name: data.sender_name,
    recipient_id: data.recipient_id ?? null,
    body: data.body,
    created_at: data.created_at,
    read: readTarget ? readBy.includes(readTarget) : false,
  };
}

export async function sendMessage(input: { sender_id: string; recipient_id: string | null; body: string }): Promise<Message> {
  const firestore = await db();
  const senderSnap = await firestore.collection("profiles").doc(input.sender_id).get();
  const senderName = senderSnap.exists ? senderSnap.data()!.full_name : "";

  const id = generateId();
  const data = {
    id,
    sender_id: input.sender_id,
    sender_name: senderName,
    recipient_id: input.recipient_id,
    body: input.body.trim(),
    created_at: new Date().toISOString(),
    is_broadcast: input.recipient_id === null,
    participant_ids: input.recipient_id ? [input.sender_id, input.recipient_id] : [input.sender_id],
    read_by: [] as string[],
  };
  await firestore.collection("messages").doc(id).set(data);
  return mapMessageData(data, "recipient");
}

/** Annonces diffusées à tous les employés (recipient_id IS NULL). */
export async function listBroadcastMessages(viewerId: string, limit = 50): Promise<Message[]> {
  const snap = await (await db()).collection("messages").where("is_broadcast", "==", true).get();
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((d) => mapMessageData(d, viewerId));
}

/** Conversation directe (dans les deux sens) entre deux comptes. */
export async function listConversation(a: string, b: string, limit = 100): Promise<Message[]> {
  const snap = await (await db()).collection("messages").where("participant_ids", "array-contains", a).get();
  return snap.docs
    .map((d) => d.data())
    .filter(
      (d) => !d.is_broadcast && ((d.sender_id === a && d.recipient_id === b) || (d.sender_id === b && d.recipient_id === a))
    )
    .sort((x, y) => x.created_at.localeCompare(y.created_at))
    .slice(0, limit)
    .map((d) => mapMessageData(d, "recipient"));
}

/** Liste des interlocuteurs avec qui l'utilisateur a échangé, triée par dernier message. */
export async function listConversationsFor(profileId: string): Promise<ConversationSummary[]> {
  const firestore = await db();
  const snap = await firestore.collection("messages").where("participant_ids", "array-contains", profileId).get();
  const direct = snap.docs.map((d) => d.data()).filter((d) => !d.is_broadcast);

  const byOther = new Map<string, FirebaseFirestore.DocumentData[]>();
  for (const m of direct) {
    const other = m.sender_id === profileId ? m.recipient_id : m.sender_id;
    if (!byOther.has(other)) byOther.set(other, []);
    byOther.get(other)!.push(m);
  }

  const otherIds = [...byOther.keys()];
  const profiles = await Promise.all(otherIds.map((id) => firestore.collection("profiles").doc(id).get()));
  const nameById = new Map(profiles.filter((p) => p.exists).map((p) => [p.id, p.data()!.full_name as string]));

  const summaries: ConversationSummary[] = otherIds
    .filter((id) => nameById.has(id))
    .map((otherId) => {
      const msgs = byOther.get(otherId)!.sort((x, y) => y.created_at.localeCompare(x.created_at));
      const last = msgs[0];
      const unread = msgs.filter(
        (m) => m.recipient_id === profileId && !(m.read_by ?? []).includes(profileId)
      ).length;
      return {
        profile_id: otherId,
        full_name: nameById.get(otherId)!,
        last_message: last.body,
        last_at: last.created_at,
        unread,
      };
    });

  return summaries.sort((a, b) => b.last_at.localeCompare(a.last_at));
}

export async function markConversationRead(viewerId: string, otherId: string): Promise<void> {
  const firestore = await db();
  const snap = await firestore.collection("messages").where("participant_ids", "array-contains", viewerId).get();
  const toUpdate = snap.docs.filter((d) => {
    const data = d.data();
    return (
      !data.is_broadcast &&
      data.sender_id === otherId &&
      data.recipient_id === viewerId &&
      !(data.read_by ?? []).includes(viewerId)
    );
  });
  if (toUpdate.length === 0) return;
  const batch = firestore.batch();
  toUpdate.forEach((d) => batch.update(d.ref, { read_by: FieldValue.arrayUnion(viewerId) }));
  await batch.commit();
}

export async function markBroadcastRead(viewerId: string): Promise<void> {
  const firestore = await db();
  const snap = await firestore.collection("messages").where("is_broadcast", "==", true).get();
  const toUpdate = snap.docs.filter((d) => !(d.data().read_by ?? []).includes(viewerId));
  if (toUpdate.length === 0) return;
  const batch = firestore.batch();
  toUpdate.forEach((d) => batch.update(d.ref, { read_by: FieldValue.arrayUnion(viewerId) }));
  await batch.commit();
}

export async function countUnreadMessages(profileId: string): Promise<number> {
  const firestore = await db();
  const [directSnap, broadcastSnap] = await Promise.all([
    firestore.collection("messages").where("participant_ids", "array-contains", profileId).get(),
    firestore.collection("messages").where("is_broadcast", "==", true).get(),
  ]);
  const unreadDirect = directSnap.docs.filter((d) => {
    const data = d.data();
    return data.recipient_id === profileId && !(data.read_by ?? []).includes(profileId);
  }).length;
  const unreadBroadcast = broadcastSnap.docs.filter((d) => {
    const data = d.data();
    return data.sender_id !== profileId && !(data.read_by ?? []).includes(profileId);
  }).length;
  return unreadDirect + unreadBroadcast;
}

// --- Import d'heures historiques (CSV) -----------------------------------------

export interface HistoricalHourRow {
  profile_id: string;
  entry_date: string;
  day_type: DayType;
  work_mode: WorkMode;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  hours: number;
  tasks: string | null;
  remarks: string | null;
}

/** Insère/remplace en masse des entrées de temps historiques (import CSV). */
export async function bulkImportTimeEntries(rows: HistoricalHourRow[]): Promise<number> {
  let count = 0;
  for (const r of rows) {
    await writeTimeEntry(r.profile_id, r.entry_date, {
      day_type: r.day_type,
      work_mode: r.work_mode,
      start_time: r.start_time,
      end_time: r.end_time,
      break_minutes: r.break_minutes,
      hours: r.hours,
      tasks: r.tasks,
      remarks: r.remarks,
    });
    count++;
  }
  return count;
}

// --- Import par scan OCR (feuille de présence papier) --------------------------

function mapOcrDraftData(data: FirebaseFirestore.DocumentData): OcrDraftRow {
  return {
    id: data.id,
    batch_id: data.batch_id,
    document_id: data.document_id ?? null,
    profile_id: data.profile_id ?? null,
    full_name: data.full_name ?? null,
    entry_date: data.entry_date ?? null,
    start_time: data.start_time ?? null,
    end_time: data.end_time ?? null,
    break_minutes: Number(data.break_minutes ?? 0),
    hours: Number(data.hours ?? 0),
    raw_line: data.raw_line ?? "",
    valid: !!data.valid,
    issues: Array.isArray(data.issues) ? data.issues : [],
    status: data.status,
    created_at: data.created_at,
  };
}

export interface CreateOcrDraftRowInput {
  batch_id: string;
  document_id: string | null;
  profile_id: string | null;
  full_name: string | null;
  entry_date: string | null;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  hours: number;
  raw_line: string;
  valid: boolean;
  issues: string[];
}

/** Enregistre en base les lignes extraites par OCR (statut "pending") pour relecture
 * par un administrateur : rien n'est fusionné dans l'historique des heures à ce stade. */
export async function createOcrDraftRows(rows: CreateOcrDraftRowInput[]): Promise<OcrDraftRow[]> {
  if (rows.length === 0) return [];
  const firestore = await db();
  const now = new Date().toISOString();
  const batch = firestore.batch();
  const created: OcrDraftRow[] = [];

  for (const r of rows) {
    const id = generateId();
    const data = { id, ...r, status: "pending" as OcrDraftStatus, created_at: now };
    batch.set(firestore.collection("ocrDrafts").doc(id), data);
    created.push(mapOcrDraftData(data));
  }
  await batch.commit();
  return created;
}

export async function listOcrDrafts(status?: OcrDraftStatus): Promise<OcrDraftRow[]> {
  const base = (await db()).collection("ocrDrafts");
  const snap = await (status ? base.where("status", "==", status) : base).get();
  return snap.docs.map((d) => mapOcrDraftData(d.data())).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getOcrDraftById(id: string): Promise<OcrDraftRow | null> {
  const snap = await (await db()).collection("ocrDrafts").doc(id).get();
  return snap.exists ? mapOcrDraftData(snap.data()!) : null;
}

export interface UpdateOcrDraftInput {
  profile_id?: string | null;
  full_name?: string | null;
  entry_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  break_minutes?: number;
  hours?: number;
  valid?: boolean;
  issues?: string[];
}

/** Permet à l'admin de corriger une ligne (employé, date, heures) avant de la confirmer. */
export async function updateOcrDraft(id: string, fields: UpdateOcrDraftInput): Promise<void> {
  await (await db()).collection("ocrDrafts").doc(id).update(fields as Record<string, unknown>);
}

export async function setOcrDraftStatus(ids: string[], status: OcrDraftStatus): Promise<void> {
  if (ids.length === 0) return;
  const firestore = await db();
  const batch = firestore.batch();
  for (const id of ids) batch.update(firestore.collection("ocrDrafts").doc(id), { status });
  await batch.commit();
}

/**
 * Fusionne une ligne validée par OCR avec l'entrée existante du même jour en ADDITIONNANT
 * les heures (plutôt qu'en les remplaçant) : utile quand la feuille papier vient compléter
 * un pointage déjà enregistré. Si aucune entrée n'existe pour ce jour, elle est créée.
 */
export async function addHoursToTimeEntry(
  profileId: string,
  date: string,
  extra: { start_time: string | null; end_time: string | null; break_minutes: number; hours: number }
): Promise<TimeEntry> {
  const existing = await readTimeEntry(profileId, date);
  const mergedHours = (existing?.hours ?? 0) + extra.hours;
  const note = `Import scan (+${extra.hours.toFixed(2)} h)`;

  return writeTimeEntry(profileId, date, {
    day_type: existing?.day_type ?? "normal",
    work_mode: existing?.work_mode ?? null,
    // On garde le pointage existant s'il y en a un ; sinon on reprend celui du scan.
    start_time: existing?.start_time ?? extra.start_time,
    end_time: existing?.end_time ?? extra.end_time,
    break_minutes: existing?.break_minutes ?? extra.break_minutes,
    hours: mergedHours,
    remarks: existing?.remarks ? `${existing.remarks}\n${note}` : note,
  });
}

// --- Réinitialisation de mot de passe ------------------------------------------

const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 heure

/** Crée un jeton de réinitialisation à usage unique et invalide les précédents. */
export async function createPasswordReset(profileId: string): Promise<string> {
  const firestore = await db();
  const existingSnap = await firestore.collection("passwordResets").where("profile_id", "==", profileId).get();
  const unused = existingSnap.docs.filter((d) => !d.data().used);
  if (unused.length > 0) {
    const batch = firestore.batch();
    unused.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  const token = generateId();
  await firestore.collection("passwordResets").doc(token).set({
    profile_id: profileId,
    expires: Date.now() + RESET_TOKEN_DURATION_MS,
    used: false,
    created_at: new Date().toISOString(),
  });
  return token;
}

export async function findValidPasswordReset(token: string): Promise<{ profile_id: string } | null> {
  const snap = await (await db()).collection("passwordResets").doc(token).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.used || data.expires < Date.now()) return null;
  return { profile_id: data.profile_id };
}

/** Applique le nouveau mot de passe, consomme le jeton et déconnecte toutes les sessions actives. */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ error?: string }> {
  const firestore = await db();
  const reset = await findValidPasswordReset(token);
  if (!reset) return { error: "Ce lien de réinitialisation est invalide ou a expiré." };

  await firestore.collection("profiles").doc(reset.profile_id).update({ password_hash: hashPassword(newPassword) });
  await firestore.collection("passwordResets").doc(token).update({ used: true });

  const sessionsSnap = await firestore.collection("sessions").where("profile_id", "==", reset.profile_id).get();
  if (!sessionsSnap.empty) {
    const batch = firestore.batch();
    sessionsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return {};
}
