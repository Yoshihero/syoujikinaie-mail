"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Mail, FileText, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "メニュー", icon: LayoutDashboard },
  { href: "/contacts", label: "宛先管理", icon: Users },
  { href: "/mail", label: "メール作成・配信", icon: Mail },
  { href: "/mail/templates", label: "テンプレート管理", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 border-b border-border/40">
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            <img src="/logo.svg" alt="正直な家" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              // Longer paths first to avoid /mail matching /mail/templates
              const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.href === "/mail"
                ? pathname === "/mail" || (pathname.startsWith("/mail/") && !pathname.startsWith("/mail/templates"))
                : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-slate-500 hover:text-primary hover:bg-primary/10"
                  }`}
                >
                  <item.icon 
                    className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "" : "text-slate-400"}`} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border/40 p-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-700 truncate">
                {session?.user?.name || "ユーザー"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {session?.user?.email || ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </aside>

      {/* Main Content (Offset by sidebar width) */}
      <main className="flex-1 pl-64 transition-all duration-300">
        <div className="h-full min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
