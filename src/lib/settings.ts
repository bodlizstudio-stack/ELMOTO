import "server-only";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export async function getSettings() {
  const rows = await prisma.siteSetting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const phoneDisplay = map.get("phone") || site.phoneDisplay;
  return {
    phoneDisplay,
    phoneTel: phoneDisplay.replace(/[^\d+]/g, "") || site.phoneTel,
    email: map.get("email") || site.email,
    instagram: map.get("instagram") || site.instagram,
    hours: map.get("hours") || "",
    notifyEmail: map.get("notify_email") || process.env.NOTIFY_EMAIL || site.email,
    newsletterEnabled: map.get("newsletter_enabled") === "true",
    seoHomeTitle: map.get("seo_home_title") || "",
    seoHomeDescription: map.get("seo_home_description") || "",
  };
}

export async function getPage(slug: string) {
  return prisma.page.findUnique({ where: { slug } });
}
