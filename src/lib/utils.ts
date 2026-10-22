export function slugify(input: string) {
  return input
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatPrice(cents: number | null | undefined, confirmed: boolean) {
  if (cents == null || cents <= 0 || !confirmed) return "Cena na povpraševanje";
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatKm(km: number | null | undefined) {
  if (km == null || km < 0) return null;
  return `${new Intl.NumberFormat("sl-SI").format(km)} km`;
}

export function formatCc(cc: number | null | undefined) {
  if (cc == null || cc <= 0) return null;
  return `${new Intl.NumberFormat("sl-SI").format(cc)} ccm`;
}

export function formatPower(powerKw: number | null | undefined, powerHp: number | null | undefined) {
  const kw = powerKw && powerKw > 0 ? powerKw : null;
  const hp = powerHp && powerHp > 0 ? powerHp : null;
  if (!kw && !hp) return null;
  if (kw && hp) return `${trimNum(kw)} kW (${trimNum(hp)} KM)`;
  if (kw) return `${trimNum(kw)} kW (${trimNum(kw * 1.35962)} KM, preračun)`;
  return `${trimNum((hp as number) / 1.35962)} kW (preračun), ${trimNum(hp as number)} KM`;
}

function trimNum(value: number) {
  return new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 1 }).format(value);
}

export function conditionLabel(condition: string) {
  if (condition === "NEW") return "Novo";
  if (condition === "USED") return "Rabljeno";
  return "";
}

export function statusLabel(status: string) {
  if (status === "RESERVED") return "Rezervirano";
  if (status === "SOLD") return "Prodano";
  if (status === "HIDDEN") return "Skrito";
  if (status === "ARCHIVED") return "Arhivirano";
  return "Na voljo";
}

export function stockLabel(status: string) {
  if (status === "SOLD") return "Prodano";
  if (status === "RESERVED") return "Rezervirano";
  return "Na voljo";
}

export function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseSpecs(text: string) {
  return lines(text)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { label: "Opomba", value: line };
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    })
    .filter((item) => item.label && item.value);
}

export function euroToCents(raw: string) {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return { cents: null as number | null, zero: false };
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return { error: "Cena ni veljavna." as const };
  if (value === 0) return { cents: null, zero: true };
  return { cents: Math.round(value * 100), zero: false };
}

export function displayName(bike: { brand: string; model: string; variant?: string }) {
  return [bike.brand, bike.model, bike.variant].filter(Boolean).join(" ");
}

export function factualSummary(bike: {
  brand: string;
  model: string;
  variant?: string;
  year: number;
  mileageKm?: number | null;
  engineCc?: number | null;
  color?: string;
}) {
  const parts = [`${displayName(bike)}, letnik ${bike.year}.`];
  const km = formatKm(bike.mileageKm);
  const cc = formatCc(bike.engineCc);
  if (km) parts.push(`Prevoženih ${km}.`);
  if (cc) parts.push(`Prostornina ${cc}.`);
  if (bike.color) parts.push(`Barva: ${bike.color}.`);
  parts.push("Oglas EL-MOTO, Trzin.");
  return parts.join(" ");
}

export function isLocalUpload(url: string) {
  return url.startsWith("/uploads/") && !url.includes("..");
}
