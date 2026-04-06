"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Contact {
  id: string;
  companyName: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface Props {
  onConfirm: (selectedIds: string[]) => void;
  onBack: () => void;
}

export function RecipientSelector({ onConfirm, onBack }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "1000" });
    if (query) params.set("q", query);
    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    // 配信可能な宛先のみ表示
    const active = data.contacts.filter((c: Contact) => c.isActive);
    setContacts(active);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c.id)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          配信対象を選択（{selected.size} / {contacts.length} 件）
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selected.size === contacts.length ? "全解除" : "全選択"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="会社名・氏名・メールで絞り込み"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-4">読み込み中...</p>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">配信可能な宛先がありません</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {query ? "検索条件に一致する宛先がありません" : "宛先管理から宛先を登録してください"}
          </p>
        </div>
      ) : (
        <>
        {/* デスクトップ: テーブル表示 */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">選択</TableHead>
                <TableHead>会社名</TableHead>
                <TableHead>氏名</TableHead>
                <TableHead>メールアドレス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer"
                  onClick={() => toggleSelect(contact.id)}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>{contact.companyName}</TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell className="text-sm">{contact.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* モバイル: カード表示 */}
        <div className="sm:hidden space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                selected.has(contact.id) ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => toggleSelect(contact.id)}
            >
              <input
                type="checkbox"
                checked={selected.has(contact.id)}
                onChange={() => toggleSelect(contact.id)}
                className="h-4 w-4 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{contact.companyName} / {contact.name}</p>
                <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <div className="flex gap-2">
        <Button onClick={() => onConfirm(Array.from(selected))} disabled={selected.size === 0}>
          送信確認へ（{selected.size}件）
        </Button>
        <Button variant="outline" onClick={onBack}>
          メール作成に戻る
        </Button>
      </div>
    </div>
  );
}
