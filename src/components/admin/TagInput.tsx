"use client";

import { useId, useState } from "react";

/** Chip input: Enter or comma adds a tag (lowercased), × removes it. */
export default function TagInput({
  tags,
  onChange,
  label = "Tags",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
}) {
  const [text, setText] = useState("");
  const id = useId();

  function commitMany(parts: string[]) {
    const next = [...tags];
    for (const raw of parts) {
      const t = raw.trim().toLowerCase();
      if (t && t.length <= 40 && !next.includes(t)) next.push(t);
    }
    if (next.length !== tags.length) onChange(next);
  }
  function commit(raw: string) {
    setText("");
    commitMany([raw]);
  }

  return (
    <div>
      <label htmlFor={id} className="adm-label">
        {label}
      </label>
      <div className="adm-input flex flex-wrap items-center gap-1.5 !py-1">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded bg-[var(--surface)] py-0.5 pl-2 text-sm">
            {t}
            <button
              type="button"
              aria-label={`Remove tag ${t}`}
              className="flex h-8 w-8 items-center justify-center text-base font-bold hover:text-[var(--adm-danger)]"
              onClick={() => onChange(tags.filter((x) => x !== t))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          enterKeyHint="done"
          autoCapitalize="none"
          className="min-w-[6rem] flex-1 bg-transparent py-1 outline-none"
          placeholder={tags.length ? "" : "Type, then Enter"}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) {
              const parts = v.split(",");
              setText(parts.pop() ?? "");
              commitMany(parts);
            } else setText(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(text);
            } else if (e.key === "Backspace" && !text && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => commit(text)}
        />
      </div>
    </div>
  );
}
