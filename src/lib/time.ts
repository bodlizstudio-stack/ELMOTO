export const LJUBLJANA = "Europe/Ljubljana";

export function timeZoneOffsetMs(date: Date, timeZone = LJUBLJANA) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) map[part.type] = part.value;
  const hour = map.hour === "24" ? "0" : map.hour;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - date.getTime();
}

export function parseInTimeZone(date: string, time: string, timeZone = LJUBLJANA) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Neveljaven datum ali ura.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new Error("Neveljaven datum ali ura.");
  }
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = wall;
  for (let i = 0; i < 3; i += 1) {
    instant = wall - timeZoneOffsetMs(new Date(instant), timeZone);
  }
  const result = new Date(instant);
  if (Number.isNaN(result.getTime())) throw new Error("Neveljaven datum ali ura.");
  return result;
}

export function formatLjubljana(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", {
    timeZone: LJUBLJANA,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function monthDayKey(date: Date, timeZone = LJUBLJANA) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return Number(`${month}${day}`);
}

export function weekdayIndex(date: Date, timeZone = LJUBLJANA) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}
