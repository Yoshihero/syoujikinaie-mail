import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMailBody, sendEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, body } = await req.json();

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  if (!account?.access_token) {
    return NextResponse.json({ error: "Googleアカウントの認証情報が見つかりません。再ログインしてください。" }, { status: 401 });
  }

  const senderEmail = session.user.email!;
  const testContact = {
    id: "test",
    companyName: "テスト株式会社",
    department: "テスト部",
    position: "テスト役職",
    name: "テスト太郎",
    email: senderEmail,
  };

  const mailBody = buildMailBody(
    body,
    testContact,
    "(テスト送信のため配信停止リンクは無効です)"
  );

  try {
    await sendEmail(
      account.access_token,
      senderEmail,
      senderEmail,
      `[テスト] ${subject}`,
      mailBody
    );
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "送信に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
