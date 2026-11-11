import Link from "next/link";
import UploadLauncher from "@/components/admin/UploadLauncher";
import { requireAdmin } from "@/lib/auth/session";
import { getDashboard, listAdminAlbums } from "@/lib/admin/queries";
import { formatWhen } from "@/lib/admin/format";

export default async function DashboardPage() {
  await requireAdmin();
  const [d, albums] = await Promise.all([getDashboard(), listAdminAlbums()]);

  const cards = [
    { label: "Albums", value: d.albumsPublished + d.albumsDraft, sub: `${d.albumsPublished} published · ${d.albumsDraft} draft`, href: "/admin/albums" },
    { label: "Photos", value: d.photos, sub: "across all albums", href: "/admin/albums" },
    { label: "Unread messages", value: d.unread, sub: d.unread ? "waiting for a reply" : "all caught up", href: "/admin/messages" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl">Dashboard</h1>
        <p className="adm-hint mt-1">Welcome back. Here is the state of the Site Diary.</p>
      </div>

      {!d.dbOk && (
        <p role="alert" className="adm-card border-l-4 p-4 text-sm" style={{ borderLeftColor: "var(--adm-danger)" }}>
          The database could not be reached. Check the Supabase settings in <code>.env.local</code> and that the
          migrations have been run.
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.label}>
            <Link href={c.href} className="adm-card block p-5 hover:border-marigold">
              <span className="adm-hint block uppercase tracking-widest">{c.label}</span>
              <span className="font-heading mt-1 block text-4xl">{c.value}</span>
              <span className="adm-hint">{c.sub}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="quick" className="flex flex-col gap-3">
        <h2 id="quick" className="font-heading text-xl">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/albums/new" className="adm-btn adm-btn-primary">
            New album
          </Link>
          <UploadLauncher albums={albums.map((a) => ({ id: a.id, title: a.title_en }))} />
        </div>
      </section>

      <section aria-labelledby="latest" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 id="latest" className="font-heading text-xl">
            Latest messages
          </h2>
          <Link href="/admin/messages" className="text-sm font-semibold underline">
            All messages
          </Link>
        </div>
        {d.latest.length === 0 ? (
          <p className="adm-card p-5 text-sm text-muted">No messages yet. They will appear here when someone uses the contact form.</p>
        ) : (
          <ul className="adm-card divide-y divide-[var(--rule)]">
            {d.latest.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/messages/${m.id}`} className="flex flex-col gap-0.5 p-4 hover:bg-[var(--surface)]">
                  <span className={`flex items-center gap-2 ${m.read ? "" : "font-bold"}`}>
                    {!m.read && <span aria-label="Unread" className="h-2.5 w-2.5 rounded-full bg-marigold" />}
                    {m.name}
                    <span className="adm-hint ml-auto font-normal">{formatWhen(m.created_at)}</span>
                  </span>
                  <span className={`truncate text-sm ${m.read ? "text-muted" : ""}`}>
                    {m.subject || m.body}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
