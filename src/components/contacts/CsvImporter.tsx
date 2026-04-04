"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Step = "upload" | "mapping" | "confirm" | "result";

const FIELDS = [
  { key: "companyName", label: "会社名", required: true },
  { key: "department", label: "部署名", required: false },
  { key: "position", label: "役職", required: false },
  { key: "name", label: "氏名", required: true },
  { key: "email", label: "メールアドレス", required: true },
];

interface ImportResult {
  imported: number;
  updated: number;
  errorCount: number;
  errors: { row: number; data: Record<string, string>; reason: string }[];
}

export function CsvImporter() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [source, setSource] = useState("Eight");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;

      // Eightなどの先頭メタ行をスキップ: 「会社名」を含む行をヘッダーとして検出
      const lines = text.split("\n");
      const headerIndex = lines.findIndex(
        (line) => line.includes("会社名") && line.includes("e-mail")
      );
      const csvText = headerIndex > 0
        ? lines.slice(headerIndex).join("\n")
        : text;

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          setCsvRows(results.data as Record<string, string>[]);

          // 自動マッピング推測
          const autoMapping: Record<string, string> = {};
          for (const field of FIELDS) {
            const match = headers.find(
              (h) =>
                h.includes(field.label) ||
                h.toLowerCase().includes(field.key.toLowerCase()) ||
                (field.key === "email" && (h.includes("mail") || h.includes("メール"))) ||
                (field.key === "companyName" && h.includes("会社")) ||
                (field.key === "name" && h.includes("氏名")) ||
                (field.key === "department" && h.includes("部署")) ||
                (field.key === "position" && h.includes("役職"))
            );
            if (match) autoMapping[field.key] = match;
          }
          setMapping(autoMapping);
          setStep("mapping");
        },
      });
    };
    reader.readAsText(file);
  }, []);

  const isMappingValid = FIELDS.filter((f) => f.required).every(
    (f) => mapping[f.key]
  );

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: csvRows, mapping, source }),
      });
      const data = await res.json();
      setResult(data);
      setStep("result");
    } finally {
      setLoading(false);
    }
  };

  if (step === "upload") {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>CSV取込</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>取込元</Label>
            <Select value={source} onValueChange={(val: string | null) => { if (val) setSource(val); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Eight">Eight</SelectItem>
                <SelectItem value="Sansan">Sansan</SelectItem>
                <SelectItem value="その他">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CSVファイル</Label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <Button variant="outline" onClick={() => router.push("/contacts")}>
            戻る
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "mapping") {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>カラムの対応付け</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CSVの列と、システムの項目を対応付けてください。（* は必須）
          </p>
          <div className="space-y-3">
            {FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <Label className="w-40">
                  {field.label} {field.required && "*"}
                </Label>
                <Select
                  value={mapping[field.key] || ""}
                  onValueChange={(val: string | null) => {
                    if (val) setMapping({ ...mapping, [field.key]: val });
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="-- 選択 --" />
                  </SelectTrigger>
                  <SelectContent>
                    {csvHeaders.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              プレビュー（先頭5件）
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  {FIELDS.map((f) => (
                    <TableHead key={f.key}>{f.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvRows.slice(0, 5).map((row, i) => (
                  <TableRow key={i}>
                    {FIELDS.map((f) => (
                      <TableCell key={f.key}>
                        {mapping[f.key] ? row[mapping[f.key]] || "-" : "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setStep("confirm")} disabled={!isMappingValid}>
              確認へ進む
            </Button>
            <Button variant="outline" onClick={() => setStep("upload")}>
              戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "confirm") {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>取込確認</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p>取込元: {source}</p>
            <p>取込件数: {csvRows.length} 件</p>
            <p className="text-muted-foreground">
              同一メールアドレスの既存データは最新として更新されます。
              空欄項目では既存データを上書きしません。
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={loading}>
              {loading ? "取込中..." : "取込実行"}
            </Button>
            <Button variant="outline" onClick={() => setStep("mapping")}>
              戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // result
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>取込結果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <>
            <div className="space-y-1 text-sm">
              <p>新規登録: {result.imported} 件</p>
              <p>更新: {result.updated} 件</p>
              <p>エラー: {result.errorCount} 件</p>
            </div>
            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">エラー一覧</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>行</TableHead>
                      <TableHead>理由</TableHead>
                      <TableHead>データ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell>{err.row}</TableCell>
                        <TableCell className="text-red-500">{err.reason}</TableCell>
                        <TableCell className="text-xs">
                          {Object.values(err.data).join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
        <Button onClick={() => router.push("/contacts")}>宛先一覧へ</Button>
      </CardContent>
    </Card>
  );
}
