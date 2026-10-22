import { describe, expect, it } from "vitest";
import { parseInTimeZone } from "@/lib/time";
import { lowestDailyCents, quoteCents, rangesOverlap, rentalDays, selectRate } from "@/lib/rental";
import { euroToCents, formatPrice, slugify } from "@/lib/utils";
import { contactSchema } from "@/lib/validators";
import { parseMotorcycleImport } from "@/lib/import-motorcycles";

describe("cene", () => {
  it("ne prikaže 0 EUR ali nepotrjene cene", () => {
    expect(formatPrice(0, true)).toBe("Cena na povpraševanje");
    expect(formatPrice(150000, false)).toBe("Cena na povpraševanje");
    expect(formatPrice(null, true)).toBe("Cena na povpraševanje");
    expect(formatPrice(150000, true)).toMatch(/1[.\s]?500/);
  });

  it("0 EUR shrani kot neznano ceno", () => {
    expect(euroToCents("0")).toEqual({ cents: null, zero: true });
    expect(euroToCents("")).toEqual({ cents: null, zero: false });
    expect(euroToCents("12,5")?.cents).toBe(1250);
  });
});

describe("slug", () => {
  it("poenostavi slovenske znake", () => {
    expect(slugify("BMW R 1250 RT")).toBe("bmw-r-1250-rt");
    expect(slugify("Špruha čžš")).toBe("spruha-czs");
  });
});

describe("termini", () => {
  it("razbere uro v Sloveniji", () => {
    expect(parseInTimeZone("2026-01-15", "10:00").toISOString()).toBe("2026-01-15T09:00:00.000Z");
    expect(parseInTimeZone("2026-07-15", "10:00").toISOString()).toBe("2026-07-15T08:00:00.000Z");
  });

  it("prepozna prekrivanje", () => {
    const a = new Date("2026-05-01T08:00:00Z");
    const b = new Date("2026-05-05T08:00:00Z");
    const c = new Date("2026-05-05T08:00:00Z");
    const d = new Date("2026-05-07T08:00:00Z");
    expect(rangesOverlap(a, b, new Date("2026-05-04T08:00:00Z"), d)).toBe(true);
    expect(rangesOverlap(a, b, c, d)).toBe(false);
    expect(rentalDays(a, b)).toBe(4);
  });

  it("izračuna samo potrjen cenik", () => {
    const rate = {
      dailyCents: 10000,
      weekendCents: 12000,
      multidayCents: 8000,
      seasonStart: "",
      seasonEnd: "",
      confirmed: true,
    };
    const pickup = parseInTimeZone("2026-05-04", "09:00");
    expect(quoteCents(pickup, 2, rate)).toBeGreaterThan(0);
    expect(quoteCents(pickup, 3, rate)).toBe(24000);
    expect(quoteCents(pickup, 2, { ...rate, confirmed: false })).toBeNull();
    expect(selectRate([{ ...rate, confirmed: false }], pickup)).toBeNull();
    expect(lowestDailyCents([{ ...rate, confirmed: false }])).toBeNull();
  });
});

describe("obrazec", () => {
  it("zavrne prekratko sporočilo in manjkajoče soglasje", () => {
    const result = contactSchema.safeParse({
      name: "A",
      email: "neveljavno",
      phone: "",
      type: "GENERAL",
      message: "kratek",
      privacy: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("uvoz", () => {
  it("preskoči primer in ne šteje 0 EUR kot ceno", () => {
    const json = JSON.stringify({
      motorcycles: [
        { example: true, brand: "Test", model: "X", year: 2024 },
        { brand: "Honda", model: "NC750X", year: 2022, priceEur: 0, priceConfirmed: true, mileageKm: 12000 },
      ],
    });
    const result = parseMotorcycleImport(json, "motorji.json");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.priceCents).toBeNull();
    expect(result.rows[0]?.priceConfirmed).toBe(false);
    expect(result.rows[0]?.model).toBe("NC750X");
  });
});
