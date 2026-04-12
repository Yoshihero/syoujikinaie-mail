"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BATCH_SIZE = 3;

interface Props {
  subject: string;
  body: string;
  contactIds: string[];
  onComplete?: () => void;
}

interface Progress {
  current: number;
  total: number;
  sent: number;
  failed: number;
}

export function SendProgress({ subject, body, contactIds, onComplete }: Props) {
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
    let cancelled = false;

    const sendBatches = async () => {
      // 送信履歴を作成
      let sendLogId: string | null = null;
      try {
        const startRes = await fetch("/api/send/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body, totalCount: contactIds.length }),
        });
        if (startRes.ok) {
          const startData = await startRes.json();
          sendLogId = startData.sendLogId;
        }
      } catch {
        // 履歴作成に失敗しても送信は続行する
      }

      let totalSent = 0;
      let totalFailed = 0;
      let totalProcessed = 0;

      for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
        if (cancelled) break;

        const batch = contactIds.slice(i, i + BATCH_SIZE);

        try {
          const res = await fetch("/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, body, contactIds: batch, sendLogId }),
          });

          if (!res.ok) {
            const data = await res.json();
            if (!cancelled) setError(data.error || "送信に失敗しました");
            return;
          }

          const data = await res.json();
          totalSent += data.sent;
          totalFailed += data.failed;
          totalProcessed += batch.length;

          if (!cancelled) {
            setProgress({
              current: totalProcessed,
              total: contactIds.length,
              sent: totalSent,
              failed: totalFailed,
            });
          }

          // バッチ間に3秒待機（Gmail APIレートリミット対策、最終バッチ以外）
          if (i + BATCH_SIZE < contactIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } catch {
          if (!cancelled) setError("送信中にエラーが発生しました");
          return;
        }
      }

      // 送信完了を記録
      if (sendLogId) {
        try {
          await fetch("/api/send/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sendLogId }),
          });
        } catch {
          // 完了記録に失敗しても問題なし
        }
      }

      if (!cancelled) {
        setDone(true);
        onComplete?.();
      }
    };

    sendBatches();

    return () => { cancelled = true; };
  }, [subject, body, contactIds, onComplete]);

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
