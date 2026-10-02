// Classify a generation failure so the UI can tell an overloaded/rate-limited
// condition (transient, "try again shortly") apart from a genuine error.
// A busy error is stored with a "busy:" prefix on the proposal's error field.
export function genErrorMessage(e: any): string {
  const status = e?.status ?? e?.statusCode;
  const msg = String((e && e.message) || "generation_failed");
  const lower = msg.toLowerCase();
  const busy =
    status === 429 ||
    status === 529 ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("overloaded") ||
    lower.includes("too many requests") ||
    lower.includes("429") ||
    lower.includes("529");
  return busy ? "busy:" + msg : msg;
}
