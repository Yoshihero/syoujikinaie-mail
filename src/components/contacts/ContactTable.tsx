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
      <p className="text-center text-muted-foreground py-8">
        宛先が登録されていません
      </p>
    );
  }

  return (
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
  );
}
