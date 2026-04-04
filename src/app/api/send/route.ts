import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMailBody, createUnsubscribeToken, sendEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { subject, body, contactIds } = await req.json();

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  if (!account?.access_token) {
    return new Response(
      JSON.stringify({ error: "Googleアカウントの認証情報が見つかりません" }),
      { status: 401 }
    );
  }

  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: contactIds },
      isActive: true,
    },
  });

  const senderEmail = session.user.email!;
  const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Server-Sent Events で進捗を通知
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let sent = 0;
      let failed = 0;

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];

        try {
          const unsubscribeUrl = await createUnsubscribeToken(contact.id, baseUrl);
          const mailBody = buildMailBody(body, contact, unsubscribeUrl);

          await sendEmail(
            account.access_token!,
            senderEmail,
            contact.email,
            subject,
            mailBody
          );
          sent++;
        } catch {
          failed++;
        }

        send({
          type: "progress",
          current: i + 1,
          total: contacts.length,
          sent,
          failed,
          currentEmail: contact.email,
        });

        // 送信間隔（最後の1通以外）
        if (i < contacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      send({
        type: "complete",
        total: contacts.length,
        sent,
        failed,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
