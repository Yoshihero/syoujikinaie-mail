"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <h1 className="text-lg font-bold">メルマガ配信</h1>
        <div className="flex items-center gap-4">
          {session?.user?.name && (
            <span className="text-sm text-muted-foreground">
              {session.user.name}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
