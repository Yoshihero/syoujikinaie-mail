"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Template {
  id: string;
  title: string;
  subject: string;
  body: string;
}

const INSERT_FIELDS = [
  { tag: "{{会社名}}", label: "会社名" },
  { tag: "{{氏名}}", label: "氏名" },
  { tag: "{{部署名}}", label: "部署名" },
  { tag: "{{役職}}", label: "役職" },
];

interface Props {
  onSendReady: (subject: string, body: string) => void;
}

export function MailEditor({ onSendReady }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState({ subject: "", body: "" });
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then(setTemplates);
  }, []);

  const insertField = (tag: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.slice(0, start) + tag + body.slice(end);
    setBody(newBody);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const loadTemplate = (templateId: string) => {
    const t = templates.find((t) => t.id === templateId);
    if (t) {
      setSubject(t.subject);
      setBody(t.body);
    }
  };

  const saveTemplate = async () => {
    if (!saveTitle || !subject || !body) return;
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: saveTitle, subject, body }),
    });
    setSaveTitle("");
    setShowSaveDialog(false);
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  };

  const handlePreview = async () => {
    const res = await fetch("/api/mail/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = await res.json();
    setPreview(data);
    setShowPreview(true);
  };

  const handleTestSend = async () => {
    setTestSending(true);
    setTestResult("");
    try {
      const res = await fetch("/api/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (res.ok) {
        setTestResult("テスト送信しました。受信トレイを確認してください。");
      } else {
        const data = await res.json();
        setTestResult(`エラー: ${data.error}`);
      }
    } catch {
      setTestResult("送信に失敗しました");
    } finally {
      setTestSending(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>メール作成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.length > 0 && (
            <div>
              <Label>テンプレートから読み込む</Label>
              <Select onValueChange={(val: string | null) => { if (val) loadTemplate(val); }}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="-- テンプレートを選択 --" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="subject">件名</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="メールの件名を入力"
            />
          </div>

          <div>
            <Label htmlFor="body">本文</Label>
            <div className="flex gap-2 mb-2">
              {INSERT_FIELDS.map((f) => (
                <Button
                  key={f.tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertField(f.tag)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <Textarea
              id="body"
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="メールの本文を入力&#10;&#10;差し込みボタンで {{会社名}} {{氏名}} を挿入できます"
              rows={15}
            />
          </div>

          {testResult && (
            <p className={`text-sm ${testResult.startsWith("エラー") ? "text-red-500" : "text-green-600"}`}>
              {testResult}
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePreview} variant="outline" disabled={!subject || !body}>
              プレビュー
            </Button>
            <Button onClick={handleTestSend} variant="outline" disabled={!subject || !body || testSending}>
              {testSending ? "送信中..." : "テスト送信"}
            </Button>
            <Button onClick={() => setShowSaveDialog(true)} variant="outline" disabled={!subject || !body}>
              テンプレート保存
            </Button>
            <Button onClick={() => onSendReady(subject, body)} disabled={!subject || !body}>
              配信対象を選択へ
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              戻る
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* プレビューダイアログ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>プレビュー</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">件名</Label>
              <p className="font-medium">{preview.subject}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">本文</Label>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md">
                {preview.body}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              ※ サンプルデータ（サンプル株式会社 山田太郎）で差し込みを表示しています
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* テンプレート保存ダイアログ */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレート保存</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateTitle">テンプレート名</Label>
              <Input
                id="templateTitle"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="例: 月次ニュースレター"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveTemplate} disabled={!saveTitle}>
                保存
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
