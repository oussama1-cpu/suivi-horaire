import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getMeetingById, listMeetingParticipants, listMeetingAttachments, listEmployees, listComptables } from "@/lib/queries";
import { MeetingDetail } from "@/components/admin/meeting-detail";

export default async function AdminMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const meeting = await getMeetingById(id);
  if (!meeting) notFound();

  const [participants, attachments, employees, comptables] = await Promise.all([
    listMeetingParticipants(id),
    listMeetingAttachments(id),
    listEmployees(),
    listComptables(),
  ]);
  const attendees = [...employees, ...comptables].filter((p) => p.active);

  return (
    <div className="space-y-4 max-w-2xl">
      <Link href="/admin/meetings" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Retour aux réunions
      </Link>
      <MeetingDetail meeting={meeting} participants={participants} attendees={attendees} attachments={attachments} />
    </div>
  );
}
