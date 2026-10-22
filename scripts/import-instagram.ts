import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/utils";

function loadEnv() {
  const file = path.join(process.cwd(), ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv();

type ImageRow = { file: string; alt: string; cover?: boolean };
type BikeRow = {
  slug: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  mileageKm: number | null;
  condition: string;
  featured: boolean;
  featuredOrder: number;
  publishedAt: string;
  description: string;
  source: string;
  images: ImageRow[];
};
type MediaRow = { kind: string; file: string; alt: string; linkUrl: string; sortOrder: number };
type Catalog = { checkedAt: string; motorcycles: BikeRow[]; media: MediaRow[] };

const root = process.cwd();
const imageDir = path.join(root, "public", "images", "instagram");

function publicPath(file: string) {
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    throw new Error(`Neveljavno ime datoteke: ${file}`);
  }
  const absolute = path.join(imageDir, file);
  if (!existsSync(absolute)) throw new Error(`Manjka fotografija: public/images/instagram/${file}`);
  return `/images/instagram/${file}`;
}

async function main() {
  const catalog = JSON.parse(readFileSync(path.join(root, "data", "instagram-posts.json"), "utf8")) as Catalog;
  const checkedAt = new Date(catalog.checkedAt);
  const prisma = new PrismaClient();
  try {
    for (const bike of catalog.motorcycles) {
      const brandSlug = slugify(bike.brand);
      await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: { name: bike.brand },
        create: { name: bike.brand, slug: brandSlug },
      });
      const saved = await prisma.motorcycle.upsert({
        where: { slug: bike.slug },
        create: {
          slug: bike.slug,
          brand: bike.brand,
          model: bike.model,
          variant: bike.variant,
          year: bike.year,
          mileageKm: bike.mileageKm,
          condition: bike.condition,
          status: "AVAILABLE",
          forSale: true,
          forRent: false,
          priceCents: null,
          priceConfirmed: false,
          description: bike.description,
          featured: bike.featured,
          featuredOrder: bike.featuredOrder,
          seoTitle: [bike.brand, bike.model, bike.variant].filter(Boolean).join(" "),
          seoDescription: bike.description,
          source: bike.source,
          sourceCheckedAt: checkedAt,
          publishedAt: new Date(bike.publishedAt),
        },
        update: {
          brand: bike.brand,
          model: bike.model,
          variant: bike.variant,
          year: bike.year,
          mileageKm: bike.mileageKm,
          condition: bike.condition,
          description: bike.description,
          featured: bike.featured,
          featuredOrder: bike.featuredOrder,
          seoTitle: [bike.brand, bike.model, bike.variant].filter(Boolean).join(" "),
          seoDescription: bike.description,
          source: bike.source,
          sourceCheckedAt: checkedAt,
          publishedAt: new Date(bike.publishedAt),
        },
      });
      await prisma.motorcycleImage.deleteMany({ where: { motorcycleId: saved.id } });
      await prisma.motorcycleImage.createMany({
        data: bike.images.map((image, index) => ({
          motorcycleId: saved.id,
          url: publicPath(image.file),
          alt: image.alt,
          sortOrder: index,
          isCover: Boolean(image.cover),
        })),
      });
    }

    await prisma.mediaAsset.deleteMany({ where: { url: { startsWith: "/images/instagram/" } } });
    await prisma.mediaAsset.createMany({
      data: catalog.media.map((item) => ({
        url: publicPath(item.file),
        alt: item.alt,
        kind: item.kind,
        linkUrl: item.linkUrl,
        sortOrder: item.sortOrder,
        published: true,
      })),
    });
    console.log(`Uvoženih motorjev: ${catalog.motorcycles.length}, medijev: ${catalog.media.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
