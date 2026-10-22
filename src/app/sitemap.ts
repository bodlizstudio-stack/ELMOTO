import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ["", "/motorji", "/najem", "/o-nas", "/pogosta-vprasanja", "/kontakt", "/zasebnost", "/piskotki", "/pogoji", "/pogoji-najema", "/podjetje"];
  const bikes = await prisma.motorcycle.findMany({
    where: { status: { in: ["AVAILABLE", "RESERVED", "SOLD"] } },
    select: { slug: true, updatedAt: true, forSale: true, forRent: true, status: true },
  });
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path || "/"}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...bikes.filter((bike) => bike.forSale).map((bike) => ({
      url: `${base}/motorji/${bike.slug}`,
      lastModified: bike.updatedAt,
      changeFrequency: "weekly" as const,
      priority: bike.status === "SOLD" ? 0.3 : 0.8,
    })),
    ...bikes.filter((bike) => bike.forRent && bike.status === "AVAILABLE").map((bike) => ({
      url: `${base}/najem/${bike.slug}`,
      lastModified: bike.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
