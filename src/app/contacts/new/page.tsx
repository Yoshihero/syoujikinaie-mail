import { AppShell } from "@/components/layout/AppShell";
import { ContactForm } from "@/components/contacts/ContactForm";
import Link from "next/link";

export default function NewContactPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-6">
          <Link href="/contacts" className="text-sm text-primary hover:underline">
            ← 宛先一覧に戻る
          </Link>
        </div>
        <h2 className="text-2xl font-bold mb-6">宛先 新規登録</h2>
        <ContactForm />
      </main>
    </AppShell>
  );
}
