import Link from "next/link";
import { notFound } from "next/navigation";
import MessageActions from "@/components/admin/MessageActions";
import { requireAdmin } from "@/lib/auth/session";
import { formatWhen } from "@/lib/admin/format";
import { getMessage } from "@/lib/admin/queries";
import { idSchema } from "@/lib/admin/schemas";

export const metadata = { title: "Message" };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const m = await getMessage(id);
  if (!m) notFound();

  const subject = m.subject?.trim() || "your message";
  const mailto = `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${subject}`)}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/messages" className="text-sm font-semibold underline">
          ← Messages
        </Link>
        <h1 className="font-heading mt-2 break-words text-3xl">{m.subject?.trim() || "(no subject)"}</h1>
      </div>

      <article className="adm-card flex flex-col gap-4 p-4 sm:p-6">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="adm-hint">From</dt>
          <dd className="font-semibold">{m.name}</dd>
          <dt className="adm-hint">Email</dt>
          <dd className="break-all">
            <a className="underline" href={`mailto:${m.email}`}>
              {m.email}
            </a>
          </dd>
          {m.phone && (
            <>
              <dt className="adm-hint">Phone</dt>
              <dd>
                <a className="underline" href={`tel:${m.phone}`}>
                  {m.phone}
                </a>
              </dd>
            </>
          )}
          <dt className="adm-hint">Received</dt>
          <dd>{formatWhen(m.created_at)}</dd>
        </dl>
        <hr className="border-[var(--rule)]" />
        <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{m.body}</p>
      </article>

      <MessageActions id={m.id} read={m.read} mailto={mailto} />
    </div>
  );
}
