import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const skipAuth = process.env.DEV_SKIP_AUTH === "true";

const fakeSession = {
  user: { id: "dev", name: "開発ユーザー", email: "dev@localhost", image: null },
  expires: "2099-12-31T00:00:00.000Z",
};

function devHandler(req: NextRequest) {
  const url = new URL(req.url);
  // /api/auth/session へのリクエストにフェイクセッションを返す
  if (url.pathname.endsWith("/session")) {
    return NextResponse.json(fakeSession);
  }
  // providers, csrf などは空で返す
  if (url.pathname.endsWith("/providers")) {
    return NextResponse.json({});
  }
  if (url.pathname.endsWith("/csrf")) {
    return NextResponse.json({ csrfToken: "dev-token" });
  }
  return NextResponse.json({});
}

const handler = skipAuth ? devHandler : NextAuth(authOptions);

export { handler as GET, handler as POST };
