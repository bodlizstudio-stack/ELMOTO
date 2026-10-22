"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, clearSession } from "@/lib/auth";
import { audit, requireAdmin } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { parseMotorcycleImport } from "@/lib/import-motorcycles";
import { parseSpecs, slugify, euroToCents } from "@/lib/utils";
import { findOverlap } from "@/lib/availability";
import { parseInTimeZone } from "@/lib/time";
import { removeUpload, saveImage } from "@/lib/uploads";

export type ActionState = { error?: string; ok?: string } | null;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalInt(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const number = Number(value);
  if (!Number.isInteger(number)) return undefined;
  return number;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function rememberBrand(name: string) {
  const slug = slugify(name);
  if (!slug) return;
  await prisma.brand.upsert({
    where: { name },
    update: {},
    create: { name, slug },
  }).catch(async () => {
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (!existing) await prisma.brand.create({ data: { name, slug: `${slug}-${Date.now()}` } }).catch(() => undefined);
  });
}

async function rememberCategory(name: string) {
  if (!name) return;
  const slug = slugify(name);
  if (!slug) return;
  await prisma.motorcycleCategory.upsert({
    where: { name },
    update: {},
    create: { name, slug },
  }).catch(() => undefined);
}

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "motor";
  let slug = root;
  let n = 2;
  while (await prisma.motorcycle.findFirst({ where: { slug, NOT: ignoreId ? { id: ignoreId } : undefined } })) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return { error: "Preveč poskusov. Počakajte in poskusite znova." };
  }
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN" || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Napačen e-poštni naslov ali geslo." };
  }
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}

export async function saveMotorcycle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const brand = text(formData, "brand");
  const model = text(formData, "model");
  const year = optionalInt(formData, "year");
  if (!brand || !model) return { error: "Vnesite znamko in model." };
  if (year == null || year < 1970 || year > 2035) return { error: "Vnesite veljavno leto." };
  const mileage = optionalInt(formData, "mileageKm");
  const engine = optionalInt(formData, "engineCc");
  if (mileage === undefined || engine === undefined) return { error: "Kilometri in prostornina morata biti cela števila." };
  const price = euroToCents(text(formData, "priceEur"));
  if ("error" in price && price.error) return { error: price.error };
  const powerKwRaw = text(formData, "powerKw");
  const powerHpRaw = text(formData, "powerHp");
  const powerKw = powerKwRaw ? Number(powerKwRaw.replace(",", ".")) : null;
  const powerHp = powerHpRaw ? Number(powerHpRaw.replace(",", ".")) : null;
  if ((powerKwRaw && !Number.isFinite(powerKw)) || (powerHpRaw && !Number.isFinite(powerHp))) {
    return { error: "Moč ni veljavna." };
  }
  const variant = text(formData, "variant");
  const slugInput = text(formData, "slug");
  const slug = await uniqueSlug(slugInput || `${brand}-${model}-${variant}-${year}`, id || undefined);
  const sourceDate = text(formData, "sourceCheckedAt");
  const data = {
    slug,
    brand,
    model,
    variant,
    year,
    mileageKm: mileage,
    engineCc: engine,
    powerKw: powerKw && powerKw > 0 ? powerKw : null,
    powerHp: powerHp && powerHp > 0 ? powerHp : null,
    engineType: text(formData, "engineType"),
    transmission: text(formData, "transmission"),
    driveType: text(formData, "driveType"),
    color: text(formData, "color"),
    licenseCategory: text(formData, "licenseCategory"),
    category: text(formData, "category"),
    condition: text(formData, "condition") === "NEW" ? "NEW" : "USED",
    status: ["AVAILABLE", "RESERVED", "SOLD", "HIDDEN", "ARCHIVED"].includes(text(formData, "status"))
      ? text(formData, "status")
      : "AVAILABLE",
    forSale: checked(formData, "forSale"),
    forRent: checked(formData, "forRent"),
    priceCents: price.cents,
    priceConfirmed: Boolean(price.cents) && checked(formData, "priceConfirmed"),
    description: text(formData, "description"),
    equipment: text(formData, "equipment"),
    serviceHistory: text(formData, "serviceHistory"),
    featured: checked(formData, "featured"),
    featuredOrder: optionalInt(formData, "featuredOrder") ?? 0,
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    source: text(formData, "source"),
    sourceCheckedAt: sourceDate ? new Date(`${sourceDate}T12:00:00`) : null,
  };
  const specs = parseSpecs(text(formData, "specs"));
  await rememberBrand(brand);
  await rememberCategory(data.category);
  const bike = id
    ? await prisma.motorcycle.update({ where: { id }, data })
    : await prisma.motorcycle.create({ data });
  await prisma.motorcycleSpecification.deleteMany({ where: { motorcycleId: bike.id } });
  if (specs.length) {
    await prisma.motorcycleSpecification.createMany({
      data: specs.map((spec) => ({ motorcycleId: bike.id, label: spec.label, value: spec.value })),
    });
  }
  await audit(admin.id, id ? "UPDATE" : "CREATE", "Motorcycle", bike.id, `${brand} ${model}`);
  revalidatePath("/", "layout");
  redirect(`/admin/motorji/${bike.id}?saved=1`);
}

