import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, subject, body } = await req.json();

  if (!title || !subject || !body) {
    return NextResponse.json({ error: "テンプレート名・件名・本文は必須です" }, { status: 400 });
  }

  const template = await prisma.template.create({
    data: { title, subject, body },
  });

  return NextResponse.json(template, { status: 201 });
}
