import { AppShell } from "@/components/layout/AppShell";
import { CsvImporter } from "@/components/contacts/CsvImporter";
import Link from "next/link";

export default function ImportPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-6">
          <Link href="/contacts" className="text-sm text-primary hover:underline">
            ← 宛先一覧に戻る
          </Link>
        </div>
        <CsvImporter />
      </main>
    </AppShell>
  );
}
