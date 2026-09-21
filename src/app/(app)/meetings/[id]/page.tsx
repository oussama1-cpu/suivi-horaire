import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Video, Download, Users } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getMeetingById, listMeetingParticipants, listMeetingAttachments } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MeetingViewPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;

  const meeting = await getMeetingById(id);
  if (!meeting) notFound();

  const participants = await listMeetingParticipants(id);
  const isAllowed = me.role === "admin" || meeting.created_by === me.id || participants.some((p) => p.profile_id === me.id);
  if (!isAllowed) notFound();

  const attachments = await listMeetingAttachments(id);

  return (
    <div className="space-y-4 max-w-2xl">
      <Link href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Retour aux réunions
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 font-semibold">{meeting.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">{fmt(meeting.start_at)}</p>
          {meeting.description && <p className="text-sm text-slate-700 whitespace-pre-line">{meeting.description}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            {meeting.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" /> {meeting.location}
              </span>
            )}
            {meeting.meeting_link && (
              <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#545454] hover:underline">
                <Video className="h-4 w-4" /> Rejoindre
              </a>
            )}
          </div>
          <div className="flex items-start gap-1.5 text-sm text-slate-600">
            <Users className="h-4 w-4 text-slate-400 mt-0.5" />
            <span>{participants.map((p) => p.full_name).join(", ") || "Aucun participant"}</span>
          </div>
        </CardContent>
      </Card>

      {meeting.minutes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-900 font-semibold">Compte-rendu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-line">{meeting.minutes}</p>
          </CardContent>
        </Card>
      )}

      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-900 font-semibold">Pièces jointes</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={`/api/meeting-attachments/${a.id}`}
                className="flex items-center gap-1.5 py-2 text-sm text-[#545454] hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> {a.original_name}
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
