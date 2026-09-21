import "server-only";
import { sendMail, escapeHtml } from "./mail";
import { listAdmins, createNotifications } from "./queries";
import { DAY_TYPE_LABELS, LEAVE_TYPE_LABELS } from "./constants";
import { DayType, LeaveRequest, Profile, Meeting } from "./types";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(135deg,#b0abaa,#736d6c);padding:18px 24px;color:#fff;font-weight:600;font-size:16px">${escapeHtml(title)}</div>
    <div style="padding:24px;font-size:14px;line-height:1.6">${bodyHtml}</div>
    <div style="padding:12px 24px;background:#f8fafc;color:#64748b;font-size:12px">Message automatique — Suivi Horaire. Merci de ne pas répondre à cet email.</div>
  </div></body></html>`;
}

const DAY_TYPE_EXPLANATION: Partial<Record<DayType, string>> = {
  ferie_paye:
    "Ce jour est férié et payé : vous n'avez pas à travailler. Si vous travaillez malgré tout, pointez normalement : les heures effectuées seront comptabilisées.",
  ferie_non_paye:
    "Ce jour est férié non payé : aucune heure n'est due. Si vous travaillez, pointez normalement : les heures effectuées seront comptabilisées.",
  repos:
    "Ce jour est un jour de repos pour toute l'équipe. Si vous travaillez, pointez normalement : les heures effectuées seront comptabilisées.",
};

/** Informe chaque employé qu'un ou plusieurs jours non travaillés ont été définis. */
export async function notifyNonWorkingDays(
  employees: Profile[],
  days: { date: string; dayType: DayType; label?: string }[]
): Promise<void> {
  if (days.length === 0) return;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const single = sorted.length === 1;
  const subject = single
    ? `${DAY_TYPE_LABELS[sorted[0].dayType]} — ${fmtDate(sorted[0].date)}`
    : `${sorted.length} jours non travaillés ajoutés au calendrier`;

  const listText = sorted
    .map((d) => `- ${fmtDate(d.date)} : ${DAY_TYPE_LABELS[d.dayType]}${d.label ? ` (${d.label})` : ""}`)
    .join("\n");
  const listHtml = sorted
    .map(
      (d) =>
        `<li><strong>${escapeHtml(fmtDate(d.date))}</strong> : ${escapeHtml(DAY_TYPE_LABELS[d.dayType])}${
          d.label ? ` (${escapeHtml(d.label)})` : ""
        }</li>`
    )
    .join("");
  const explanation = single ? DAY_TYPE_EXPLANATION[sorted[0].dayType] ?? "" : DAY_TYPE_EXPLANATION.ferie_paye ?? "";

  await Promise.all(
    employees
      .filter((e) => e.active && e.email)
      .map((e) =>
        sendMail({
          to: e.email,
          subject,
          text: `Bonjour ${e.full_name},\n\nLe calendrier de l'équipe a été mis à jour :\n${listText}\n\n${explanation}\n\nBonne journée.`,
          html: layout(
            "Calendrier de l'équipe mis à jour",
            `<p>Bonjour ${escapeHtml(e.full_name)},</p><p>Les jours suivants ont été ajoutés au calendrier :</p><ul>${listHtml}</ul><p>${escapeHtml(explanation)}</p>`
          ),
        })
      )
  );

  // Notification in-app pour chaque employé actif.
  await createNotifications(
    employees.filter((e) => e.active).map((e) => e.id),
    {
      type: "holiday",
      title: single
        ? `${DAY_TYPE_LABELS[sorted[0].dayType]} — ${fmtDate(sorted[0].date)}`
        : `${sorted.length} jours non travaillés ajoutés`,
      body: sorted.map((d) => `${fmtDate(d.date)} : ${DAY_TYPE_LABELS[d.dayType]}${d.label ? ` (${d.label})` : ""}`).join("\n"),
      link: "/dashboard/calendar",
    }
  );
}

/** Informe l'employé de la décision prise sur sa demande. */
export async function notifyLeaveDecision(employee: Profile, request: LeaveRequest, appliedDays?: number): Promise<void> {
  if (!employee.email) return;
  const accepted = request.status === "approved";
  const type = LEAVE_TYPE_LABELS[request.leave_type];
  const period =
    request.start_date === request.end_date
      ? fmtDate(request.start_date)
      : `du ${fmtDate(request.start_date)} au ${fmtDate(request.end_date)}`;

  const subject = `Demande de ${type.toLowerCase()} ${accepted ? "acceptée" : "refusée"} — ${period}`;
  const decision = accepted
    ? `Votre demande de ${type.toLowerCase()} ${period} a été ACCEPTÉE.${
        appliedDays !== undefined ? ` ${appliedDays} jour(s) ouvré(s) ont été inscrits dans votre planning.` : ""
      }`
    : `Votre demande de ${type.toLowerCase()} ${period} a été REFUSÉE.`;
  const comment = request.admin_comment ? `\n\nCommentaire RH : ${request.admin_comment}` : "";

  await sendMail({
    to: employee.email,
    subject,
    text: `Bonjour ${employee.full_name},\n\n${decision}${comment}\n\nBonne journée.`,
    html: layout(
      accepted ? "Demande acceptée" : "Demande refusée",
      `<p>Bonjour ${escapeHtml(employee.full_name)},</p><p style="padding:12px 16px;border-radius:12px;background:${
        accepted ? "#dcfce7;color:#166534" : "#fee2e2;color:#991b1b"
      }">${escapeHtml(decision)}</p>${
        request.admin_comment ? `<p><strong>Commentaire RH :</strong> ${escapeHtml(request.admin_comment)}</p>` : ""
      }`
    ),
  });

  // Notification in-app pour l'employé.
  await createNotifications([employee.id], {
    type: "leave_decision",
    title: `Demande de ${type.toLowerCase()} ${accepted ? "acceptée" : "refusée"}`,
    body: `${period}${request.admin_comment ? ` — ${request.admin_comment}` : ""}`,
    link: "/dashboard/leaves",
  });
}

