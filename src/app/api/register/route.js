import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
export async function POST(request) {
    if (!isDbConfigured()) {
        return NextResponse.json({ error: "Database not configured. Set MONGODB_URI to enable sign-up." }, { status: 503 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const name = body?.name?.trim();
    const email = body?.email?.toLowerCase().trim();
    const password = body?.password;
    if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    try {
        await connectToDatabase();
        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
        }
        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name || email.split("@")[0],
            email,
            password: hashed,
            provider: "credentials",
        });
        return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email }, { status: 201 });
    }
    catch (err) {
        console.error("Registration failed:", err.message);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
