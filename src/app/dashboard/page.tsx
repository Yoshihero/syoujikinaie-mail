import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, ArrowUpRight, Activity, Send } from "lucide-react";

const menuItems = [
  {
    title: "宛先リスト管理",
    description: "顧客リストの登録・編集や、Sansan/EightからのCSVファイル一括インポートを行います。",
    href: "/contacts",
    icon: Users,
    color: "bg-blue-500",
    lightColor: "bg-blue-500/10",
    textColor: "text-blue-600"
  },
  {
    title: "メール作成・配信",
    description: "件名・本文の作成、テンプレート管理、配信対象の選択・送信実行",
    href: "/mail",
    icon: Mail,
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-8 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">メニュー</h2>
          <p className="text-slate-500 mt-2 font-medium">操作したい機能を選択してください。</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 mt-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="group outline-none">
              <Card className="h-full transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(30,58,138,0.15)] hover:-translate-y-1 cursor-pointer border-border/60 hover:border-primary/30 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/5 p-3 rounded-xl transition-colors duration-300 group-hover:bg-primary/10 group-hover:shadow-sm">
                      <item.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800 transition-colors group-hover:text-primary">
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
