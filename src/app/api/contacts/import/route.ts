import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import { validateAndMapRows } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await getDevSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { rows, mapping, source } = body as {
    rows: Record<string, string>[];
    mapping: Record<string, string>;
    source: string;
  };

  const { validRows, errors } = validateAndMapRows(rows, mapping);

  // 既存メールアドレスを一括取得（1クエリ）
  const emails = validRows.map((r) => r.email);
  const existingContacts = await prisma.contact.findMany({
    where: { email: { in: emails } },
    select: { email: true, companyName: true, department: true, position: true, name: true, source: true },
  });
  const existingMap = new Map(existingContacts.map((c) => [c.email, c]));

  // upsert操作をトランザクションで一括実行
  const ops = validRows.map((row) => {
    const existing = existingMap.get(row.email);
    return prisma.contact.upsert({
      where: { email: row.email },
      update: {
        companyName: row.companyName || existing?.companyName || row.companyName,
        department: row.department || existing?.department || null,
        position: row.position || existing?.position || null,
        name: row.name || existing?.name || row.name,
        source: source || existing?.source || null,
        importedAt: new Date(),
      },
      create: {
        companyName: row.companyName,
        department: row.department || null,
        position: row.position || null,
        name: row.name,
        email: row.email,
        source: source || null,
        importedAt: new Date(),
      },
    });
  });

  const results = await prisma.$transaction(ops);

  const imported = validRows.filter((r) => !existingMap.has(r.email)).length;
  const updated = validRows.filter((r) => existingMap.has(r.email)).length;

  return NextResponse.json({
    imported,
    updated,
    errorCount: errors.length,
    errors,
  });
}
