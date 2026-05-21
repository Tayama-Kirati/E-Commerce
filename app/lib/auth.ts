import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
 
export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
 
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile: any) {
        return {
          id:        profile.sub,
          name:      profile.name,
          firstName: profile.given_name,
          lastName:  profile.family_name,
          email:     profile.email,
          avatar:    profile.picture,
          role:      "CUSTOMER",
        };
      },
    }),
 
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email:    z.string().email(),
          password: z.string().min(6),
        }).safeParse(credentials);
 
        if (!parsed.success) throw new Error("Invalid credentials");
 
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
 
        if (!user?.passwordHash) throw new Error("Account not found");
        if (user.isBanned)        throw new Error("Account suspended");
 
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) throw new Error("Incorrect password");
 
        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLogin: new Date() },
        });
 
        return {
          id:     user.id,
          email:  user.email,
          name:   user.name,
          role:   user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
 
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id     = user.id;
        token.role   = (user as any).role;
        token.avatar = (user as any).avatar;
      }
      // Allow session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      return token;
    },
 
    async session({ session, token }) {
      if (token) {
        session.user.id     = token.id as string;
        session.user.role   = token.role as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
 
  pages: {
    signIn:  "/login",
    error:   "/login",
    newUser: "/onboarding",
  },
 
  events: {
    async createUser({ user }) {
      // Welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id!,
          type:   "SYSTEM",
          title:  "Welcome to PeaNut! 🎉",
          body:   "You've earned 100 welcome points! Start shopping to earn more.",
        },
      });
      // Welcome loyalty points
      await prisma.loyaltyTransaction.create({
        data: {
          userId:      user.id!,
          points:      100,
          type:        "BONUS",
          description: "Welcome bonus",
        },
      });
      await prisma.user.update({
        where: { id: user.id! },
        data:  { loyaltyPoints: 100 },
      });
    },
  },
};
 
// Module augmentation so session.user.id / .role / .avatar are typed
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      avatar: string;
      email: string;
      name?: string | null;
    };
  }
}
 