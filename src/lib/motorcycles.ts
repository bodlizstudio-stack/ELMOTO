import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const bikeInclude = {
  images: { orderBy: [{ isCover: "desc" as const }, { sortOrder: "asc" as const }] },
  specifications: { orderBy: { label: "asc" as const } },
  rentalRates: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.MotorcycleInclude;

export type PublicBike = Prisma.MotorcycleGetPayload<{ include: typeof bikeInclude }>;

export function coverOf(bike: { images: { url: string; alt: string; isCover: boolean }[] }) {
  return bike.images.find((image) => image.isCover) ?? bike.images[0] ?? null;
}

const publicStatuses = ["AVAILABLE", "RESERVED", "SOLD"];

export async function getBikeBySlug(slug: string) {
  const bike = await prisma.motorcycle.findUnique({ where: { slug }, include: bikeInclude });
  if (!bike || bike.status === "HIDDEN" || bike.status === "ARCHIVED") return null;
  return bike;
}

export async function listSaleBikes(filters: CatalogFilters) {
  const where: Prisma.MotorcycleWhereInput = {
    forSale: true,
    status: { in: filters.availability === "all" ? publicStatuses : filters.availability ? [filters.availability] : ["AVAILABLE", "RESERVED"] },
  };
  if (filters.brand) where.brand = filters.brand;
  if (filters.category) where.category = filters.category;
  if (filters.condition) where.condition = filters.condition;
  if (filters.license) where.licenseCategory = filters.license;
  if (filters.yearMin || filters.yearMax) {
    where.year = {};
    if (filters.yearMin) where.year.gte = filters.yearMin;
    if (filters.yearMax) where.year.lte = filters.yearMax;
  }
  if (filters.mileageMax != null) where.mileageKm = { lte: filters.mileageMax };
  if (filters.ccMin || filters.ccMax) {
    where.engineCc = {};
    if (filters.ccMin) where.engineCc.gte = filters.ccMin;
    if (filters.ccMax) where.engineCc.lte = filters.ccMax;
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    where.priceConfirmed = true;
    where.priceCents = { gt: 0 };
    if (filters.priceMin != null) where.priceCents.gte = filters.priceMin * 100;
    if (filters.priceMax != null) where.priceCents.lte = filters.priceMax * 100;
  }

  const bikes = await prisma.motorcycle.findMany({ where, include: bikeInclude });
  const model = filters.model.trim().toLowerCase();
  const filtered = model ? bikes.filter((bike) => `${bike.model} ${bike.variant}`.toLowerCase().includes(model)) : bikes;
  const sorted = filtered.sort((a, b) => compareBikes(a, b, filters.sort));
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(filters.page, 1), pages);
  return {
    total: sorted.length,
    page,
    pages,
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
  };
}

function compareBikes(a: PublicBike, b: PublicBike, sort: string) {
  if (sort === "price_asc" || sort === "price_desc") {
    const av = a.priceConfirmed && a.priceCents && a.priceCents > 0 ? a.priceCents : Number.POSITIVE_INFINITY;
    const bv = b.priceConfirmed && b.priceCents && b.priceCents > 0 ? b.priceCents : Number.POSITIVE_INFINITY;
    return sort === "price_asc" ? av - bv : bv - av;
  }
  if (sort === "year_asc") return a.year - b.year;
  if (sort === "year_desc") return b.year - a.year;
  if (sort === "mileage_asc") return (a.mileageKm ?? Number.POSITIVE_INFINITY) - (b.mileageKm ?? Number.POSITIVE_INFINITY);
  return b.publishedAt.getTime() - a.publishedAt.getTime();
}

export type CatalogFilters = {
  brand: string;
  model: string;
  category: string;
  condition: string;
  license: string;
  availability: string;
  yearMin?: number;
  yearMax?: number;
  mileageMax?: number;
  ccMin?: number;
  ccMax?: number;
  priceMin?: number;
  priceMax?: number;
  sort: string;
  page: number;
};

export function readFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };
  const num = (key: string) => {
    const value = Number(one(key));
    return Number.isFinite(value) && one(key) !== "" ? value : undefined;
  };
  return {
    brand: one("brand"),
    model: one("model"),
    category: one("category"),
    condition: one("condition"),
    license: one("license"),
    availability: one("availability"),
    yearMin: num("yearMin"),
    yearMax: num("yearMax"),
    mileageMax: num("mileageMax"),
    ccMin: num("ccMin"),
    ccMax: num("ccMax"),
    priceMin: num("priceMin"),
    priceMax: num("priceMax"),
    sort: one("sort") || "newest",
    page: Math.max(1, num("page") || 1),
  };
}

export async function filterOptions() {
  const bikes = await prisma.motorcycle.findMany({
    where: { forSale: true, status: { in: publicStatuses } },
    select: { brand: true, category: true, licenseCategory: true },
  });
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "sl"));
  return {
    brands: unique(bikes.map((bike) => bike.brand)),
    categories: unique(bikes.map((bike) => bike.category)),
    licenses: unique(bikes.map((bike) => bike.licenseCategory)),
  };
}

export async function homeBikes() {
  const where = { forSale: true, status: { in: ["AVAILABLE", "RESERVED"] } };
  const featured = await prisma.motorcycle.findMany({
    where: { ...where, featured: true },
    include: bikeInclude,
    orderBy: [{ featuredOrder: "asc" }, { publishedAt: "desc" }],
    take: 8,
  });
  if (featured.length >= 6) return { featured, newest: [] as PublicBike[] };
  const rest = await prisma.motorcycle.findMany({
    where: { ...where, id: { notIn: featured.map((bike) => bike.id) } },
    include: bikeInclude,
    orderBy: { publishedAt: "desc" },
    take: 8 - featured.length,
  });
  const selected = [...featured, ...rest];
  const newest = await prisma.motorcycle.findMany({
    where: { ...where, id: { notIn: selected.map((bike) => bike.id) } },
    include: bikeInclude,
    orderBy: { publishedAt: "desc" },
    take: 4,
  });
  return { featured: selected, newest };
}

export async function relatedBikes(bike: PublicBike) {
  const candidates = await prisma.motorcycle.findMany({
    where: {
      id: { not: bike.id },
      forSale: true,
      status: { in: ["AVAILABLE", "RESERVED"] },
      OR: [{ brand: bike.brand }, ...(bike.category ? [{ category: bike.category }] : [])],
    },
    include: bikeInclude,
    take: 12,
  });
  return candidates
    .sort((a, b) => {
      const as = (a.brand === bike.brand ? 2 : 0) + (a.category && a.category === bike.category ? 1 : 0);
      const bs = (b.brand === bike.brand ? 2 : 0) + (b.category && b.category === bike.category ? 1 : 0);
      return bs - as;
    })
    .slice(0, 3);
}

export async function rentalBikes() {
  return prisma.motorcycle.findMany({
    where: { forRent: true, status: "AVAILABLE" },
    include: bikeInclude,
    orderBy: [{ featured: "desc" }, { brand: "asc" }],
  });
}

export async function publicChoices() {
  return prisma.motorcycle.findMany({
    where: { status: { in: ["AVAILABLE", "RESERVED"] }, OR: [{ forSale: true }, { forRent: true }] },
    select: { id: true, brand: true, model: true, variant: true, forSale: true, forRent: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });
}
