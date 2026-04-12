import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getDevSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    orderBy: { companyName: "asc" },
  });

  const header = "会社名,部署名,役職,氏名,メールアドレス,配信可否,取込元,最終更新日時";
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = contacts.map((c) =>
    [
      esc(c.companyName),
      esc(c.department || ""),
      esc(c.position || ""),
      esc(c.name),
      esc(c.email),
      c.isActive ? "配信可" : "配信停止",
      esc(c.source || ""),
      c.updatedAt.toISOString(),
    ].join(",")
  );

  const csv = "\uFEFF" + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
