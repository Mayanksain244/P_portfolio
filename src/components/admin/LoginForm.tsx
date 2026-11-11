"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions/auth";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="username" className="adm-label">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="adm-input"
          style={{ color: "var(--color-ink)", background: "#fffdf8" }}
        />
      </div>
      <div>
        <label htmlFor="password" className="adm-label">
          Password
        </label>
        <div className="flex gap-2">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="adm-input"
            style={{ color: "var(--color-ink)", background: "#fffdf8" }}
          />
          <button
            type="button"
            className="adm-btn adm-btn-sm"
            style={{ color: "var(--color-paper)", borderColor: "rgba(244,239,230,.5)" }}
            aria-pressed={show}
            onClick={() => setShow((s) => !s)}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div aria-live="polite" className="min-h-5">
        {state?.error && (
          <p role="alert" className="text-sm font-semibold text-[#ffb3a6]">
            {state.error}
          </p>
        )}
      </div>
      <button type="submit" disabled={pending} className="adm-btn adm-btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