/** Affiche dans les notifications de toute l'équipe qu'un congé a été accepté. */
export async function notifyTeamLeaveApproved(employee: Profile, request: LeaveRequest, team: Profile[]): Promise<void> {
  const recipients = team.filter((p) => p.active && p.id !== employee.id);
  if (recipients.length === 0) return;

  const type = LEAVE_TYPE_LABELS[request.leave_type];
  const period =
    request.start_date === request.end_date
      ? fmtDate(request.start_date)
      : `du ${fmtDate(request.start_date)} au ${fmtDate(request.end_date)}`;

  await createNotifications(
    recipients.map((p) => p.id),
    {
      type: "team_leave",
      title: `${type} accepté — ${employee.full_name}`,
      body: `${employee.full_name} sera absent(e) ${period}.`,
      link: "/dashboard/calendar",
    }
  );
}

/** Prévient les administrateurs qu'une nouvelle demande attend leur décision. */
export async function notifyAdminsNewRequest(employee: Profile, request: LeaveRequest): Promise<void> {
  const admins = await listAdmins();
  const emails = admins.map((a) => a.email).filter(Boolean);
  if (emails.length === 0) return;

  const type = LEAVE_TYPE_LABELS[request.leave_type];
  const period =
    request.start_date === request.end_date
      ? fmtDate(request.start_date)
      : `du ${fmtDate(request.start_date)} au ${fmtDate(request.end_date)}`;
  const motif = request.comment ? `\nMotif : ${request.comment}` : "";

  await sendMail({
    to: emails,
    subject: `Nouvelle demande de ${type.toLowerCase()} — ${employee.full_name}`,
    text: `${employee.full_name} a envoyé une demande de ${type.toLowerCase()} ${period}.${motif}\n\nConnectez-vous à l'espace administrateur (Demandes) pour l'accepter ou la refuser.`,
    html: layout(
      "Nouvelle demande à traiter",
      `<p><strong>${escapeHtml(employee.full_name)}</strong> a envoyé une demande de <strong>${escapeHtml(
        type.toLowerCase()
      )}</strong> ${escapeHtml(period)}.</p>${
        request.comment ? `<p><strong>Motif :</strong> ${escapeHtml(request.comment)}</p>` : ""
      }<p>Connectez-vous à l'espace administrateur (rubrique <em>Demandes</em>) pour l'accepter ou la refuser.</p>`
    ),
  });

  // Notification in-app pour les administrateurs.
  await createNotifications(
    admins.map((a) => a.id),
    {
      type: "leave_request",
      title: `Nouvelle demande de ${type.toLowerCase()} — ${employee.full_name}`,
      body: `${period}${request.comment ? ` — ${request.comment}` : ""}`,
      link: "/admin/leave-requests",
    }
  );
}

/** Informe l'employé qu'un bulletin de paie a été ajouté à son dossier. */
export async function notifyPayslipUploaded(employee: Profile, fileName: string): Promise<void> {
  if (employee.email) {
    await sendMail({
      to: employee.email,
      subject: "Nouveau bulletin de paie disponible",
      text: `Bonjour ${employee.full_name},\n\nVotre bulletin de paie (${fileName}) a été ajouté à votre dossier. Vous pouvez le consulter dans la rubrique Documents.\n\nBonne journée.`,
      html: layout(
        "Bulletin de paie disponible",
        `<p>Bonjour ${escapeHtml(employee.full_name)},</p><p>Votre bulletin de paie (<strong>${escapeHtml(
          fileName
        )}</strong>) a été ajouté à votre dossier. Vous pouvez le consulter dans la rubrique <em>Documents</em>.</p>`
      ),
    });
  }
  await createNotifications([employee.id], {
    type: "payslip",
    title: "Nouveau bulletin de paie",
    body: fileName,
    link: "/dashboard/documents",
  });
}

