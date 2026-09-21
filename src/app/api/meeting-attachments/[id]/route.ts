import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/session";
import { getMeetingAttachmentById, getMeetingAttachmentContent, listMeetingParticipants, getMeetingById } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const me = await getSessionProfile();
  if (!me) return new NextResponse("Non authentifié", { status: 401 });

  const attachment = await getMeetingAttachmentById(id);
  if (!attachment) return new NextResponse("Fichier introuvable", { status: 404 });

  if (me.role !== "admin") {
    const meeting = await getMeetingById(attachment.meeting_id);
    const participants = await listMeetingParticipants(attachment.meeting_id);
    const allowed = meeting?.created_by === me.id || participants.some((p) => p.profile_id === me.id);
    if (!allowed) return new NextResponse("Accès refusé", { status: 403 });
  }

  const file = await getMeetingAttachmentContent(id);
  if (!file) return new NextResponse("Fichier manquant", { status: 404 });

  const encodedName = encodeURIComponent(file.original_name).replace(/%20/g, " ");

  return new NextResponse(new Uint8Array(file.content), {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
    },
  });
}
