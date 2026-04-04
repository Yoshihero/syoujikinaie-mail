import { Header } from "@/components/layout/Header";
import { ContactForm } from "@/components/contacts/ContactForm";

export default function NewContactPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ContactForm />
      </main>
    </>
  );
}
