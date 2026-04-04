"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactData {
  id?: string;
  companyName: string;
  department: string;
  position: string;
  name: string;
  email: string;
}

interface Props {
  initialData?: ContactData;
  isEdit?: boolean;
}

export function ContactForm({ initialData, isEdit }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: initialData?.companyName || "",
    department: initialData?.department || "",
    position: initialData?.position || "",
    name: initialData?.name || "",
    email: initialData?.email || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit ? `/api/contacts/${initialData?.id}` : "/api/contacts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "エラーが発生しました");
        return;
      }

      router.push("/contacts");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? "宛先編集" : "宛先登録"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyName">会社名 *</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="department">部署名</Label>
            <Input
              id="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="position">役職</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="name">氏名 *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
