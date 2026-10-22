import "server-only";
import { prisma } from "@/lib/db";

export async function findOverlap(motorcycleId: string, start: Date, end: Date, ignoreBookingId?: string) {
  const booking = await prisma.rentalBooking.findFirst({
    where: {
      motorcycleId,
      status: "CONFIRMED",
      ...(ignoreBookingId ? { NOT: { id: ignoreBookingId } } : {}),
      pickupAt: { lt: end },
      returnAt: { gt: start },
    },
  });
  if (booking) return "booking" as const;
  const block = await prisma.rentalBlock.findFirst({
    where: { motorcycleId, startAt: { lt: end }, endAt: { gt: start } },
  });
  return block ? ("block" as const) : null;
}