export async function uploadMotorcycleImages(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const bike = await prisma.motorcycle.findUnique({ where: { id }, include: { images: true } });
  if (!bike) return;
  const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
  if (bike.images.length + files.length > 30) redirect(`/admin/motorji/${id}?error=prevec-fotografij`);
  let order = bike.images.reduce((max, image) => Math.max(max, image.sortOrder), 0);
  for (const file of files.slice(0, 12)) {
    const url = await saveImage(file);
    order += 1;
    await prisma.motorcycleImage.create({
      data: {
        motorcycleId: id,
        url,
        alt: text(formData, "alt") || `${bike.brand} ${bike.model}`,
        sortOrder: order,
        isCover: bike.images.length === 0 && order === 1,
      },
    });
  }
  await audit(admin.id, "UPLOAD", "MotorcycleImage", id, `${files.length} fotografij`);
  revalidatePath("/", "layout");
  redirect(`/admin/motorji/${id}?saved=1`);
}

export async function updateImage(formData: FormData) {
  const admin = await requireAdmin();
  const imageId = text(formData, "imageId");
  const action = text(formData, "imageAction");
  const image = await prisma.motorcycleImage.findUnique({ where: { id: imageId } });
  if (!image) return;
  if (action === "delete") {
    await prisma.motorcycleImage.delete({ where: { id: imageId } });
    await removeUpload(image.url);
    if (image.isCover) {
      const next = await prisma.motorcycleImage.findFirst({
        where: { motorcycleId: image.motorcycleId },
        orderBy: { sortOrder: "asc" },
      });
      if (next) await prisma.motorcycleImage.update({ where: { id: next.id }, data: { isCover: true } });
    }
  } else if (action === "cover") {
    await prisma.motorcycleImage.updateMany({ where: { motorcycleId: image.motorcycleId }, data: { isCover: false } });
    await prisma.motorcycleImage.update({ where: { id: imageId }, data: { isCover: true } });
  } else if (action === "up" || action === "down") {
    const sibling = await prisma.motorcycleImage.findFirst({
      where: {
        motorcycleId: image.motorcycleId,
        sortOrder: action === "up" ? { lt: image.sortOrder } : { gt: image.sortOrder },
      },
      orderBy: { sortOrder: action === "up" ? "desc" : "asc" },
    });
    if (sibling) {
      await prisma.motorcycleImage.update({ where: { id: image.id }, data: { sortOrder: sibling.sortOrder } });
      await prisma.motorcycleImage.update({ where: { id: sibling.id }, data: { sortOrder: image.sortOrder } });
    }
  }
  await audit(admin.id, action.toUpperCase(), "MotorcycleImage", image.motorcycleId, imageId);
  revalidatePath("/", "layout");
  redirect(`/admin/motorji/${image.motorcycleId}?saved=1`);
}

export async function setMotorcycleStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!["AVAILABLE", "RESERVED", "SOLD", "HIDDEN", "ARCHIVED"].includes(status)) return;
  await prisma.motorcycle.update({ where: { id }, data: { status } });
  await audit(admin.id, "STATUS", "Motorcycle", id, status);
  revalidatePath("/", "layout");
  redirect(`/admin/motorji/${id}?saved=1`);
}

export async function deleteMotorcycle(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  if (text(formData, "confirm") !== "IZBRISI") redirect(`/admin/motorji/${id}?error=potrditev`);
  const images = await prisma.motorcycleImage.findMany({ where: { motorcycleId: id } });
  await prisma.motorcycle.delete({ where: { id } });
  await Promise.all(images.map((image) => removeUpload(image.url)));
  await audit(admin.id, "DELETE", "Motorcycle", id);
  revalidatePath("/", "layout");
  redirect("/admin/motorji?deleted=1");
}

