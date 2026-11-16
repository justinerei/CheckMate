import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { googleIdentity } from "@/lib/google-identity";
import { normalizeEmail, verifyPassword } from "@/lib/password-auth";
import { cookies } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }), Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = normalizeEmail(credentials.email);
      const password = typeof credentials.password === "string" ? credentials.password : "";
      if (!email || !password || password.length > 128) return null;
      const user = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
      if (!user?.passwordHash || !user.enabled || (user.lockedUntil && user.lockedUntil > new Date())) return null;
      if (!await verifyPassword(password, user.passwordHash)) {
        const updated = await db.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } } });
        if (updated.failedLogins >= 5) await db.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000), failedLogins: 0 } });
        return null;
      }
      await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
      return { id: user.googleId, email: user.email, name: user.name };
    },
  })],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider !== "google" || !profile) return false;
      const identity = googleIdentity(profile);
      if (!identity) return false;
      const existing = await db.user.findUnique({ where: { googleId: identity.googleId } });
      if (existing && !existing.enabled) return false;
      if (!existing) {
        const collision = await db.user.findFirst({ where: { email: { equals: identity.email, mode: "insensitive" } } });
        if (collision) return false;
        const studentSignup = (await cookies()).get("checkmate-student-signup")?.value === "1";
        await db.user.create({ data: { ...identity, role: studentSignup ? "STUDENT" : "TEACHER" } });
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
