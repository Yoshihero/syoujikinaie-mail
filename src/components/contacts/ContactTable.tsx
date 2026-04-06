"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface Contact {
  id: string;
  companyName: string;
  department: string | null;
  position: string | null;
  name: string;
  email: string;
  isActive: boolean;
  source: string | null;
}

interface Props {
  contacts: Contact[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function ContactTable({ contacts, onDelete, onToggleActive }: Props) {
  const router = useRouter();

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UserPlus className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-medium">宛先が登録されていません</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          「新規登録」またはCSVファイルから宛先を追加してください
        </p>
      </div>
    );
  }

  return (
    <>
      {/* デスクトップ: テーブル表示 */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>会社名</TableHead>
              <TableHead>部署名</TableHead>
              <TableHead>役職</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>{contact.companyName}</TableCell>
                <TableCell>{contact.department || "-"}</TableCell>
                <TableCell>{contact.position || "-"}</TableCell>
                <TableCell>{contact.name}</TableCell>
                <TableCell className="text-sm">{contact.email}</TableCell>
                <TableCell>
                  <Badge variant={contact.isActive ? "default" : "secondary"}>
                    {contact.isActive ? "配信可" : "停止"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/contacts/${contact.id}/edit`)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleActive(contact.id, !contact.isActive)}
                    >
                      {contact.isActive ? "停止" : "再開"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`${contact.name} を削除しますか？`)) {
                          onDelete(contact.id);
                        }
                      }}
                    >
                      削除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* モバイル: カード表示 */}
      <div className="md:hidden space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{contact.companyName} / {contact.name}</p>
              <Badge variant={contact.isActive ? "default" : "secondary"} className="shrink-0">
                {contact.isActive ? "配信可" : "停止"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
            {(contact.department || contact.position) && (
              <p className="text-xs text-muted-foreground">
                {[contact.department, contact.position].filter(Boolean).join(" / ")}
              </p>
            )}
            <div className="flex gap-1 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/contacts/${contact.id}/edit`)}
              >
                編集
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleActive(contact.id, !contact.isActive)}
              >
                {contact.isActive ? "停止" : "再開"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`${contact.name} を削除しますか？`)) {
                    onDelete(contact.id);
                  }
                }}
              >
                削除
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
