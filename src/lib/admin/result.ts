export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fail(
  error: string,
  fieldErrors?: Record<string, string>,
): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, ...(fieldErrors ? { fieldErrors } : {}) };
}

/** Logs the real error server-side and returns a friendly message. */
export function dbFail(
  context: string,
  err: unknown,
  message = "Something went wrong. Please try again.",
) {
  const e = err as { code?: string; message?: string } | null;
  console.error(`[admin] ${context}: ${e?.code ?? ""} ${e?.message ?? String(err)}`);
  return fail(message);
}

export function zodFieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
