import { Header } from "@/components/layout/Header";
import { CsvImporter } from "@/components/contacts/CsvImporter";

export default function ImportPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <CsvImporter />
      </main>
    </>
  );
}
