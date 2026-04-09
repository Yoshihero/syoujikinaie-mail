"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MailEditor } from "@/components/mail/MailEditor";

export default function NewDraftPage() {
  const router = useRouter();

  const handleSave = async (subject: string, body: string) => {
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: subject || "無題の下書き", subject, body }),
    });
    const draft = await res.json();
    router.push(`/mail/edit/${draft.id}`);
  };

  const handleSendReady = async (subject: string, body: string) => {
    // まず下書き保存してからsend画面へ
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: subject || "無題の下書き", subject, body }),
    });
    const draft = await res.json();
    sessionStorage.setItem("mail_subject", subject);
    sessionStorage.setItem("mail_body", body);
    sessionStorage.setItem("mail_draft_id", draft.id);
    router.push("/send");
  };

  return (
    <AppShell>
      <main className="h-screen py-6 px-6 lg:px-10 max-w-[1600px] mx-auto">
        <MailEditor
          title="新規メール作成"
          onSave={handleSave}
          onSendReady={handleSendReady}
          saveLabel="下書き保存"
          showTemplateSave={true}
        />
      </main>
    </AppShell>
  );
}
