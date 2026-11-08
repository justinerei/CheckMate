import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { googleIdentity } from "@/lib/google-identity";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile) return false;
      const identity = googleIdentity(profile);
      if (!identity) return false;
      const existing = await db.user.findUnique({ where: { googleId: identity.googleId } });
      if (existing && !existing.enabled) return false;
      if (!existing) await db.user.create({ data: identity });
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
