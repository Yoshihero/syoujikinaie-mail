import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

  if (validRows.length === 0) {
    return NextResponse.json({ imported: 0, updated: 0, errorCount: errors.length, errors });
  }

  // 既存メールを一括取得（imported/updated カウント用）
  const emails = validRows.map((r) => r.email);
  const existingContacts = await prisma.contact.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingSet = new Set(existingContacts.map((c) => c.email));

  // 生SQLで一括INSERT ... ON CONFLICT（1クエリで全件処理）
  const now = new Date().toISOString();
  const values = validRows.map(
    (row) =>
      Prisma.sql`(gen_random_uuid(), ${row.companyName}, ${row.department || null}, ${row.position || null}, ${row.name}, ${row.email}, true, ${source || null}, ${now}::timestamptz, ${now}::timestamptz, ${now}::timestamptz)`
  );

  await prisma.$executeRaw`
    INSERT INTO contacts (id, company_name, department, position, name, email, is_active, source, imported_at, created_at, updated_at)
    VALUES ${Prisma.join(values)}
    ON CONFLICT (email) DO UPDATE SET
      company_name = CASE WHEN EXCLUDED.company_name != '' THEN EXCLUDED.company_name ELSE contacts.company_name END,
      department = CASE WHEN EXCLUDED.department IS NOT NULL AND EXCLUDED.department != '' THEN EXCLUDED.department ELSE contacts.department END,
      position = CASE WHEN EXCLUDED.position IS NOT NULL AND EXCLUDED.position != '' THEN EXCLUDED.position ELSE contacts.position END,
      name = CASE WHEN EXCLUDED.name != '' THEN EXCLUDED.name ELSE contacts.name END,
      source = CASE WHEN EXCLUDED.source IS NOT NULL AND EXCLUDED.source != '' THEN EXCLUDED.source ELSE contacts.source END,
      imported_at = EXCLUDED.imported_at,
      updated_at = EXCLUDED.updated_at
  `;

  const imported = validRows.filter((r) => !existingSet.has(r.email)).length;
  const updated = validRows.filter((r) => existingSet.has(r.email)).length;

  return NextResponse.json({
    imported,
    updated,
    errorCount: errors.length,
    errors,
  });
}
