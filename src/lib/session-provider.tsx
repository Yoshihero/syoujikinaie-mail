"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

const skipAuth = process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";

const fakeSession = {
  user: { id: "dev", name: "開発ユーザー", email: "dev@localhost" },
  expires: "2099-12-31",
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  if (skipAuth) {
    return (
      <NextAuthSessionProvider session={fakeSession as never}>
        {children}
      </NextAuthSessionProvider>
    );
  }
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
