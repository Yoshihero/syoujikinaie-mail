import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import { validateAndMapRows } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await getDevSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { rows, mapping, source } = body as {
      rows: Record<string, string>[];
      mapping: Record<string, string>;
      source: string;
    };

    const { validRows, errors } = validateAndMapRows(rows, mapping);

    if (validRows.length === 0) {
      return NextResponse.json({ imported: 0, updated: 0, errorCount: errors.length, errors });
    }

    // CSV内の重複メールは最後の行を採用（＝最新データで上書き）
    const deduped = new Map(validRows.map((r) => [r.email, r]));
    const uniqueRows = Array.from(deduped.values());

    // 既存メールを一括取得
    const emails = uniqueRows.map((r) => r.email);
    const existingContacts = await prisma.contact.findMany({
      where: { email: { in: emails } },
      select: { email: true, companyName: true, department: true, position: true, name: true, source: true },
    });
    const existingMap = new Map(existingContacts.map((c) => [c.email, c]));

    // 新規レコード: createManyで一括挿入（1クエリ）
    const newRows = uniqueRows.filter((r) => !existingMap.has(r.email));
    if (newRows.length > 0) {
      await prisma.contact.createMany({
        data: newRows.map((row) => ({
          companyName: row.companyName,
          department: row.department || null,
          position: row.position || null,
          name: row.name,
          email: row.email,
          source: source || null,
          importedAt: new Date(),
        })),
      });
    }

    // 既存レコード: transactionで一括更新
    const updateRows = uniqueRows.filter((r) => existingMap.has(r.email));
    if (updateRows.length > 0) {
      const updateOps = updateRows.map((row) => {
        const existing = existingMap.get(row.email)!;
        return prisma.contact.update({
          where: { email: row.email },
          data: {
            companyName: row.companyName || existing.companyName,
            department: row.department || existing.department,
            position: row.position || existing.position,
            name: row.name || existing.name,
            source: source || existing.source,
            importedAt: new Date(),
          },
        });
      });
      await prisma.$transaction(updateOps);
    }

    return NextResponse.json({
      imported: newRows.length,
      updated: updateRows.length,
      errorCount: errors.length,
      errors,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "インポート処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
