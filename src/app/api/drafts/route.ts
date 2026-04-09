import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getDevSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drafts = await prisma.draft.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  const session = await getDevSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, subject, body } = await req.json();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const draft = await prisma.draft.create({
    data: { title, subject: subject || "", body: body || "" },
  });
  return NextResponse.json(draft, { status: 201 });
}
