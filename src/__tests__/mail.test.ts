import { describe, it, expect } from "vitest";
import { replaceFields, buildMailBody } from "@/lib/mail";

const sampleContact = {
  id: "test-id",
  companyName: "株式会社テスト",
  department: "営業部",
  position: "部長",
  name: "山田太郎",
  email: "yamada@test.co.jp",
};

const contactWithNulls = {
  id: "test-id-2",
  companyName: "株式会社ヌル",
  department: null,
  position: null,
  name: "佐藤花子",
  email: "sato@test.co.jp",
};

// --- replaceFields ---

describe("replaceFields", () => {
  it("正常系: 全差し込みタグを置換する", () => {
    const text = "{{会社名}} {{氏名}}様 {{部署名}} {{役職}}";
    const result = replaceFields(text, sampleContact);
    expect(result).toBe("株式会社テスト 山田太郎様 営業部 部長");
  });

  it("正常系: タグがない場合はそのまま返す", () => {
    const text = "こんにちは。お世話になっています。";
    const result = replaceFields(text, sampleContact);
    expect(result).toBe("こんにちは。お世話になっています。");
  });

  it("正常系: 同じタグが複数回あっても全て置換する", () => {
    const text = "{{氏名}}様、{{氏名}}様のご連絡先";
    const result = replaceFields(text, sampleContact);
    expect(result).toBe("山田太郎様、山田太郎様のご連絡先");
  });

  it("エッジ: department/positionがnullの場合は空文字に置換", () => {
    const text = "{{部署名}} {{役職}} {{氏名}}様";
    const result = replaceFields(text, contactWithNulls);
    expect(result).toBe("  佐藤花子様");
  });

  it("エッジ: 空文字を渡した場合は空文字を返す", () => {
    const result = replaceFields("", sampleContact);
    expect(result).toBe("");
  });
});

// --- buildMailBody ---

describe("buildMailBody", () => {
  it("正常系: 本文+署名+配信停止リンクが結合される", () => {
    const body = "{{氏名}}様\nお世話になっています。";
    const url = "https://example.com/unsubscribe/abc123";
    const result = buildMailBody(body, sampleContact, url);

    expect(result).toContain("山田太郎様");
    expect(result).toContain("お世話になっています。");
    expect(result).toContain("株式会社　正直な家");
    expect(result).toContain("03-6300-6384");
    expect(result).toContain("田中輝一");
    expect(result).toContain("http://syoujikinaie.com/");
    expect(result).toContain("配信停止はこちら：https://example.com/unsubscribe/abc123");
  });

  it("正常系: 差し込みタグが置換された状態で署名が付く", () => {
    const body = "{{会社名}} {{氏名}}様";
    const url = "https://example.com/unsub/token";
    const result = buildMailBody(body, sampleContact, url);

    expect(result).toContain("株式会社テスト 山田太郎様");
    expect(result).toContain("配信停止はこちら：");
  });

  it("エッジ: 本文が空でも署名と配信停止リンクは付く", () => {
    const result = buildMailBody("", sampleContact, "https://unsub.test/x");

    expect(result).toContain("株式会社　正直な家");
    expect(result).toContain("配信停止はこちら：https://unsub.test/x");
  });

  it("正常系: nullフィールドのコンタクトでもエラーにならない", () => {
    const result = buildMailBody(
      "{{部署名}}の{{氏名}}様",
      contactWithNulls,
      "https://unsub.test/y"
    );
    expect(result).toContain("の佐藤花子様");
    expect(result).toContain("配信停止はこちら：");
  });
});
