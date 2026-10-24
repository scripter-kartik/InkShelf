import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit, clientIp } from "@/lib/store";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const authOptions = {
    providers: [
        ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
            ? [
                Google({
                    clientId: process.env.GOOGLE_ID,
                    clientSecret: process.env.GOOGLE_SECRET,
                }),
            ]
            : []),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!isDbConfigured()) {
                    throw new Error("Database not configured");
                }
                const email = credentials?.email?.toLowerCase().trim();
                const password = credentials?.password;
                if (!email || !password)
                    return null;
                const [byIp, byEmail] = await Promise.all([
                    rateLimit(`login-ip:${clientIp(req?.headers)}`, 30, LOGIN_WINDOW_MS),
                    rateLimit(`login-email:${email}`, 8, LOGIN_WINDOW_MS),
                ]);
                if (!byIp.allowed || !byEmail.allowed) {
                    throw new Error("TooManyAttempts");
                }
                await connectToDatabase();
                const user = await User.findOne({ email }).select("+password");
                if (!user || !user.password)
                    return null;
                const ok = await bcrypt.compare(password, user.password);
                if (!ok)
                    return null;
                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image || null,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {},
    callbacks: {
        async jwt({ token, user }) {
            if (user)
                token.id = user.id;
            return token;
        },
        async session({ session, token }) {
            if (session.user)
                session.user.id = token.id;
            return session;
        },
    },
};
