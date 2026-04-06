import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail } from "lucide-react";

const menuItems = [
  {
    title: "宛先管理",
    description: "宛先の登録・編集・CSV取込",
    href: "/contacts",
    icon: Users,
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
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="text-xl font-bold mb-6">メニュー</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-colors hover:bg-gray-50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
