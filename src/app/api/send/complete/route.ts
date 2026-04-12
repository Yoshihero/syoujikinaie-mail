import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getDevSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sendLogId } = await req.json();

  await prisma.sendLog.update({
    where: { id: sendLogId },
    data: { status: "completed" },
  });

  return NextResponse.json({ ok: true });
}
