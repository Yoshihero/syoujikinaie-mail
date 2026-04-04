import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "トークンが必要です" }, { status: 400 });
  }

  const record = await prisma.unsubscribeToken.findUnique({
    where: { token },
    include: { contact: true },
  });

  if (!record) {
    return NextResponse.json({ error: "無効なリンクです" }, { status: 404 });
  }

  if (!record.contact.isActive) {
    return NextResponse.json({ ok: true, alreadyUnsubscribed: true });
  }

  await prisma.contact.update({
    where: { id: record.contactId },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
