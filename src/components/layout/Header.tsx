"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Mail, FileText } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "メニュー", icon: LayoutDashboard },
  { href: "/contacts", label: "宛先管理", icon: Users },
  { href: "/mail", label: "メール作成・配信", icon: Mail },
  { href: "/mail/templates", label: "テンプレート管理", icon: FileText },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="border-b border-border/50 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-extrabold text-primary tracking-tight flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Mail className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            正直な家
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-500 hover:text-primary hover:bg-primary/10"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "" : "text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {session?.user?.name && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session.user.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full px-4 font-medium"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
