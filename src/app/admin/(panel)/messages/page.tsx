import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { formatWhen } from "@/lib/admin/format";
import { listMessages, MESSAGES_PER_PAGE } from "@/lib/admin/queries";

export const metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const { items, total } = await listMessages(page);
  const pages = Math.max(1, Math.ceil(total / MESSAGES_PER_PAGE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl">Messages</h1>
        <p className="adm-hint mt-1">
          {total} message{total === 1 ? "" : "s"} from the contact form.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="adm-card p-8 text-center">
          <p className="font-heading text-xl">{page > 1 ? "No messages on this page" : "No messages yet"}</p>
          <p className="adm-hint mt-1">
            {page > 1 ? "Go back to the first page." : "Messages sent through the contact form will appear here."}
          </p>
          {page > 1 && (
            <Link href="/admin/messages" className="adm-btn mt-4">
              First page
            </Link>
          )}
        </div>
      ) : (
        <ul className="adm-card divide-y divide-[var(--rule)]">
          {items.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/messages/${m.id}`} className="flex flex-col gap-1 p-4 hover:bg-[var(--surface)]">
                <span className={`flex items-center gap-2 ${m.read ? "" : "font-bold"}`}>
                  {!m.read && <span role="img" aria-label="Unread" className="h-2.5 w-2.5 shrink-0 rounded-full bg-marigold" />}
                  <span className="truncate">{m.name}</span>
                  <span className="adm-hint ml-auto shrink-0 font-normal">{formatWhen(m.created_at)}</span>
                </span>
                <span className={`truncate ${m.read ? "text-muted" : "font-semibold"}`}>{m.subject || "(no subject)"}</span>
                <span className="truncate text-sm text-muted">{m.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={`/admin/messages?page=${page - 1}`} className="adm-btn">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="adm-hint">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/admin/messages?page=${page + 1}`} className="adm-btn">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
