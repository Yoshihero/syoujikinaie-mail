"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  subject: string;
  body: string;
  contactIds: string[];
}

interface Progress {
  current: number;
  total: number;
  sent: number;
  failed: number;
  currentEmail?: string;
}

export function SendProgress({ subject, body, contactIds }: Props) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>({
    current: 0,
    total: contactIds.length,
    sent: 0,
    failed: 0,
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const send = async () => {
      try {
        const res = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body, contactIds }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "送信に失敗しました");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress") {
                setProgress(data);
              } else if (data.type === "complete") {
                setProgress(data);
                setDone(true);
              }
            }
          }
        }
      } catch {
        setError("送信中にエラーが発生しました");
      }
    };

    send();
  }, [subject, body, contactIds]);

  const percentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{done ? "配信完了" : "配信中..."}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            {/* 進捗バー */}
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="text-sm space-y-1">
              <p>進捗: {progress.current} / {progress.total} 件 ({percentage}%)</p>
              <p>送信成功: {progress.sent} 件</p>
              {progress.failed > 0 && (
                <p className="text-red-500">送信失敗: {progress.failed} 件</p>
              )}
              {!done && progress.currentEmail && (
                <p className="text-muted-foreground">送信中: {progress.currentEmail}</p>
              )}
            </div>
          </>
        )}

        {(done || error) && (
          <Button onClick={() => router.push("/dashboard")}>
            メニューに戻る
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
