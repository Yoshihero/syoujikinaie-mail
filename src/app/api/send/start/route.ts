import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getDevSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, body, totalCount } = await req.json();

  const sendLog = await prisma.sendLog.create({
    data: {
      subject,
      body,
      totalCount,
      sentCount: 0,
      failedCount: 0,
      senderEmail: session.user.email!,
      status: "in_progress",
    },
  });

  return NextResponse.json({ sendLogId: sendLog.id });
}
