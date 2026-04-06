import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// DEV_SKIP_AUTH=true で認証をスキップ（開発用プレビュー）
const skipAuth = process.env.DEV_SKIP_AUTH === "true";

export default async function middleware(req: NextRequest) {
  if (skipAuth) return NextResponse.next();

  const token = await getToken({ req });

  if (!token) {
    const signInUrl = new URL("/", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/contacts/:path*", "/mail/:path*", "/send/:path*"],
};
