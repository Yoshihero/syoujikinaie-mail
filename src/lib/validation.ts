export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ImportRow {
  companyName: string;
  department: string;
  position: string;
  name: string;
  email: string;
}

export interface ImportError {
  row: number;
  data: Record<string, string>;
  reason: string;
}

export interface MappedRow {
  mapped: ImportRow;
  error: string | null;
}

export function mapRow(
  row: Record<string, string>,
  mapping: Record<string, string>
): ImportRow {
  return {
    companyName: (row[mapping.companyName] || "").trim(),
    department: (row[mapping.department] || "").trim(),
    position: (row[mapping.position] || "").trim(),
    name: (row[mapping.name] || "").trim(),
    email: (row[mapping.email] || "").trim().toLowerCase(),
  };
}

export function validateRow(mapped: ImportRow): string | null {
  if (!mapped.companyName) return "会社名が空です";
  if (!mapped.name) return "氏名が空です";
  if (!mapped.email) return "メールアドレスが空です";
  if (!EMAIL_REGEX.test(mapped.email)) return "メールアドレスの形式が不正です";
  return null;
}

export function validateAndMapRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): { validRows: ImportRow[]; errors: ImportError[] } {
  const validRows: ImportRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mapped = mapRow(row, mapping);
    const error = validateRow(mapped);

    if (error) {
      errors.push({ row: i + 2, data: row, reason: error });
    } else {
      validRows.push(mapped);
    }
  }

  return { validRows, errors };
}

export function detectHeaderRow(text: string): string {
  const lines = text.split("\n");
  const headerIndex = lines.findIndex(
    (line) => line.includes("会社名") && line.includes("e-mail")
  );
  return headerIndex > 0 ? lines.slice(headerIndex).join("\n") : text;
}

export function mergeContactData<T extends Record<string, unknown>>(
  newData: T,
  existing: T,
  fields: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const field of fields) {
    result[field] = (newData[field] || existing[field]) as T[keyof T];
  }
  return result;
}
