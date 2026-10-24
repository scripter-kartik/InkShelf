import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { connectToDatabase, isDbConfigured } from "@/lib/mongodb";
import { rateLimit, clientIp } from "@/lib/store";
import { sendEmail } from "@/lib/email";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const GENERIC_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

function baseUrl(request) {
  return (process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`forgot-ip:${clientIp(request.headers)}`, 10, TOKEN_TTL_MS),
    rateLimit(`forgot-email:${email}`, 3, TOKEN_TTL_MS),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email }).select("+password");
    if (user?.password) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await PasswordResetToken.deleteMany({ userId: user._id });
      await PasswordResetToken.create({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      });

      const link = `${baseUrl(request)}/reset-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: "Reset your InkShelf password",
        text: `Hi ${user.name || "reader"},\n\nUse this link to reset your InkShelf password. It expires in 1 hour.\n\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        html: `<p>Hi ${escapeHtml(user.name || "reader")},</p><p>Use the button below to reset your InkShelf password. It expires in 1 hour.</p><p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#22c55e;color:#000;border-radius:999px;text-decoration:none;font-weight:600">Reset password</a></p><p>If you didn't ask for this, you can ignore this email.</p>`,
      });
    }
  } catch (err) {
    console.error("Forgot password failed:", err.message);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
