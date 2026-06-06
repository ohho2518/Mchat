// fire-and-forget — ไม่ throw ไม่ block UI
export function trackEvent(
  event: string,
  meta?: Record<string, unknown>,
): void {
  fetch('/api/events', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ event, meta }),
  }).catch(() => { /* swallow — tracking must never break the app */ })
}
