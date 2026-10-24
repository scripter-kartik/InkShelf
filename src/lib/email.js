const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "InkShelf <onboarding@resend.dev>";

export const emailConfigured = Boolean(RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    } else {
      console.warn("Email not sent: RESEND_API_KEY is not configured.");
    }
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`Email send failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
  return true;
}
