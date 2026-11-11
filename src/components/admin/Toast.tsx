"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Kind = "success" | "error";
type ToastItem = { id: number; kind: Kind; text: string };
type Ctx = { toast: (text: string, kind?: Kind) => void };

const ToastContext = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((text: string, kind: Kind = "success") => {
    const id = nextId.current++;
    setItems((cur) => [...cur.slice(-2), { id, kind, text }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex max-w-md items-start gap-2 rounded px-4 py-3 text-sm font-semibold shadow-lg ${
              t.kind === "error" ? "bg-[#a32d1f] text-white" : "bg-navy text-paper ring-1 ring-marigold"
            }`}
          >
            <span aria-hidden="true">{t.kind === "error" ? "!" : "✓"}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
