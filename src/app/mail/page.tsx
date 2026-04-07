"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, FileText, Trash2 } from "lucide-react";

interface Draft {
  id: string;
  title: string;
  subject: string;
  updatedAt: string;
}

interface Template {
  id: string;
  title: string;
  subject: string;
  body: string;
}

export default function MailPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const fetchDrafts = async () => {
    const res = await fetch("/api/drafts");
    setDrafts(await res.json());
  };

  const fetchTemplates = async () => {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  };

  useEffect(() => {
    fetchDrafts();
    fetchTemplates();
  }, []);

  const handleFromTemplate = async (template: Template) => {
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${template.title} - 下書き`,
        subject: template.subject,
        body: template.body,
      }),
    });
    const draft = await res.json();
    setShowTemplateDialog(false);
    router.push(`/mail/edit/${draft.id}`);
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("この下書きを削除しますか？")) return;
    await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    fetchDrafts();
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">メール作成・配信</h2>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { fetchTemplates(); setShowTemplateDialog(true); }} disabled={templates.length === 0}>
              <FileText className="w-4 h-4 mr-2" />
              テンプレートから作成
            </Button>
            <Button onClick={() => router.push("/mail/new")}>
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          </div>
        </div>

        {drafts.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 bg-white rounded-xl border border-border/50">
            下書きがありません。「新規作成」からメールを作成してください。
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold">タイトル</TableHead>
                  <TableHead className="font-semibold">件名</TableHead>
                  <TableHead className="font-semibold">更新日</TableHead>
                  <TableHead className="font-semibold text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((d) => (
                  <TableRow
                    key={d.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/mail/edit/${d.id}`)}
                  >
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell className="text-slate-600">{d.subject || "（件名未設定）"}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(d.updatedAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); handleDeleteDraft(d.id); }}
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

        {/* テンプレート選択ダイアログ */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>テンプレートから作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
              {templates.map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleFromTemplate(t)}
                >
                  <div className="text-left">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-sm text-muted-foreground">{t.subject}</div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppShell>
  );
}
