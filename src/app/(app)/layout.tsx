import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { listNotifications, countUnreadNotifications } from "@/lib/queries";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const [notifications, unreadCount] = await Promise.all([
    listNotifications(profile.id, 20),
    countUnreadNotifications(profile.id),
  ]);

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100/60">
      <Sidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          fullName={profile.full_name}
          functionTitle={profile.function_title}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-x-hidden">{children}</main>
      </div>
      <MobileNav role={profile.role} />
    </div>
  );
}
