"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

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
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">テンプレート管理</h2>
          <Button variant="outline" onClick={() => router.push("/mail")} className="border-primary/20 hover:bg-primary/5">
            メール作成へ
          </Button>
        </div>
        {templates.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 bg-white rounded-xl border border-border/50">
            テンプレートがありません。メール作成画面から「テンプレートとして保存」で作成できます。
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold">テンプレート名</TableHead>
                  <TableHead className="font-semibold">件名</TableHead>
                  <TableHead className="font-semibold">更新日</TableHead>
                  <TableHead className="font-semibold text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow
                    key={t.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/mail/templates/${t.id}/edit`)}
                  >
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-slate-600">{t.subject}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(t.updatedAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </AppShell>
  );
}
