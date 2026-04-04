"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");

  useEffect(() => {
    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
        } else if (data.alreadyUnsubscribed) {
          setStatus("already");
        } else {
          setStatus("success");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>配信停止</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">株式会社 正直な家</p>
        </CardHeader>
        <CardContent className="text-center">
          {status === "loading" && (
            <p className="text-muted-foreground">処理中...</p>
          )}
          {status === "success" && (
            <p>配信を停止しました。今後メールは届きません。</p>
          )}
          {status === "already" && (
            <p>既に配信は停止されています。</p>
          )}
          {status === "error" && (
            <p className="text-red-500">
              無効なリンクです。このリンクは使用できません。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
