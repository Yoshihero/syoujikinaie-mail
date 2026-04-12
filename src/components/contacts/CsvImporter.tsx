"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { UploadCloud, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

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

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-10 w-full max-w-3xl mx-auto">
      {["upload", "mapping", "confirm", "result"].map((s, idx) => {
        const labels = ["ファイルアップロード", "データ紐付け", "最終確認", "完了"];
        const isActive = step === s;
        const isPast = ["upload", "mapping", "confirm", "result"].indexOf(step) > idx;

        return (
          <div key={s} className="flex items-center">
            <div className={`flex flex-col items-center relative z-10 ${isActive ? "text-primary" : isPast ? "text-slate-600" : "text-slate-300"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 ${
                isActive ? "bg-primary text-white shadow-md shadow-primary/20 scale-110" :
                isPast ? "bg-slate-100 text-slate-600 border border-slate-300" : "bg-slate-50 text-slate-300 border border-slate-200"
              }`}>
                {isPast ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : idx + 1}
              </div>
              <span className={`text-xs font-bold ${isActive ? "text-slate-800" : ""}`}>{labels[idx]}</span>
            </div>
            {idx < 3 && (
              <div className={`w-20 md:w-32 h-1 mx-2 rounded-full ${isPast ? "bg-emerald-400" : "bg-slate-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full">
      <StepIndicator />

      {step === "upload" && (
        <Card className="max-w-3xl mx-auto border-border/60 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
          <div className="bg-slate-50/50 p-6 border-b border-border/50">
            <h3 className="text-xl font-bold text-slate-800">名刺データ (CSV) のアップロード</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">EightやSansanからエクスポートしたファイルを選択してください。</p>
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700">1. データソースの選択</Label>
              <Select value={source} onValueChange={(val: string | null) => { if (val) setSource(val); }}>
                <SelectTrigger className="max-w-xs h-12 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eight">Eight</SelectItem>
                  <SelectItem value="Sansan">Sansan</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700">2. CSVファイルのアップロード</Label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-primary/50 bg-slate-50/50 hover:bg-primary/5 rounded-2xl p-12 text-center transition-all duration-300 group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="bg-white p-4 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700">クリックしてファイルを選択</p>
                    <p className="text-sm text-slate-500 mt-1">または、ここにCSVファイルをドラッグ＆ドロップ</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button variant="outline" onClick={() => router.push("/contacts")} className="w-32">
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "mapping" && (
        <Card className="max-w-4xl mx-auto border-border/60 shadow-lg bg-white overflow-hidden">
          <div className="bg-slate-50/50 p-6 border-b border-border/50">
            <h3 className="text-xl font-bold text-slate-800">CSVとシステムのデータを紐付ける</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">CSV内の列名が、システムのどの項目に該当するか指定してください。</p>
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 flex items-center">
                    {field.label} 
                    {field.required && <span className="text-red-500 ml-1 bg-red-50 px-1 py-0.5 rounded text-[10px]">必須</span>}
                  </Label>
                  <Select
                    value={mapping[field.key] || ""}
                    onValueChange={(val: string | null) => {
                      if (val) setMapping({ ...mapping, [field.key]: val });
                    }}
                  >
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors">
                      <SelectValue placeholder="一致する列を選択" />
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

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 inline-block pb-1 border-b-2 border-primary/20">プレビュー (先頭5件)</h4>
              <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      {FIELDS.map((f) => (
                        <TableHead key={f.key} className="font-semibold">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvRows.slice(0, 5).map((row, i) => (
                      <TableRow key={i} className="hover:bg-slate-50/30">
                        {FIELDS.map((f) => (
                          <TableCell key={f.key} className="text-sm">
                            {mapping[f.key] ? row[mapping[f.key]] || "-" : "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" size="lg" onClick={() => setStep("upload")} className="w-32">
                やり直す
              </Button>
              <Button size="lg" onClick={() => setStep("confirm")} disabled={!isMappingValid} className="px-8 font-bold shadow-md hover:-translate-y-0.5 transition-all">
                確認画面へ進む <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <Card className="max-w-2xl mx-auto border-border/60 shadow-lg bg-white overflow-hidden">
          <div className="bg-slate-50/50 p-6 border-b border-border/50">
            <h3 className="text-xl font-bold text-slate-800">{loading ? "インポート処理中" : "インポートの最終確認"}</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">{loading ? "データベースへ登録しています。しばらくお待ちください。" : "以下の内容でデータベースへ登録を実行します。"}</p>
          </div>
          <CardContent className="p-8 space-y-8">
            {loading ? (
              <>
                <div className="flex flex-col items-center py-8 space-y-6">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-extrabold text-slate-800">{csvRows.length} 件を処理中...</p>
                    <p className="text-sm text-slate-500 font-medium">データソース: {source}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-primary h-3 rounded-full animate-pulse w-full origin-left" style={{ animation: "progress-indeterminate 2s ease-in-out infinite" }} />
                </div>
                <style>{`
                  @keyframes progress-indeterminate {
                    0% { transform: scaleX(0); transform-origin: left; }
                    50% { transform: scaleX(1); transform-origin: left; }
                    50.1% { transform: scaleX(1); transform-origin: right; }
                    100% { transform: scaleX(0); transform-origin: right; }
                  }
                `}</style>
                <p className="text-center text-sm text-slate-400 font-medium">ブラウザを閉じないでください</p>
              </>
            ) : (
              <>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-8 text-center space-y-2">
                  <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm">Target Data</p>
                  <div className="text-5xl font-extrabold text-slate-800 tracking-tight">{csvRows.length} <span className="text-xl text-slate-500 font-medium">件</span></div>
                  <p className="text-sm text-indigo-900/60 font-semibold pt-2">データソース: {source}</p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 font-medium leading-relaxed">
                  <ul className="list-disc list-inside space-y-1">
                    <li>同一メールアドレスの既存データは最新の情報として更新されます。</li>
                    <li>CSV上で空欄となっている項目が、既存のデータを上書きすることはありません。</li>
                    <li>実行が完了するまでブラウザを閉じないでください。</li>
                  </ul>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" size="lg" onClick={() => setStep("mapping")} className="w-32">
                    戻る
                  </Button>
                  <Button size="lg" onClick={handleImport} className="px-8 font-bold text-base shadow-md hover:-translate-y-0.5 transition-all w-48">
                    インポート開始
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === "result" && (
        <Card className="max-w-3xl mx-auto border-border/60 shadow-lg bg-white overflow-hidden">
          <div className="bg-emerald-500/10 p-8 border-b border-emerald-500/20 text-center">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-800">インポートが完了しました</h3>
          </div>
          <CardContent className="p-8 space-y-8">
            {result && (
              <>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                    <p className="text-sm font-bold text-slate-500 mb-1">新規登録</p>
                    <p className="text-3xl font-extrabold text-slate-800">{result.imported}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                    <p className="text-sm font-bold text-slate-500 mb-1">情報更新</p>
                    <p className="text-3xl font-extrabold text-blue-600">{result.updated}</p>
                  </div>
                  <div className={`border rounded-xl p-6 text-center ${result.errorCount > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                    <p className={`text-sm font-bold mb-1 ${result.errorCount > 0 ? "text-red-500" : "text-slate-500"}`}>エラー</p>
                    <p className={`text-3xl font-extrabold ${result.errorCount > 0 ? "text-red-600" : "text-slate-800"}`}>{result.errorCount}</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-8 border border-red-100 rounded-xl overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-100 font-bold text-red-800 text-sm">
                      取り込めなかったデータ（{result.errorCount}件）
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 text-center">行</TableHead>
                          <TableHead>エラー理由</TableHead>
                          <TableHead>データ内容</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-center font-medium text-slate-500">{err.row}</TableCell>
                            <TableCell className="text-red-600 font-medium text-sm">{err.reason}</TableCell>
                            <TableCell className="text-xs text-slate-500 truncate max-w-[200px]" title={Object.values(err.data).join(", ")}>
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
            
            <div className="flex justify-center pt-6">
              <Button size="lg" onClick={() => router.push("/contacts")} className="w-full max-w-sm font-bold">
                宛先一覧へ戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
