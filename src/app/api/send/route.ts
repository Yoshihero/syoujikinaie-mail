import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import { buildMailBody, createUnsubscribeToken, getValidAccessToken, sendEmail } from "@/lib/mail";

const BATCH_LIMIT = 3;

export async function POST(req: NextRequest) {
  const session = await getDevSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, body, contactIds, sendLogId } = await req.json();

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return NextResponse.json({ error: "送信先が指定されていません" }, { status: 400 });
  }

  if (contactIds.length > BATCH_LIMIT) {
    return NextResponse.json(
      { error: `1回のリクエストは${BATCH_LIMIT}件までです` },
      { status: 400 }
    );
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "Googleアカウントの認証情報が見つかりません" },
      { status: 401 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(account.id);
  } catch {
    return NextResponse.json(
      { error: "Googleアカウントの認証情報が期限切れです。再ログインしてください。" },
      { status: 401 }
    );
  }

  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: contactIds },
      isActive: true,
    },
  });

  const senderEmail = session.user.email!;
  const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

  let sent = 0;
  let failed = 0;
  const errors: { email: string; reason: string }[] = [];

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    let status = "sent";
    let errorMsg: string | null = null;

    try {
      const unsubscribeUrl = await createUnsubscribeToken(contact.id, baseUrl);
      const mailBody = buildMailBody(body, contact, unsubscribeUrl);

      await sendEmail(
        accessToken,
        senderEmail,
        contact.email,
        subject,
        mailBody
      );
      sent++;
    } catch (err) {
      console.error(`[send] 送信失敗 (${contact.email}):`, err);
      failed++;
      status = "failed";
      errorMsg = err instanceof Error ? err.message : "送信に失敗しました";
      errors.push({ email: contact.email, reason: errorMsg });
    }

    // 送信履歴の詳細を記録
    if (sendLogId) {
      await prisma.sendLogDetail.create({
        data: {
          sendLogId,
          contactId: contact.id,
          email: contact.email,
          status,
          error: errorMsg,
        },
      });
    }

    // 送信間隔（最後の1通以外）
    if (i < contacts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // 送信履歴の���計を更新
  if (sendLogId) {
    const totals = await prisma.sendLogDetail.groupBy({
      by: ["status"],
      where: { sendLogId },
      _count: true,
    });
    const sentTotal = totals.find((t) => t.status === "sent")?._count ?? 0;
    const failedTotal = totals.find((t) => t.status === "failed")?._count ?? 0;
    await prisma.sendLog.update({
      where: { id: sendLogId },
      data: { sentCount: sentTotal, failedCount: failedTotal },
    });
  }

  return NextResponse.json({ sent, failed, processed: contacts.length, errors });
}
