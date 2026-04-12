"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ContactSearch } from "@/components/contacts/ContactSearch";
import { ContactTable } from "@/components/contacts/ContactTable";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  companyName: string;
  department: string | null;
  position: string | null;
  name: string;
  email: string;
  isActive: boolean;
  source: string | null;
}

function ContactsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    setContacts(data.contacts);
    setTotal(data.total);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDelete = async (id: string) => {
    if (!confirm("この宛先を削除しますか？")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    fetchContacts();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contact, isActive }),
    });
    fetchContacts();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">宛先一覧（{total}件）</h2>
        <div className="flex gap-2">
          <Link href="/contacts/import">
            <Button variant="outline">CSV取込</Button>
          </Link>
          <a href="/api/contacts/export">
            <Button variant="outline">CSVエクスポート</Button>
          </a>
          <Link href="/contacts/new">
            <Button>新規登録</Button>
          </Link>
        </div>
      </div>
      <div className="mb-4">
        <ContactSearch />
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground py-8">読み込み中...</p>
      ) : (
        <ContactTable
          contacts={contacts}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}
    </>
  );
}

export default function ContactsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-10">
        <Suspense fallback={<p className="text-center text-muted-foreground py-8">読み込み中...</p>}>
          <ContactsContent />
        </Suspense>
      </main>
    </AppShell>
  );
}
