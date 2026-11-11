"use client";

import { forwardRef, useId } from "react";

/** Modal built on native <dialog> (focus trap, Esc to close). Open with ref.current.showModal(). */
const Dialog = forwardRef<
  HTMLDialogElement,
  { title: string; children: React.ReactNode }
>(function Dialog({ title, children }, ref) {
  const id = useId();
  return (
    <dialog ref={ref} className="adm-dialog" aria-labelledby={id}>
      <h2 id={id} className="font-heading mb-3 text-xl">
        {title}
      </h2>
      {children}
    </dialog>
  );
});

export default Dialog;
