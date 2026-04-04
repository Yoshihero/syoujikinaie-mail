"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { RecipientSelector } from "@/components/send/RecipientSelector";
import { SendProgress } from "@/components/send/SendProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Step = "select" | "confirm" | "sending";

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

  if (!subject || !body) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-muted-foreground">メール作成画面に戻ります...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {step === "select" && (
          <RecipientSelector
            onConfirm={handleConfirm}
            onBack={() => router.push("/mail")}
          />
        )}

        {step === "confirm" && (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>送信確認</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">件名:</span> {subject}</p>
                <p><span className="text-muted-foreground">送信先:</span> {selectedIds.length} 件</p>
                <p className="text-muted-foreground">
                  送信を開始すると、約3秒間隔で1通ずつ配信されます。
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setStep("sending")}
                  variant="destructive"
                >
                  送信開始
                </Button>
                <Button variant="outline" onClick={() => setStep("select")}>
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
          />
        )}
      </main>
    </>
  );
}
