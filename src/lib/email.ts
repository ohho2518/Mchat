interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — email skipped')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MChat <noreply@mchat.app>',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    })
    if (!res.ok) console.error('[email] Resend API error:', await res.text())
    return res.ok
  } catch (err) {
    console.error('[email] Send failed:', err)
    return false
  }
}

export function buildVerifyEmailHtml(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#374151;">
  <h1 style="font-size:20px;color:#1e40af;margin-bottom:8px;">ยืนยันอีเมล MChat</h1>
  <p>สวัสดีคุณ <strong>${name}</strong></p>
  <p>กดปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
  <a href="${verifyUrl}"
     style="display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:12px 0;">
    ยืนยันอีเมล
  </a>
  <p style="font-size:12px;color:#9ca3af;margin-top:16px;">
    ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง<br>
    หากไม่ได้สมัคร MChat กรุณาเพิกเฉยอีเมลนี้
  </p>
</body>
</html>`
}
