import { z } from "zod";

const phone = z
  .string()
  .trim()
  .max(40)
  .refine((value) => value === "" || value.replace(/\D/g, "").length >= 6, "Vnesite veljavno telefonsko številko.");

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Vnesite ime in priimek.").max(120),
  email: z.string().trim().email("Vnesite veljaven e-poštni naslov.").max(200),
  phone,
  type: z.enum(["PURCHASE", "RENTAL", "VIEWING", "GENERAL", "OTHER"]),
  motorcycleId: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Sporočilo naj vsebuje vsaj 10 znakov.").max(4000),
  privacy: z.literal("on", { errorMap: () => ({ message: "Za pošiljanje je potrebna seznanitev s politiko zasebnosti." }) }),
  website: z.string().max(0, "Pošiljanje ni uspelo.").optional().or(z.literal("")),
});

export const rentalSchema = z.object({
  name: z.string().trim().min(2, "Vnesite ime in priimek.").max(120),
  email: z.string().trim().email("Vnesite veljaven e-poštni naslov.").max(200),
  phone: phone.refine((value) => value.replace(/\D/g, "").length >= 6, "Vnesite telefonsko številko."),
  motorcycleId: z.string().trim().min(1, "Izberite motor."),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Izberite datum prevzema."),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/, "Izberite uro prevzema."),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Izberite datum vračila."),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/, "Izberite uro vračila."),
  licenseCategory: z.string().trim().min(1, "Izberite kategorijo vozniškega dovoljenja.").max(20),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  terms: z.literal("on", { errorMap: () => ({ message: "Za povpraševanje je potrebna seznanitev s pogoji." }) }),
  privacy: z.literal("on", { errorMap: () => ({ message: "Za pošiljanje je potrebna seznanitev s politiko zasebnosti." }) }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export const subscriberSchema = z.object({
  email: z.string().trim().email("Vnesite veljaven e-poštni naslov.").max(200),
  consent: z.literal("on", { errorMap: () => ({ message: "Za prijavo je potrebno soglasje." }) }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export function fieldErrors(error: z.ZodError) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export function readForm(formData: FormData) {
  const data: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !(key in data)) data[key] = value;
  }
  return data;
}
