"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteMessage, setMessageRead } from "@/app/admin/actions/messages";
import Dialog from "./Dialog";
import { useToast } from "./Toast";

export default function MessageActions({
  id,
  read: initialRead,
  mailto,
}: {
  id: string;
  read: boolean;
  mailto: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [read, setRead] = useState(initialRead);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);
  const marked = useRef(false);

  // Opening a message marks it read.
  useEffect(() => {
    if (initialRead || marked.current) return;
    marked.current = true;
    void setMessageRead(id, true).then((r) => {
      if (r.ok) {
        setRead(true);
        router.refresh();
      }
    });
  }, [id, initialRead, router]);

  function toggle() {
    start(async () => {
      const r = await setMessageRead(id, !read);
      if (!r.ok) return toast(r.error, "error");
      setRead(!read);
      toast(read ? "Marked as unread." : "Marked as read.");
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const r = await deleteMessage(id);
      if (!r.ok) return toast(r.error, "error");
      ref.current?.close();
      toast("Message deleted.");
      router.replace("/admin/messages");
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a href={mailto} className="adm-btn adm-btn-primary">
        Reply by email
      </a>
      <button type="button" className="adm-btn" disabled={pending} onClick={toggle}>
        {read ? "Mark as unread" : "Mark as read"}
      </button>
      <button type="button" className="adm-btn adm-btn-danger" disabled={pending} onClick={() => ref.current?.showModal()}>
        Delete
      </button>
      <Dialog ref={ref} title="Delete this message?">
        <p className="text-sm">This permanently removes the message. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="adm-btn" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="button" className="adm-btn adm-btn-danger-solid" disabled={pending} onClick={remove}>
            Delete
          </button>
        </div>
      </Dialog>
    </div>
  );
}
