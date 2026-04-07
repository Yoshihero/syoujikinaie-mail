"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Smartphone, MonitorPlay, Save, Play, Send, FileText } from "lucide-react";

const INSERT_FIELDS = [
  { tag: "{{会社名}}", label: "会社名" },
  { tag: "{{部署名}}", label: "部署名" },
  { tag: "{{役職}}", label: "役職" },
  { tag: "{{氏名}}", label: "氏名" },
];

interface Props {
  initialSubject?: string;
  initialBody?: string;
  title?: string;
  onSave: (subject: string, body: string) => Promise<void>;
  onSendReady?: (subject: string, body: string) => void;
  saveLabel?: string;
  showTemplateSave?: boolean;
}

export function MailEditor({
  initialSubject = "",
  initialBody = "",
  title = "メール編集",
  onSave,
  onSendReady,
  saveLabel = "下書き保存",
  showTemplateSave = true,
}: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [saveTemplateTitle, setSaveTemplateTitle] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSubject(initialSubject);
    setBody(initialBody);
  }, [initialSubject, initialBody]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(subject, body);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!saveTemplateTitle || !subject || !body) return;
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: saveTemplateTitle, subject, body }),
    });
    setSaveTemplateTitle("");
    setShowTemplateDialog(false);
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

  const livePreviewSubject = subject.replace(/{{会社名}}/g, "サンプル株式会社").replace(/{{氏名}}/g, "山田太郎");
  const livePreviewBody = body
    .replace(/{{会社名}}/g, "サンプル株式会社")
    .replace(/{{氏名}}/g, "山田太郎")
    .replace(/{{部署名}}/g, "営業部")
    .replace(/{{役職}}/g, "部長");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-border/50 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h1>
          {testResult && (
            <p className={`text-sm mt-1 font-medium ${testResult.startsWith("エラー") ? "text-red-500" : "text-emerald-600"}`}>
              {testResult}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} variant="outline" disabled={saving} className="font-semibold">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "保存中..." : saveLabel}
          </Button>
          {showTemplateSave && (
            <Button onClick={() => setShowTemplateDialog(true)} variant="outline" disabled={!subject || !body} className="font-semibold">
              <FileText className="w-4 h-4 mr-2" />
              テンプレートとして保存
            </Button>
          )}
          {onSendReady && (
            <>
              <Button onClick={handleTestSend} variant="secondary" disabled={!subject || !body || testSending} className="font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                <Play className="w-4 h-4 mr-2" />
                {testSending ? "送信中..." : "テスト送信"}
              </Button>
              <Button onClick={() => onSendReady(subject, body)} disabled={!subject || !body} className="font-bold px-6 shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all">
                <Send className="w-4 h-4 mr-2" />
                配信対象を選択する
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Side: Editor */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <Card className="flex-1 flex flex-col min-h-0 border-border/60 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
              <div className="space-y-3 shrink-0">
                <Label htmlFor="subject" className="text-sm font-bold text-slate-700">件名</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="メールの件名を入力"
                  className="text-base py-6 bg-white font-medium shadow-sm border-slate-200"
                />
              </div>

              <div className="flex flex-col flex-1 space-y-3 min-h-0">
                <div className="flex justify-between items-end shrink-0">
                  <Label htmlFor="body" className="text-sm font-bold text-slate-700">本文</Label>
                  <div className="flex gap-2">
                    {INSERT_FIELDS.map((f) => (
                      <Button
                        key={f.tag}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-100/50"
                        onClick={() => insertField(f.tag)}
                      >
                        + {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="body"
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={"メールの本文を入力してください。\n右上のボタンから「{{会社名}}」や「{{氏名}}」を差し込めます。"}
                  className="flex-1 min-h-[300px] resize-none bg-white font-medium leading-relaxed p-4 shadow-sm border-slate-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Live Preview */}
        <div className="w-[440px] shrink-0 flex flex-col hidden xl:flex border border-border/60 bg-slate-50/50 rounded-xl overflow-hidden shadow-sm relative">
          <div className="h-14 border-b border-border/50 bg-white flex items-center justify-between px-4 shrink-0">
            <div className="font-semibold text-slate-600 text-sm flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              Live Preview
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded-md transition-all ${
                  previewMode === "mobile" ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded-md transition-all ${
                  previewMode === "desktop" ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <MonitorPlay className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-100/80 p-6 flex justify-center">
            <div
              className={`bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden transition-all duration-300 ${
                previewMode === "mobile" ? "w-[340px] min-h-[600px] self-start" : "w-full max-w-[800px] min-h-[500px] self-start"
              }`}
            >
              <div className="bg-slate-50 p-4 border-b border-slate-100">
                <div className="text-xs text-slate-500 mb-1">差出人: 正直な家</div>
                <div className="font-bold text-slate-800 text-[15px] leading-tight mb-2">
                  {livePreviewSubject || <span className="text-slate-300 font-normal">件名なし</span>}
                </div>
                <div className="text-xs text-slate-400">宛先: サンプル株式会社 山田太郎 様</div>
              </div>
              <div className="p-5">
                <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700 font-sans">
                  {livePreviewBody || <span className="text-slate-300">本文が入力されていません</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Save Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートとして保存</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateTitle">テンプレート名</Label>
              <Input
                id="templateTitle"
                value={saveTemplateTitle}
                onChange={(e) => setSaveTemplateTitle(e.target.value)}
                placeholder="例: 初回ご挨拶メール"
              />
            </div>
            <Button onClick={handleSaveAsTemplate} disabled={!saveTemplateTitle} className="w-full">
              保存する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
