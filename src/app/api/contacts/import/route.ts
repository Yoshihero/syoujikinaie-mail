import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAndMapRows } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { rows, mapping, source } = body as {
    rows: Record<string, string>[];
    mapping: Record<string, string>;
    source: string;
  };

  const { validRows, errors } = validateAndMapRows(rows, mapping);

  let imported = 0;
  let updated = 0;

  for (const row of validRows) {
    const existing = await prisma.contact.findUnique({
      where: { email: row.email },
    });

    if (existing) {
      await prisma.contact.update({
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
      updated++;
    } else {
      await prisma.contact.create({
        data: {
          companyName: row.companyName,
          department: row.department || null,
          position: row.position || null,
          name: row.name,
          email: row.email,
          source: source || null,
          importedAt: new Date(),
        },
      });
      imported++;
    }
  }

  return NextResponse.json({
    imported,
    updated,
    errorCount: errors.length,
    errors,
  });
}
