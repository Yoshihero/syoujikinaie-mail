import { describe, it, expect } from "vitest";
import {
  mapRow,
  validateRow,
  validateAndMapRows,
  detectHeaderRow,
  mergeContactData,
  EMAIL_REGEX,
} from "@/lib/validation";

// --- EMAIL_REGEX ---

describe("EMAIL_REGEX", () => {
  it("正常系: 標準的なメールアドレス", () => {
    expect(EMAIL_REGEX.test("test@example.com")).toBe(true);
    expect(EMAIL_REGEX.test("user.name@company.co.jp")).toBe(true);
    expect(EMAIL_REGEX.test("a@b.c")).toBe(true);
  });

  it("異常系: 不正なメールアドレス", () => {
    expect(EMAIL_REGEX.test("")).toBe(false);
    expect(EMAIL_REGEX.test("test")).toBe(false);
    expect(EMAIL_REGEX.test("test@")).toBe(false);
    expect(EMAIL_REGEX.test("@example.com")).toBe(false);
    expect(EMAIL_REGEX.test("test @example.com")).toBe(false);
  });
});

// --- mapRow ---

describe("mapRow", () => {
  const mapping = {
    companyName: "会社名",
    department: "部署名",
    position: "役職",
    name: "氏名",
    email: "e-mail",
  };

  it("正常系: CSV行をマッピングする", () => {
    const row = {
      会社名: "株式会社テスト",
      部署名: "営業部",
      役職: "部長",
      氏名: "田中太郎",
      "e-mail": "Tanaka@Test.co.jp",
    };
    const result = mapRow(row, mapping);
    expect(result.companyName).toBe("株式会社テスト");
    expect(result.department).toBe("営業部");
    expect(result.position).toBe("部長");
    expect(result.name).toBe("田中太郎");
    expect(result.email).toBe("tanaka@test.co.jp"); // 小文字化
  });

  it("正常系: 前後の空白がトリムされる", () => {
    const row = {
      会社名: "  株式会社テスト  ",
      部署名: "",
      役職: "",
      氏名: " 田中太郎 ",
      "e-mail": " test@EXAMPLE.com ",
    };
    const result = mapRow(row, mapping);
    expect(result.companyName).toBe("株式会社テスト");
    expect(result.department).toBe("");
    expect(result.name).toBe("田中太郎");
    expect(result.email).toBe("test@example.com");
  });

  it("エッジ: マッピング先の列が存在しない場合は空文字", () => {
    const row = { 会社名: "テスト" };
    const result = mapRow(row, mapping);
    expect(result.companyName).toBe("テスト");
    expect(result.department).toBe("");
    expect(result.name).toBe("");
    expect(result.email).toBe("");
  });
});

// --- validateRow ---

describe("validateRow", () => {
  it("正常系: 全必須項目が揃っていればnull", () => {
    const row = {
      companyName: "株式会社テスト",
      department: "",
      position: "",
      name: "田中",
      email: "test@example.com",
    };
    expect(validateRow(row)).toBeNull();
  });

  it("異常系: 会社名が空", () => {
    const row = {
      companyName: "",
      department: "",
      position: "",
      name: "田中",
      email: "test@example.com",
    };
    expect(validateRow(row)).toBe("会社名が空です");
  });

  it("異常系: 氏名が空", () => {
    const row = {
      companyName: "テスト",
      department: "",
      position: "",
      name: "",
      email: "test@example.com",
    };
    expect(validateRow(row)).toBe("氏名が空です");
  });

  it("異常系: メールが空", () => {
    const row = {
      companyName: "テスト",
      department: "",
      position: "",
      name: "田中",
      email: "",
    };
    expect(validateRow(row)).toBe("メールアドレスが空です");
  });

  it("異常系: メール形式不正", () => {
    const row = {
      companyName: "テスト",
      department: "",
      position: "",
      name: "田中",
      email: "invalid-email",
    };
    expect(validateRow(row)).toBe("メールアドレスの形式が不正です");
  });

  it("正常系: 部署名・役職が空でもエラーにならない", () => {
    const row = {
      companyName: "テスト",
      department: "",
      position: "",
      name: "田中",
      email: "test@example.com",
    };
    expect(validateRow(row)).toBeNull();
  });
});

