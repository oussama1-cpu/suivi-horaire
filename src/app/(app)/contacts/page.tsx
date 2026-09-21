import { requireUser } from "@/lib/session";
import { listDirectory, listPersonalContacts } from "@/lib/queries";
import { ContactsView } from "@/components/contacts/contacts-view";

export default async function ContactsPage() {
  const me = await requireUser();
  const [directory, personal] = await Promise.all([listDirectory(), listPersonalContacts(me.id)]);

  return (
    <div className="max-w-3xl">
      <ContactsView directory={directory.filter((p) => p.id !== me.id)} personal={personal} />
    </div>
  );
}
