"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ContactSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/contacts?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        placeholder="会社名・氏名・メールで検索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
      >
        検索
      </button>
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            router.push("/contacts");
          }}
          className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
        >
          クリア
        </button>
      )}
    </form>
  );
}
