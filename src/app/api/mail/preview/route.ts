import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { replaceFields } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, body } = await req.json();

  const sampleContact = {
    id: "sample",
    companyName: "サンプル株式会社",
    department: "営業部",
    position: "部長",
    name: "山田太郎",
    email: "sample@example.com",
  };

  const previewSubject = replaceFields(subject, sampleContact);
  const previewBody = replaceFields(body, sampleContact);

  return NextResponse.json({
    subject: previewSubject,
    body: previewBody,
  });
}
