import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";
import { adminDb } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

async function unreadCount(): Promise<number> {
  const db = adminDb();
  if (!db) return 0;
  const { count } = await db
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("read", false);
  return count ?? 0;
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const unread = await unreadCount();
  return <AdminShell unread={unread}>{children}</AdminShell>;
}
