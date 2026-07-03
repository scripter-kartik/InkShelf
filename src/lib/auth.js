import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
export const authOptions = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!isDbConfigured()) {
                    throw new Error("Database not configured");
                }
                const email = credentials?.email?.toLowerCase().trim();
                const password = credentials?.password;
                if (!email || !password)
                    return null;
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
