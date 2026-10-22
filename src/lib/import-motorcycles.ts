import { euroToCents } from "@/lib/utils";

export type ImportMotorcycle = {
  brand: string;
  model: string;
  variant: string;
  year: number;
  mileageKm: number | null;
  engineCc: number | null;
  powerKw: number | null;
  powerHp: number | null;
  engineType: string;
  transmission: string;
  driveType: string;
  color: string;
  licenseCategory: string;
  category: string;
  condition: "NEW" | "USED";
  status: string;
  forSale: boolean;
  forRent: boolean;
  priceCents: number | null;
  priceConfirmed: boolean;
  description: string;
  equipment: string;
  serviceHistory: string;
  source: string;
  sourceCheckedAt: string;
  imageUrls: string[];
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  specs: string;
};

export type ImportResult = {
  rows: ImportMotorcycle[];
  errors: string[];
};

const statuses = new Set(["AVAILABLE", "RESERVED", "SOLD", "HIDDEN", "ARCHIVED"]);

function bool(value: unknown, fallback: boolean) {
  if (value == null || value === "") return fallback;
  const text = String(value).trim().toLowerCase();
  if (["1", "true", "da", "yes"].includes(text)) return true;
  if (["0", "false", "ne", "no"].includes(text)) return false;
  return fallback;
}

function optionalInt(value: unknown) {
  if (value == null || String(value).trim() === "") return null;
  const number = Number(String(value).replace(",", "."));
  if (!Number.isFinite(number)) return null;
  return Math.round(number);
}

function safeImage(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if ((trimmed.startsWith("/uploads/") || trimmed.startsWith("/images/instagram/")) && !trimmed.includes("..")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:") return trimmed;
  } catch {
    return null;
  }
  return null;
}

function fromRecord(record: Record<string, unknown>, row: number): { item?: ImportMotorcycle; error?: string } {
  if (record.example === true || record._example === true) return {};
  const brand = String(record.brand ?? "").trim();
  const model = String(record.model ?? "").trim();
  if (!brand || !model || brand.startsWith("#")) return {};
  const year = optionalInt(record.year);
  if (!year || year < 1970 || year > 2035) return { error: `Vrstica ${row}: manjka veljavno leto.` };
  const priceField = record.priceEur ?? record.price;
  const price = euroToCents(priceField == null ? "" : String(priceField));
  if ("error" in price) return { error: `Vrstica ${row}: ${price.error}` };
  const condition = String(record.condition ?? "USED").toUpperCase() === "NEW" ? "NEW" : "USED";
  const statusRaw = String(record.status ?? "AVAILABLE").toUpperCase();
  const status = statuses.has(statusRaw) ? statusRaw : "AVAILABLE";
  const images = Array.isArray(record.imageUrls)
    ? record.imageUrls.map(String)
    : String(record.imageUrls ?? record.images ?? "")
        .split("|")
        .map((item) => item.trim());
  return {
    item: {
      brand,
      model,
      variant: String(record.variant ?? "").trim(),
      year,
      mileageKm: optionalInt(record.mileageKm),
      engineCc: optionalInt(record.engineCc),
      powerKw: record.powerKw == null || record.powerKw === "" ? null : Number(record.powerKw),
      powerHp: record.powerHp == null || record.powerHp === "" ? null : Number(record.powerHp),
      engineType: String(record.engineType ?? "").trim(),
      transmission: String(record.transmission ?? "").trim(),
      driveType: String(record.driveType ?? "").trim(),
      color: String(record.color ?? "").trim(),
      licenseCategory: String(record.licenseCategory ?? "").trim(),
      category: String(record.category ?? "").trim(),
      condition,
      status,
      forSale: bool(record.forSale, true),
      forRent: bool(record.forRent, false),
      priceCents: price.cents,
      priceConfirmed: price.cents != null && bool(record.priceConfirmed, false),
      description: String(record.description ?? "").trim(),
      equipment: String(record.equipment ?? "").trim(),
      serviceHistory: String(record.serviceHistory ?? "").trim(),
      source: String(record.source ?? "").trim(),
      sourceCheckedAt: String(record.sourceCheckedAt ?? "").trim(),
      imageUrls: images.map(safeImage).filter((url): url is string => Boolean(url)),
      featured: bool(record.featured, false),
      seoTitle: String(record.seoTitle ?? "").trim(),
      seoDescription: String(record.seoDescription ?? "").trim(),
      specs: String(record.specs ?? "").trim(),
    },
  };
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((columns) => columns.some((column) => column && !column.startsWith("#")));
}

export function parseMotorcycleImport(text: string, filename: string): ImportResult {
  const errors: string[] = [];
  const rows: ImportMotorcycle[] = [];
  const lower = filename.toLowerCase();
  try {
    if (lower.endsWith(".json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
      const parsed = JSON.parse(text) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { motorcycles?: unknown }).motorcycles)
          ? (parsed as { motorcycles: unknown[] }).motorcycles
          : null;
      if (!list) return { rows, errors: ["JSON mora biti seznam ali objekt s poljem motorcycles."] };
      list.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          errors.push(`Vrstica ${index + 1}: neveljaven zapis.`);
          return;
        }
        const result = fromRecord(item as Record<string, unknown>, index + 1);
        if (result.error) errors.push(result.error);
        if (result.item) rows.push(result.item);
      });
      return { rows, errors };
    }
  } catch {
    return { rows, errors: ["JSON datoteke ni mogoče prebrati."] };
  }

  const table = parseCsv(text);
  if (!table.length) return { rows, errors: ["Datoteka je prazna."] };
  const header = table[0].map((column) => column.trim());
  table.slice(1).forEach((columns, index) => {
    const record: Record<string, string> = {};
    header.forEach((key, keyIndex) => {
      record[key] = columns[keyIndex] ?? "";
    });
    const result = fromRecord(record, index + 2);
    if (result.error) errors.push(result.error);
    if (result.item) rows.push(result.item);
  });
  return { rows, errors };
}
