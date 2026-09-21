import { requireUser } from "@/lib/session";
import { listMeetingsFor } from "@/lib/queries";
import { MeetingsList } from "@/components/admin/meetings-list";

export default async function MeetingsPage() {
  const me = await requireUser();
  const meetings = await listMeetingsFor(me);

  return (
    <div className="max-w-3xl">
      <MeetingsList meetings={meetings} attendees={[]} basePath="/meetings" canCreate={false} />
    </div>
  );
}
