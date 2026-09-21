import { requireUser } from "@/lib/session";
import { listBroadcastMessages, listConversationsFor } from "@/lib/queries";
import { listContactableAccounts } from "@/lib/actions/messages";
import { MessagesView } from "@/components/messages/messages-view";

export default async function MessagesPage() {
  const me = await requireUser();
  const [broadcasts, conversations, contacts] = await Promise.all([
    listBroadcastMessages(me.id),
    listConversationsFor(me.id),
    listContactableAccounts(),
  ]);

  return (
    <div className="max-w-4xl h-[calc(100vh-8rem)]">
      <MessagesView
        meId={me.id}
        isAdmin={me.role === "admin"}
        broadcasts={broadcasts}
        conversations={conversations}
        contacts={contacts}
      />
    </div>
  );
}
