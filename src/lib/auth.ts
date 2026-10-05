import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/lib/settings/policy";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "supplier@msme.in" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        // Same message for unknown email and wrong password, so the login form
        // can't be used to discover which emails are registered.
        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          businessName: user.businessName || "",
          udyamNumber: user.udyamNumber || "",
          role: normalizeRole(user.role),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.businessName = (user as any).businessName;
        token.udyamNumber = (user as any).udyamNumber;
        token.role = normalizeRole((user as any).role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).businessName = token.businessName as string;
        (session.user as any).udyamNumber = token.udyamNumber as string;
        // Also corrects sessions issued before roles were normalized (e.g. a legacy "USER" role)
        (session.user as any).role = normalizeRole(token.role);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // No hard-coded fallback in production: a known secret would let anyone forge
  // session tokens. NextAuth refuses to start in production without one.
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "dev-only-insecure-secret-do-not-use-in-prod"),
};
