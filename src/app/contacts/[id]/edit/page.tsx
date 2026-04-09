"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { ContactForm } from "@/components/contacts/ContactForm";

interface ContactData {
  id: string;
  companyName: string;
  department: string;
  position: string;
  name: string;
  email: string;
}

export default function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setContact(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </main>
      </AppShell>
    );
  }

  if (!contact) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-red-500">宛先が見つかりません</p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-6">
          <Link href="/contacts" className="text-sm text-primary hover:underline">
            ← 宛先一覧に戻る
          </Link>
        </div>
        <h2 className="text-2xl font-bold mb-6">宛先 編集</h2>
        <ContactForm initialData={contact} isEdit />
      </main>
    </AppShell>
  );
}
