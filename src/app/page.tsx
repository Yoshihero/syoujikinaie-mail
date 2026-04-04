"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">メルマガ配信システム</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            株式会社 正直な家
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full"
            size="lg"
          >
            Googleでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