export async function importMotorcycles(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/uvoz?error=datoteka");
  if (file.size > 2_000_000) redirect("/admin/uvoz?error=velikost");
  const textContent = await file.text();
  const parsed = parseMotorcycleImport(textContent, file.name);
  let created = 0;
  for (const row of parsed.rows) {
    const slug = await uniqueSlug(`${row.brand}-${row.model}-${row.variant}-${row.year}`);
    const bike = await prisma.motorcycle.create({
      data: {
        slug,
        brand: row.brand,
        model: row.model,
        variant: row.variant,
        year: row.year,
        mileageKm: row.mileageKm,
        engineCc: row.engineCc,
        powerKw: row.powerKw && row.powerKw > 0 ? row.powerKw : null,
        powerHp: row.powerHp && row.powerHp > 0 ? row.powerHp : null,
        engineType: row.engineType,
        transmission: row.transmission,
        driveType: row.driveType,
        color: row.color,
        licenseCategory: row.licenseCategory,
        category: row.category,
        condition: row.condition,
        status: row.status,
        forSale: row.forSale,
        forRent: row.forRent,
        priceCents: row.priceCents,
        priceConfirmed: row.priceConfirmed,
        description: row.description,
        equipment: row.equipment,
        serviceHistory: row.serviceHistory,
        featured: row.featured,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        source: row.source,
        sourceCheckedAt: row.sourceCheckedAt ? new Date(row.sourceCheckedAt) : null,
        images: {
          create: row.imageUrls.map((url, index) => ({
            url,
            alt: `${row.brand} ${row.model}`,
            sortOrder: index,
            isCover: index === 0,
          })),
        },
        specifications: { create: parseSpecs(row.specs) },
      },
    });
    await rememberBrand(row.brand);
    await rememberCategory(row.category);
    created += 1;
    await audit(admin.id, "IMPORT", "Motorcycle", bike.id, slug);
  }
  await prisma.importJob.create({
    data: {
      filename: file.name,
      status: parsed.errors.length ? "PARTIAL" : "DONE",
      summary: `Uvoženih: ${created}. Napake: ${parsed.errors.join(" | ") || "ni"}`.slice(0, 2000),
    },
  });
  revalidatePath("/", "layout");
  redirect(`/admin/uvoz?imported=${created}&errors=${parsed.errors.length}`);
}

