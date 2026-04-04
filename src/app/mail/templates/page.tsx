"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Template {
  id: string;
  title: string;
  subject: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);

  const fetchTemplates = async () => {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("このテンプレートを削除しますか？")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">テンプレート一覧</h2>
          <Button variant="outline" onClick={() => router.push("/mail")}>
            メール作成へ
          </Button>
        </div>
        {templates.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            テンプレートがありません
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テンプレート名</TableHead>
                <TableHead>件名</TableHead>
                <TableHead>更新日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(t.updatedAt).toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(t.id)}
                    >
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </main>
    </>
  );
}