/** Informe l'employé d'une mise à jour de son salaire ou de ses droits de congé mensuels. */
export async function notifySalaryUpdated(
  employee: Profile,
  changed: { salary: boolean; conge: boolean; maladie: boolean }
): Promise<void> {
  const parts: string[] = [];
  if (changed.salary) parts.push(`salaire mensuel : ${new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(employee.monthly_salary)}`);
  if (changed.conge) parts.push(`congés/mois : ${employee.conge_days_per_month}j`);
  if (changed.maladie) parts.push(`maladie/mois : ${employee.maladie_days_per_month}j`);
  const summary = parts.join(" · ");

  if (employee.email) {
    await sendMail({
      to: employee.email,
      subject: "Mise à jour de votre contrat RH",
      text: `Bonjour ${employee.full_name},\n\nVos paramètres RH ont été mis à jour : ${summary}.\n\nBonne journée.`,
      html: layout(
        "Mise à jour de vos paramètres RH",
        `<p>Bonjour ${escapeHtml(employee.full_name)},</p><p>Vos paramètres RH ont été mis à jour :</p><p style="padding:12px 16px;border-radius:12px;background:#f1eeed;color:#545454">${escapeHtml(
          summary
        )}</p>`
      ),
    });
  }
  await createNotifications([employee.id], {
    type: "salary",
    title: "Paramètres RH mis à jour",
    body: summary,
    link: "/dashboard",
  });
}

/** Envoie le lien de réinitialisation de mot de passe. */
export async function sendPasswordResetEmail(profile: Profile, resetUrl: string): Promise<void> {
  if (!profile.email) return;
  await sendMail({
    to: profile.email,
    subject: "Réinitialisation de votre mot de passe",
    text: `Bonjour ${profile.full_name},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valable 1 heure) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nBonne journée.`,
    html: layout(
      "Réinitialisation de mot de passe",
      `<p>Bonjour ${escapeHtml(profile.full_name)},</p><p>Vous avez demandé la réinitialisation de votre mot de passe. Ce lien est valable 1 heure :</p><p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,#b0abaa,#736d6c);color:#fff;text-decoration:none;font-weight:600">Réinitialiser mon mot de passe</a></p><p style="color:#64748b;font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
    ),
  });
}

/** Informe les participants qu'ils sont invités à une réunion (création ou rappel manuel). */
export async function notifyMeetingInvite(participants: Profile[], meeting: Meeting, organizerName: string): Promise<void> {
  if (participants.length === 0) return;
  const when = fmtDateTime(meeting.start_at);
  const details = [
    meeting.location ? `Lieu : ${meeting.location}` : null,
    meeting.meeting_link ? `Lien : ${meeting.meeting_link}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  await Promise.all(
    participants
      .filter((p) => p.email)
      .map((p) =>
        sendMail({
          to: p.email,
          subject: `Réunion : ${meeting.title} — ${when}`,
          text: `Bonjour ${p.full_name},\n\n${organizerName} vous invite à la réunion "${meeting.title}" le ${when}.\n${details}\n\n${meeting.description ?? ""}\n\nBonne journée.`,
          html: layout(
            "Invitation à une réunion",
            `<p>Bonjour ${escapeHtml(p.full_name)},</p><p><strong>${escapeHtml(organizerName)}</strong> vous invite à la réunion :</p><p style="padding:12px 16px;border-radius:12px;background:#f1eeed;color:#545454"><strong>${escapeHtml(
              meeting.title
            )}</strong><br/>${escapeHtml(when)}${details ? `<br/>${escapeHtml(details)}` : ""}</p>${
              meeting.description ? `<p>${escapeHtml(meeting.description)}</p>` : ""
            }`
          ),
        })
      )
  );

  await createNotifications(
    participants.map((p) => p.id),
    {
      type: "meeting",
      title: `Réunion : ${meeting.title}`,
      body: `${when}${details ? ` — ${details}` : ""}`,
      link: "/dashboard/meetings",
    }
  );
}

/** Informe un destinataire (ou tous les employés actifs si diffusion) d'un nouveau message. */
export async function notifyNewMessage(recipients: Profile[], senderName: string, body: string, isBroadcast: boolean): Promise<void> {
  if (recipients.length === 0) return;
  const preview = body.length > 140 ? `${body.slice(0, 140)}…` : body;

  await Promise.all(
    recipients
      .filter((p) => p.email)
      .map((p) =>
        sendMail({
          to: p.email,
          subject: isBroadcast ? `Annonce de ${senderName}` : `Nouveau message de ${senderName}`,
          text: `${senderName} vous a envoyé un message :\n\n${body}\n\nConnectez-vous à l'application pour répondre.`,
          html: layout(
            isBroadcast ? "Nouvelle annonce" : "Nouveau message",
            `<p><strong>${escapeHtml(senderName)}</strong> :</p><p style="padding:12px 16px;border-radius:12px;background:#f1f5f9">${escapeHtml(
              body
            )}</p>`
          ),
        })
      )
  );

  await createNotifications(
    recipients.map((p) => p.id),
    {
      type: "message",
      title: isBroadcast ? `Annonce de ${senderName}` : `Message de ${senderName}`,
      body: preview,
      link: "/dashboard/messages",
    }
  );
}
