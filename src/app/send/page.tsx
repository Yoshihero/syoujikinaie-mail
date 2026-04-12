"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { RecipientSelector } from "@/components/send/RecipientSelector";
import { SendProgress } from "@/components/send/SendProgress";
import { StepIndicator } from "@/components/send/StepIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Step = "select" | "confirm" | "sending";

const STEPS = [
  { key: "select", label: "配信対象選択" },
  { key: "confirm", label: "送信確認" },
  { key: "sending", label: "配信中" },
] as const;

export default function SendPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const s = sessionStorage.getItem("mail_subject");
    const b = sessionStorage.getItem("mail_body");
    if (!s || !b) {
      router.push("/mail");
      return;
    }
    setSubject(s);
    setBody(b);
  }, [router]);

  const handleConfirm = (ids: string[]) => {
    setSelectedIds(ids);
    setStep("confirm");
  };

  const handleSendComplete = async () => {
    const draftId = sessionStorage.getItem("mail_draft_id");
    if (draftId) {
      await fetch(`/api/drafts/${draftId}`, { method: "DELETE" });
      sessionStorage.removeItem("mail_draft_id");
    }
    sessionStorage.removeItem("mail_subject");
    sessionStorage.removeItem("mail_body");
  };

  if (!subject || !body) {
    return (
        <AppShell>
        <main className="mx-auto max-w-5xl px-8 py-10">
          <p className="text-muted-foreground">メール作成画面に戻ります...</p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-8">
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>

        {step === "select" && (
          <RecipientSelector
            onConfirm={handleConfirm}
            onBack={() => router.push("/mail")}
          />
        )}

        {step === "confirm" && (
          <Card className="max-w-lg mx-auto border-border/50 shadow-lg">
            <CardHeader className="bg-slate-50/50 border-b border-border/50">
              <CardTitle className="text-xl">送信確認</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 leading-relaxed font-medium">
                  送信を開始すると、約3秒間隔で1通ずつ配信されます。<br/>
                  送信中はブラウザを閉じないでください。
                </p>
              </div>
              <div className="text-sm space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">件名</span> 
                  <span className="font-semibold text-slate-800">{subject}</span>
                </p>
                <p className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">送信先</span> 
                  <span className="font-semibold text-slate-800">{selectedIds.length} <span className="font-normal text-slate-500 text-xs ml-0.5">件</span></span>
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 shadow-md hover:shadow-lg transition-all" size="lg" onClick={() => setStep("sending")}>
                  送信開始
                </Button>
                <Button className="flex-1" size="lg" variant="outline" onClick={() => setStep("select")}>
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "sending" && (
          <SendProgress
            subject={subject}
            body={body}
            contactIds={selectedIds}
            onComplete={handleSendComplete}
          />
        )}
      </main>
    </AppShell>
  );
}
