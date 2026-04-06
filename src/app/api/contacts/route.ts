import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getDevSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where = query
    ? {
        OR: [
          { companyName: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ contacts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getDevSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { companyName, department, position, name, email } = body;

  if (!companyName || !name || !email) {
    return NextResponse.json({ error: "会社名・氏名・メールアドレスは必須です" }, { status: 400 });
  }

  const existing = await prisma.contact.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
  }

  const contact = await prisma.contact.create({
    data: {
      companyName,
      department: department || null,
      position: position || null,
      name,
      email,
      source: "手動",
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
