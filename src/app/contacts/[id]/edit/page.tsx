"use client";

import { useEffect, useState, use } from "react";
import { Header } from "@/components/layout/Header";
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
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </main>
      </>
    );
  }

  if (!contact) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-red-500">宛先が見つかりません</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ContactForm initialData={contact} isEdit />
      </main>
    </>
  );
}
