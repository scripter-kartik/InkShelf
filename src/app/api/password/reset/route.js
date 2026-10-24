import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase, isDbConfigured } from "@/lib/mongodb";
import { rateLimit, clientIp } from "@/lib/store";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

export async function POST(request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { allowed } = await rateLimit(`reset-ip:${clientIp(request.headers)}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await PasswordResetToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (!record) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(record.userId, { password: hashed });
    await PasswordResetToken.deleteMany({ userId: record.userId });
    if (!user) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("Password reset failed:", err.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
