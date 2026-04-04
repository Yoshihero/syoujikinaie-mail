import { google } from "googleapis";
import { prisma } from "./prisma";
import { v4 as uuidv4 } from "uuid";

const FOOTER_SIGNATURE = `
──────────────────
株式会社　正直な家
東京都渋谷区代々木2-27-16-406
TEL：03-6300-6384　FAX：03-6300-6385
携帯：090-5790-8192　　田中輝一
ＨＰ：http://syoujikinaie.com/
`.trim();

interface Contact {
  id: string;
  companyName: string;
  department: string | null;
  position: string | null;
  name: string;
  email: string;
}

export function replaceFields(text: string, contact: Contact): string {
  return text
    .replace(/\{\{会社名\}\}/g, contact.companyName)
    .replace(/\{\{氏名\}\}/g, contact.name)
    .replace(/\{\{部署名\}\}/g, contact.department || "")
    .replace(/\{\{役職\}\}/g, contact.position || "");
}

export function buildMailBody(
  body: string,
  contact: Contact,
  unsubscribeUrl: string
): string {
  const replaced = replaceFields(body, contact);
  return `${replaced}

${FOOTER_SIGNATURE}

配信停止はこちら：${unsubscribeUrl}`;
}

export async function createUnsubscribeToken(
  contactId: string,
  baseUrl: string
): Promise<string> {
  const token = uuidv4();
  await prisma.unsubscribeToken.create({
    data: { contactId, token },
  });
  return `${baseUrl}/unsubscribe/${token}`;
}

export async function sendEmail(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body).toString("base64"),
  ];
  const message = messageParts.join("\n");
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });
}