export async function updateBooking(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  const notes = text(formData, "internalNotes");
  const booking = await prisma.rentalBooking.findUnique({ where: { id } });
  if (!booking) return;
  if (!["NEW", "IN_PROGRESS", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"].includes(status)) return;
  if (status === "CONFIRMED") {
    const overlap = await findOverlap(booking.motorcycleId, booking.pickupAt, booking.returnAt, booking.id);
    if (overlap) redirect("/admin/najem?error=prekrivanje");
    await prisma.$transaction(async (tx) => {
      const again = await tx.rentalBooking.findFirst({
        where: {
          motorcycleId: booking.motorcycleId,
          status: "CONFIRMED",
          NOT: { id: booking.id },
          pickupAt: { lt: booking.returnAt },
          returnAt: { gt: booking.pickupAt },
        },
      });
      const block = await tx.rentalBlock.findFirst({
        where: {
          motorcycleId: booking.motorcycleId,
          startAt: { lt: booking.returnAt },
          endAt: { gt: booking.pickupAt },
        },
      });
      if (again || block) throw new Error("OVERLAP");
      await tx.rentalBooking.update({ where: { id }, data: { status, internalNotes: notes } });
      await tx.bookingEvent.create({ data: { bookingId: id, action: status, note: notes } });
    }).catch(() => {
      redirect("/admin/najem?error=prekrivanje");
    });
  } else {
    await prisma.rentalBooking.update({ where: { id }, data: { status, internalNotes: notes } });
    await prisma.bookingEvent.create({ data: { bookingId: id, action: status, note: notes } });
  }
  await audit(admin.id, "BOOKING", "RentalBooking", id, status);
  revalidatePath("/admin/najem");
  redirect("/admin/najem?saved=1");
}

export async function createBlock(formData: FormData) {
  const admin = await requireAdmin();
  const motorcycleId = text(formData, "motorcycleId");
  let start: Date;
  let end: Date;
  try {
    start = parseInTimeZone(text(formData, "startDate"), text(formData, "startTime") || "00:00");
    end = parseInTimeZone(text(formData, "endDate"), text(formData, "endTime") || "23:59");
  } catch {
    redirect("/admin/najem?error=datum");
  }
  if (end <= start) redirect("/admin/najem?error=datum");
  const overlap = await findOverlap(motorcycleId, start, end);
  if (overlap === "booking") redirect("/admin/najem?error=prekrivanje");
  await prisma.rentalBlock.create({
    data: { motorcycleId, startAt: start, endAt: end, reason: text(formData, "reason") },
  });
  await audit(admin.id, "BLOCK", "RentalBlock", motorcycleId, text(formData, "reason"));
  revalidatePath("/admin/najem");
  redirect("/admin/najem?saved=1");
}

export async function deleteBlock(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  await prisma.rentalBlock.delete({ where: { id } });
  await audit(admin.id, "DELETE", "RentalBlock", id);
  revalidatePath("/admin/najem");
  redirect("/admin/najem?saved=1");
}

export async function saveRate(formData: FormData) {
  const admin = await requireAdmin();
  const motorcycleId = text(formData, "motorcycleId");
  const id = text(formData, "rateId");
  const daily = euroToCents(text(formData, "dailyEur"));
  const weekend = euroToCents(text(formData, "weekendEur"));
  const multi = euroToCents(text(formData, "multidayEur"));
  const extra = euroToCents(text(formData, "extraKmEur"));
  const deposit = euroToCents(text(formData, "depositEur"));
  if ([daily, weekend, multi, extra, deposit].some((item) => "error" in item && item.error)) {
    redirect("/admin/najem?error=cena");
  }
  const data = {
    motorcycleId,
    label: text(formData, "label") || "Osnovni cenik",
    dailyCents: daily.cents,
    weekendCents: weekend.cents,
    multidayCents: multi.cents,
    seasonStart: text(formData, "seasonStart"),
    seasonEnd: text(formData, "seasonEnd"),
    kmLimitPerDay: optionalInt(formData, "kmLimitPerDay"),
    extraKmCents: extra.cents,
    depositCents: deposit.cents,
    extrasNote: text(formData, "extrasNote"),
    confirmed: checked(formData, "confirmed") && Boolean(daily.cents || weekend.cents || multi.cents),
  };
  if (id) await prisma.rentalRate.update({ where: { id }, data });
  else await prisma.rentalRate.create({ data });
  await audit(admin.id, "RATE", "RentalRate", motorcycleId);
  revalidatePath("/", "layout");
  redirect("/admin/najem?saved=1");
}

export async function updateInquiry(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  const notes = text(formData, "internalNotes");
  if (!["NEW", "IN_PROGRESS", "DONE"].includes(status)) return;
  await prisma.inquiry.update({ where: { id }, data: { status, internalNotes: notes } });
  await prisma.inquiryEvent.create({ data: { inquiryId: id, action: status, note: notes } });
  await audit(admin.id, "INQUIRY", "Inquiry", id, status);
  revalidatePath("/admin/povprasevanja");
  redirect(`/admin/povprasevanja/${id}?saved=1`);
}

export async function saveSettings(formData: FormData) {
  const admin = await requireAdmin();
  const entries = [
    ["phone", text(formData, "phone")],
    ["email", text(formData, "email")],
    ["instagram", text(formData, "instagram")],
    ["hours", text(formData, "hours")],
    ["notify_email", text(formData, "notifyEmail")],
    ["newsletter_enabled", checked(formData, "newsletter") ? "true" : "false"],
    ["seo_home_title", text(formData, "seoHomeTitle")],
    ["seo_home_description", text(formData, "seoHomeDescription")],
  ] as const;
  for (const [key, value] of entries) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  await audit(admin.id, "SETTINGS", "SiteSetting");
  revalidatePath("/", "layout");
  redirect("/admin/vsebina?saved=1");
}

export async function savePage(formData: FormData) {
  const admin = await requireAdmin();
  const slug = text(formData, "slug");
  await prisma.page.upsert({
    where: { slug },
    update: {
      title: text(formData, "title"),
      body: String(formData.get("body") ?? ""),
      seoTitle: text(formData, "seoTitle"),
      seoDescription: text(formData, "seoDescription"),
      confirmed: checked(formData, "confirmed"),
    },
    create: {
      slug,
      title: text(formData, "title"),
      body: String(formData.get("body") ?? ""),
      seoTitle: text(formData, "seoTitle"),
      seoDescription: text(formData, "seoDescription"),
      confirmed: checked(formData, "confirmed"),
    },
  });
  await audit(admin.id, "PAGE", "Page", slug);
  revalidatePath("/", "layout");
  redirect("/admin/vsebina?saved=1");
}

export async function saveFaq(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const data = {
    category: text(formData, "category") || "Splošno",
    question: text(formData, "question"),
    answer: text(formData, "answer"),
    sortOrder: optionalInt(formData, "sortOrder") ?? 0,
    published: checked(formData, "published"),
  };
  if (!data.question || !data.answer) redirect("/admin/vsebina?error=faq");
  if (id) await prisma.faqItem.update({ where: { id }, data });
  else await prisma.faqItem.create({ data });
  await audit(admin.id, id ? "UPDATE" : "CREATE", "FaqItem", id);
  revalidatePath("/pogosta-vprasanja");
  redirect("/admin/vsebina?saved=1");
}

export async function deleteFaq(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  await prisma.faqItem.delete({ where: { id } });
  await audit(admin.id, "DELETE", "FaqItem", id);
  revalidatePath("/pogosta-vprasanja");
  redirect("/admin/vsebina?saved=1");
}

export async function saveTestimonial(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const ratingRaw = optionalInt(formData, "rating");
  const data = {
    authorName: text(formData, "authorName"),
    text: text(formData, "text"),
    rating: ratingRaw && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null,
    source: text(formData, "source"),
    published: checked(formData, "published"),
  };
  if (!data.authorName || !data.text) redirect("/admin/vsebina?error=ocena");
  if (id) await prisma.testimonial.update({ where: { id }, data });
  else await prisma.testimonial.create({ data });
  await audit(admin.id, "TESTIMONIAL", "Testimonial", id);
  revalidatePath("/");
  redirect("/admin/vsebina?saved=1");
}

export async function deleteTestimonial(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  await prisma.testimonial.delete({ where: { id } });
  await audit(admin.id, "DELETE", "Testimonial", id);
  revalidatePath("/");
  redirect("/admin/vsebina?saved=1");
}

export async function uploadMedia(formData: FormData) {
  const admin = await requireAdmin();
  const kind = text(formData, "kind") || "gallery";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/vsebina?error=datoteka");
  const url = await saveImage(file);
  const count = await prisma.mediaAsset.count({ where: { kind } });
  await prisma.mediaAsset.create({
    data: {
      url,
      alt: text(formData, "alt"),
      kind,
      linkUrl: text(formData, "linkUrl"),
      sortOrder: count,
      published: true,
    },
  });
  await audit(admin.id, "UPLOAD", "MediaAsset", kind);
  revalidatePath("/", "layout");
  redirect("/admin/vsebina?saved=1");
}

export async function deleteMedia(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "id");
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return;
  await prisma.mediaAsset.delete({ where: { id } });
  await removeUpload(asset.url);
  await audit(admin.id, "DELETE", "MediaAsset", id);
  revalidatePath("/", "layout");
  redirect("/admin/vsebina?saved=1");
}

export async function createManualBooking(formData: FormData) {
  const admin = await requireAdmin();
  const motorcycleId = text(formData, "motorcycleId");
  const pickup = parseInTimeZone(text(formData, "pickupDate"), text(formData, "pickupTime") || "09:00");
  const ret = parseInTimeZone(text(formData, "returnDate"), text(formData, "returnTime") || "18:00");
  if (ret <= pickup) redirect("/admin/najem?error=datum");
  const overlap = await findOverlap(motorcycleId, pickup, ret);
  if (overlap) redirect("/admin/najem?error=prekrivanje");
  const days = Math.ceil((ret.getTime() - pickup.getTime()) / 86_400_000);
  await prisma.$transaction(async (tx) => {
    const again = await tx.rentalBooking.findFirst({
      where: {
        motorcycleId,
        status: "CONFIRMED",
        pickupAt: { lt: ret },
        returnAt: { gt: pickup },
      },
    });
    if (again) throw new Error("OVERLAP");
    await tx.rentalBooking.create({
      data: {
        motorcycleId,
        name: text(formData, "name") || "Ročni vnos",
        email: text(formData, "email") || "rocno@elmoto.local",
        phone: text(formData, "phone") || "",
        licenseCategory: text(formData, "licenseCategory") || "ni navedeno",
        message: text(formData, "message"),
        pickupAt: pickup,
        returnAt: ret,
        days,
        status: "CONFIRMED",
        termsAccepted: true,
        privacyAccepted: true,
        internalNotes: "Ročni vnos obstoječe rezervacije.",
        events: { create: { action: "CONFIRMED", note: "Ročni vnos administratorja." } },
      },
    });
  }).catch(() => redirect("/admin/najem?error=prekrivanje"));
  await audit(admin.id, "MANUAL_BOOKING", "RentalBooking", motorcycleId);
  revalidatePath("/admin/najem");
  redirect("/admin/najem?saved=1");
}
