"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MailEditor } from "@/components/mail/MailEditor";

interface Template {
  id: string;
  title: string;
  subject: string;
  body: string;
}

export default function TemplateEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setTemplate)
      .catch(() => router.push("/mail/templates"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async (subject: string, body: string) => {
    await fetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: template?.title, subject, body }),
    });
    router.push("/mail/templates");
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

  if (!template) return null;

  return (
    <AppShell>
      <main className="h-screen py-6 px-6 lg:px-10 max-w-[1600px] mx-auto">
        <MailEditor
          title={`テンプレート: ${template.title}`}
          initialSubject={template.subject}
          initialBody={template.body}
          onSave={handleSave}
          saveLabel="テンプレート保存"
          showTemplateSave={false}
        />
      </main>
    </AppShell>
  );
}
