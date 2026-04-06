import { NextAuthOptions, getServerSession as _getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

const skipAuth = process.env.DEV_SKIP_AUTH === "true";

// 開発時に認証スキップ対応の getServerSession ラッパー
const FAKE_SESSION = { user: { id: "dev", name: "開発ユーザー", email: "dev@localhost" }, expires: "2099-12-31" };

export async function getDevSession() {
  if (skipAuth) return FAKE_SESSION;
  return _getServerSession(authOptions);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.send",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
