"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { issueFormToken, submitContact } from "@/app/[locale]/contact/actions";
import {
  FIELD_ORDER,
  LIMITS,
  PURPOSES,
  parseContact,
  type ContactField,
  type FieldErrors,
} from "@/lib/contact/schema";
import Monogram from "./Monogram";

const DOC =
  "relative border-2 border-navy bg-white/50 text-foreground shadow-[6px_6px_0_0_rgba(15,42,68,0.14)] dark:border-paper/70 dark:bg-navy-900/60 dark:shadow-none";
const STRIP =
  "flex items-center gap-3 border-b-2 border-navy bg-navy px-4 py-2.5 text-paper dark:border-paper/70 dark:bg-navy-900";
const ROW = "border-b border-rule px-4 py-3 sm:px-6";

function StripHeader({ label }: { label: string }) {
  return (
    <div className={STRIP}>
      <Monogram className="h-6 w-6 shrink-0" />
      <span className="diary-stamp text-xs sm:text-sm">{label}</span>
    </div>
  );
}

export default function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [token, setToken] = useState("");
  const [count, setCount] = useState(0);
  const [ref, setRef] = useState<string | null>(null);
  const stampPanel = useRef<HTMLDivElement>(null);

  // Signed render timestamp (anti-spam). Fetched on mount and after "Send another".
  useEffect(() => {
    if (ref !== null) return;
    let live = true;
    issueFormToken()
      .then((v) => live && setToken(v))
      .catch(() => live && setToken(""));
    return () => {
      live = false;
    };
  }, [ref]);

  useEffect(() => {
    if (ref !== null) stampPanel.current?.focus();
  }, [ref]);

  const msg = (field: ContactField) => {
    const code = errors[field];
    return code ? t(`errors.${code}` as "errors.name") : null;
  };

  function focusFirst(errs: FieldErrors) {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) document.getElementById(`cf-${first}`)?.focus();
  }

  function clear(field: ContactField) {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = parseContact(Object.fromEntries(fd.entries()));
    if (!parsed.ok) {
      setErrors(parsed.errors);
      focusFirst(parsed.errors);
      return;
    }
    setErrors({});
    if (!token) {
      setFormError(t("errors.notReady"));
      return;
    }
    fd.set("ft", token);
    fd.set("locale", locale);
    startTransition(async () => {
      try {
        const res = await submitContact(fd);
        if (res.ok) {
          setRef(res.ref);
          setCount(0);
        } else if (res.kind === "validation") {
          setErrors(res.errors);
          focusFirst(res.errors);
        } else if (res.kind === "rateLimit") {
          setFormError(t("errors.rateLimit"));
        } else {
          setFormError(t("errors.server"));
        }
      } catch {
        setFormError(t("errors.server"));
      }
    });
  }

  if (ref !== null) {
    return (
      <div
        ref={stampPanel}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={`${DOC} outline-none`}
      >
        <StripHeader label={t("formNo")} />
        <div className="flex flex-col items-center gap-6 px-6 py-12 text-center">
          <div
            className="stamp rounded-sm border-4 border-double border-pine px-6 py-3 text-pine dark:border-[#9bd0b8] dark:text-[#9bd0b8]"
            aria-hidden="true"
          >
            <span className="diary-stamp block text-3xl font-bold sm:text-4xl">
              {t("stamp.received")}
            </span>
          </div>
          <p className="font-heading text-xl font-semibold">{t("stamp.thanks")}</p>
          <p className="text-sm text-muted">
            {t("stamp.reference")}{" "}
            <span className="diary-stamp text-base font-bold text-foreground">{ref}</span>
          </p>
          <button
            type="button"
            className="btn border-navy text-navy hover:bg-navy hover:text-paper dark:border-paper dark:text-paper dark:hover:bg-paper dark:hover:text-navy"
            onClick={() => {
              setRef(null);
              setToken("");
              setErrors({});
              setFormError(null);
            }}
          >
            {t("stamp.sendAnother")}
          </button>
        </div>
      </div>
    );
  }

  function describedBy(field: ContactField, hint?: string) {
    const ids = [hint, errors[field] ? `cf-${field}-err` : null].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
  }

  const Req = () => (
    <span aria-hidden="true" className="ms-1 text-marigold-600 dark:text-marigold">
      *
    </span>
  );
  const Err = ({ field }: { field: ContactField }) =>
    errors[field] ? (
      <p id={`cf-${field}-err`} className="field-error mt-1 text-sm">
        {msg(field)}
      </p>
    ) : null;
  const Num = ({ n }: { n: number }) => (
    <span aria-hidden="true" className="diary-stamp me-2 text-marigold-600 dark:text-marigold">
      {String(n).padStart(2, "0")}
    </span>
  );
  const near = count > LIMITS.messageMax - 100;
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form onSubmit={onSubmit} noValidate className={DOC} aria-labelledby="cf-title">
      <StripHeader label={t("formNo")} />
      <div className={`${ROW} bg-surface/40`}>
        <h2 id="cf-title" className="font-heading text-lg font-semibold">
          {t("formTitle")}
        </h2>
        <p className="text-sm text-muted">{t("formHint")}</p>
      </div>

      {hasErrors && (
        <p role="alert" className="field-error border-b border-rule px-4 py-3 text-sm font-semibold sm:px-6">
          {t("errorsSummary")}
        </p>
      )}

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className={ROW}>
        <label htmlFor="cf-name" className="form-label">
          <Num n={1} />
          {t("fields.name")}
          <Req />
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={LIMITS.nameMax + 40}
          required
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          onChange={() => clear("name")}
          className="form-line"
        />
        <Err field="name" />
      </div>

      <div className={ROW}>
        <label htmlFor="cf-email" className="form-label">
          <Num n={2} />
          {t("fields.email")}
          <Req />
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          onChange={() => clear("email")}
          className="form-line"
        />
        <Err field="email" />
      </div>

      <div className={ROW}>
        <label htmlFor="cf-phone" className="form-label">
          <Num n={3} />
          {t("fields.phone")} <span className="normal-case">({t("optional")})</span>
        </label>
        <input
          id="cf-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={describedBy("phone", "cf-phone-hint")}
          onChange={() => clear("phone")}
          className="form-line"
        />
        <p id="cf-phone-hint" className="mt-1 text-xs text-muted">
          {t("hints.phone")}
        </p>
        <Err field="phone" />
      </div>

      <div className={ROW}>
        <label htmlFor="cf-purpose" className="form-label">
          <Num n={4} />
          {t("fields.purpose")}
          <Req />
        </label>
        <div className="relative">
          <select
            id="cf-purpose"
            name="purpose"
            defaultValue="general"
            required
            aria-required="true"
            aria-invalid={errors.purpose ? true : undefined}
            aria-describedby={describedBy("purpose")}
            onChange={() => clear("purpose")}
            className="form-line appearance-none pe-8"
          >
            {PURPOSES.map((p) => (
              <option key={p} value={p} className="bg-paper text-ink dark:bg-navy dark:text-paper">
                {t(`purposes.${p}`)}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 12 8"
            className="pointer-events-none absolute end-1 top-1/2 h-2 w-3 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M1 1.5 6 6.5 11 1.5" />
          </svg>
        </div>
        <Err field="purpose" />
      </div>

      <div className={ROW}>
        <label htmlFor="cf-subject" className="form-label">
          <Num n={5} />
          {t("fields.subject")} <span className="normal-case">({t("optional")})</span>
        </label>
        <input
          id="cf-subject"
          name="subject"
          type="text"
          maxLength={LIMITS.subjectMax + 40}
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={describedBy("subject")}
          onChange={() => clear("subject")}
          className="form-line"
        />
        <Err field="subject" />
      </div>

      <div className={ROW}>
        <label htmlFor="cf-message" className="form-label">
          <Num n={6} />
          {t("fields.message")}
          <Req />
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={6}
          required
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message", "cf-message-hint")}
          onChange={(e) => {
            setCount(e.target.value.length);
            clear("message");
          }}
          className="form-line"
        />
        <div id="cf-message-hint" className="mt-1 flex justify-between gap-3 text-xs text-muted">
          <span>{t("hints.message", { min: LIMITS.messageMin })}</span>
          <span className={near ? "font-semibold text-marigold-600 dark:text-marigold" : ""}>
            {t("counter", { count, max: LIMITS.messageMax })}
          </span>
        </div>
        <Err field="message" />
      </div>

      <div className={ROW}>
        <div className="flex items-start gap-3">
          <input
            id="cf-consent"
            name="consent"
            type="checkbox"
            required
            aria-required="true"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy("consent")}
            onChange={() => clear("consent")}
            className="mt-2.5 h-5 w-5 shrink-0 accent-navy dark:accent-marigold"
          />
          <label htmlFor="cf-consent" className="min-h-11 py-2 text-sm leading-snug">
            {t("consent")}
            <Req />
          </label>
        </div>
        <Err field="consent" />
      </div>

      <div className="flex flex-col gap-3 bg-surface/40 px-4 py-4 sm:px-6">
        {formError && (
          <p role="alert" className="field-error text-sm font-semibold">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="btn btn-primary self-start disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? t("sending") : t("submit")}
        </button>
      </div>
    </form>
  );
}
