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

    // 既存メールを一括取得（カウント用）
    const emails = uniqueRows.map((r) => r.email);
    const existingContacts = await prisma.contact.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existingSet = new Set(existingContacts.map((c) => c.email));

    // 生SQLで一括upsert（1クエリ、新規も更新もまとめて処理）
    const placeholders = uniqueRows.map((_, i) => {
      const b = i * 6;
      return `(gen_random_uuid(), $${b+1}, $${b+2}, $${b+3}, $${b+4}, $${b+5}, true, $${b+6}, NOW(), NOW(), NOW())`;
    }).join(", ");

    const params = uniqueRows.flatMap((row) => [
      row.companyName,
      row.department || null,
      row.position || null,
      row.name,
      row.email,
      source || null,
    ]);

    await prisma.$executeRawUnsafe(`
      INSERT INTO contacts (id, company_name, department, position, name, email, is_active, source, imported_at, created_at, updated_at)
      VALUES ${placeholders}
      ON CONFLICT (email) DO UPDATE SET
        company_name = CASE WHEN EXCLUDED.company_name != '' THEN EXCLUDED.company_name ELSE contacts.company_name END,
        department = CASE WHEN EXCLUDED.department IS NOT NULL AND EXCLUDED.department != '' THEN EXCLUDED.department ELSE contacts.department END,
        position = CASE WHEN EXCLUDED.position IS NOT NULL AND EXCLUDED.position != '' THEN EXCLUDED.position ELSE contacts.position END,
        name = CASE WHEN EXCLUDED.name != '' THEN EXCLUDED.name ELSE contacts.name END,
        source = CASE WHEN EXCLUDED.source IS NOT NULL AND EXCLUDED.source != '' THEN EXCLUDED.source ELSE contacts.source END,
        imported_at = NOW(),
        updated_at = NOW()
    `, ...params);

    const imported = uniqueRows.filter((r) => !existingSet.has(r.email)).length;
    const updated = uniqueRows.filter((r) => existingSet.has(r.email)).length;

    return NextResponse.json({
      imported,
      updated,
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
