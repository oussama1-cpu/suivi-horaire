import { requireAdmin } from "@/lib/session";
import { listMeetingsFor, listEmployees, listComptables } from "@/lib/queries";
import { MeetingsList } from "@/components/admin/meetings-list";

export default async function AdminMeetingsPage() {
  const me = await requireAdmin();
  const [meetings, employees, comptables] = await Promise.all([listMeetingsFor(me), listEmployees(), listComptables()]);
  const attendees = [...employees, ...comptables].filter((p) => p.active);

  return (
    <div className="max-w-3xl">
      <MeetingsList meetings={meetings} attendees={attendees} basePath="/admin/meetings" canCreate />
    </div>
  );
}
