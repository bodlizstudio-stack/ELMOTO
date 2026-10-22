import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids")?.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 30) ?? [];
  if (!ids.length) return NextResponse.json([]);
  const bikes = await prisma.motorcycle.findMany({
    where: { id: { in: ids }, status: { notIn: ["HIDDEN", "ARCHIVED"] } },
    include: { images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1 } },
  });
  return NextResponse.json(
    bikes.map((bike) => ({
      id: bike.id,
      slug: bike.slug,
      brand: bike.brand,
      model: bike.model,
      variant: bike.variant,
      year: bike.year,
      mileageKm: bike.mileageKm,
      engineCc: bike.engineCc,
      powerKw: bike.powerKw,
      powerHp: bike.powerHp,
      transmission: bike.transmission,
      driveType: bike.driveType,
      color: bike.color,
      licenseCategory: bike.licenseCategory,
      category: bike.category,
      condition: bike.condition,
      status: bike.status,
      priceCents: bike.priceConfirmed && bike.priceCents && bike.priceCents > 0 ? bike.priceCents : null,
      priceConfirmed: Boolean(bike.priceConfirmed && bike.priceCents && bike.priceCents > 0),
      image: bike.images[0]?.url ?? null,
    })),
  );
}
