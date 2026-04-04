"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MailEditor } from "@/components/mail/MailEditor";

export default function MailPage() {
  const router = useRouter();

  const handleSendReady = (subject: string, body: string) => {
    // subject/bodyをURLパラメータで渡す（長いのでsessionStorageに保存）
    sessionStorage.setItem("mail_subject", subject);
    sessionStorage.setItem("mail_body", body);
    router.push("/send");
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <MailEditor onSendReady={handleSendReady} />
      </main>
    </>
  );
}