// --- validateAndMapRows ---

describe("validateAndMapRows", () => {
  const mapping = {
    companyName: "会社名",
    department: "部署名",
    position: "役職",
    name: "氏名",
    email: "e-mail",
  };

  it("正常系: 有効行とエラー行を分離する", () => {
    const rows = [
      { 会社名: "テストA", 部署名: "", 役職: "", 氏名: "田中", "e-mail": "a@test.com" },
      { 会社名: "", 部署名: "", 役職: "", 氏名: "佐藤", "e-mail": "b@test.com" },
      { 会社名: "テストC", 部署名: "", 役職: "", 氏名: "鈴木", "e-mail": "invalid" },
    ];
    const result = validateAndMapRows(rows, mapping);

    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0].companyName).toBe("テストA");
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].reason).toBe("会社名が空です");
    expect(result.errors[0].row).toBe(3); // row index 1 + 2
    expect(result.errors[1].reason).toBe("メールアドレスの形式が不正です");
  });

  it("正常系: 全行が有効な場合エラーは空", () => {
    const rows = [
      { 会社名: "A社", 部署名: "", 役職: "", 氏名: "田中", "e-mail": "a@test.com" },
      { 会社名: "B社", 部署名: "営業", 役職: "課長", 氏名: "佐藤", "e-mail": "b@test.com" },
    ];
    const result = validateAndMapRows(rows, mapping);
    expect(result.validRows).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("正常系: 全行がエラーの場合validRowsは空", () => {
    const rows = [
      { 会社名: "", 部署名: "", 役職: "", 氏名: "", "e-mail": "" },
    ];
    const result = validateAndMapRows(rows, mapping);
    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("エッジ: 空配列の場合は両方空", () => {
    const result = validateAndMapRows([], mapping);
    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

// --- detectHeaderRow ---

describe("detectHeaderRow", () => {
  it("正常系: Eightの先頭メタ行をスキップする", () => {
    const csv = `04月04日にEightで生成された名刺リストです。
合計 1 件
*注意書き

会社名,部署名,役職,氏名,e-mail
株式会社テスト,,代表,田中,test@test.com`;

    const result = detectHeaderRow(csv);
    expect(result).toContain("会社名,部署名,役職,氏名,e-mail");
    expect(result).not.toContain("Eightで生成");
  });

  it("正常系: ヘッダーが1行目なら全文そのまま返す", () => {
    const csv = `会社名,部署名,役職,氏名,e-mail
株式会社テスト,,代表,田中,test@test.com`;

    const result = detectHeaderRow(csv);
    expect(result).toBe(csv);
  });

  it("エッジ: 会社名もe-mailも含まないCSVはそのまま返す", () => {
    const csv = `name,email,phone
田中,test@test.com,090`;

    const result = detectHeaderRow(csv);
    expect(result).toBe(csv);
  });
});

// --- mergeContactData ---

describe("mergeContactData", () => {
  it("正常系: 新データが優先される", () => {
    const newData = { companyName: "新会社", department: "新部署" };
    const existing = { companyName: "旧会社", department: "旧部署" };
    const result = mergeContactData(newData, existing, ["companyName", "department"]);
    expect(result.companyName).toBe("新会社");
    expect(result.department).toBe("新部署");
  });

  it("正常系: 新データが空文字なら既存データを保持する", () => {
    const newData = { companyName: "新会社", department: "" };
    const existing = { companyName: "旧会社", department: "旧部署" };
    const result = mergeContactData(newData, existing, ["companyName", "department"]);
    expect(result.companyName).toBe("新会社");
    expect(result.department).toBe("旧部署");
  });

  it("エッジ: 両方空の場合は空", () => {
    const newData = { companyName: "", department: "" };
    const existing = { companyName: "", department: "" };
    const result = mergeContactData(newData, existing, ["companyName", "department"]);
    expect(result.companyName).toBe("");
    expect(result.department).toBe("");
  });
});
