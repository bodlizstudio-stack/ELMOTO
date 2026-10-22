import { PrismaClient } from "@prisma/client";
import { formatPrice } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const bike = await prisma.motorcycle.create({
    data: {
      slug: `preverjanje-${Date.now()}`,
      brand: "Preverjanje",
      model: "Test",
      year: 2024,
      status: "AVAILABLE",
      forSale: true,
      forRent: true,
      priceCents: 0,
      priceConfirmed: true,
    },
  });
  const inquiry = await prisma.inquiry.create({
    data: {
      type: "GENERAL",
      name: "Testni Obiskovalec",
      email: "test@example.com",
      message: "Preverjanje shranjevanja povpraševanja.",
      privacyAccepted: true,
    },
  });
  const pickup = new Date("2026-06-01T07:00:00.000Z");
  const ret = new Date("2026-06-04T07:00:00.000Z");
  await prisma.rentalBooking.create({
    data: {
      motorcycleId: bike.id,
      name: "Potrjena rezervacija",
      email: "rezervacija@example.com",
      phone: "070000000",
      licenseCategory: "A",
      pickupAt: pickup,
      returnAt: ret,
      days: 3,
      status: "CONFIRMED",
      termsAccepted: true,
      privacyAccepted: true,
    },
  });
  const overlap = await prisma.rentalBooking.findFirst({
    where: {
      motorcycleId: bike.id,
      status: "CONFIRMED",
      pickupAt: { lt: new Date("2026-06-05T07:00:00.000Z") },
      returnAt: { gt: new Date("2026-06-03T07:00:00.000Z") },
    },
  });
  const clear = await prisma.rentalBooking.findFirst({
    where: {
      motorcycleId: bike.id,
      status: "CONFIRMED",
      pickupAt: { lt: new Date("2026-06-06T07:00:00.000Z") },
      returnAt: { gt: new Date("2026-06-04T07:00:00.000Z") },
    },
  });
  if (!inquiry.id || !overlap || clear || formatPrice(0, true) !== "Cena na povpraševanje") {
    throw new Error("Preverjanje baze ni uspelo.");
  }
  await prisma.inquiry.delete({ where: { id: inquiry.id } });
  await prisma.motorcycle.delete({ where: { id: bike.id } });
  console.log("Baza: povpraševanje, prekrivanje in cena 0 so preverjeni.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
