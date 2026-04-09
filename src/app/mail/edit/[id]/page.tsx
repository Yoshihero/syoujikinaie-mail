"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MailEditor } from "@/components/mail/MailEditor";

interface Draft {
  id: string;
  title: string;
  subject: string;
  body: string;
}

export default function DraftEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/drafts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setDraft)
      .catch(() => router.push("/mail"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async (subject: string, body: string) => {
    await fetch(`/api/drafts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft?.title, subject, body }),
    });
    router.push("/mail");
  };

  const handleSendReady = (subject: string, body: string) => {
    sessionStorage.setItem("mail_subject", subject);
    sessionStorage.setItem("mail_body", body);
    sessionStorage.setItem("mail_draft_id", id);
    router.push("/send");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </AppShell>
    );
  }

  if (!draft) return null;

  return (
    <AppShell>
      <main className="h-screen py-6 px-6 lg:px-10 max-w-[1600px] mx-auto">
        <MailEditor
          title={`${draft.title} を編集`}
          initialSubject={draft.subject}
          initialBody={draft.body}
          onSave={handleSave}
          onSendReady={handleSendReady}
          saveLabel="下書き保存"
          showTemplateSave={true}
        />
      </main>
    </AppShell>
  );
}
