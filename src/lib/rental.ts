import { monthDayKey, weekdayIndex } from "@/lib/time";

export type RateInput = {
  dailyCents: number | null;
  weekendCents: number | null;
  multidayCents: number | null;
  seasonStart: string;
  seasonEnd: string;
  confirmed: boolean;
};

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function rentalDays(pickup: Date, ret: Date) {
  const ms = ret.getTime() - pickup.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

function inSeason(date: Date, start: string, end: string) {
  const key = monthDayKey(date);
  const from = Number(start.replace("-", ""));
  const to = Number(end.replace("-", ""));
  if (!from || !to) return false;
  if (from <= to) return key >= from && key <= to;
  return key >= from || key <= to;
}

export function selectRate(rates: RateInput[], pickup: Date) {
  const confirmed = rates.filter((rate) => rate.confirmed);
  const seasonal = confirmed.find(
    (rate) => rate.seasonStart && rate.seasonEnd && inSeason(pickup, rate.seasonStart, rate.seasonEnd),
  );
  if (seasonal) return seasonal;
  return confirmed.find((rate) => !rate.seasonStart && !rate.seasonEnd) ?? null;
}

export function quoteCents(pickup: Date, days: number, rate: RateInput | null) {
  if (!rate || !rate.confirmed || days <= 0) return null;
  if (days >= 3 && rate.multidayCents && rate.multidayCents > 0) {
    return rate.multidayCents * days;
  }
  let total = 0;
  for (let i = 0; i < days; i += 1) {
    const day = new Date(pickup.getTime() + i * 86_400_000);
    const weekend = weekdayIndex(day) === 0 || weekdayIndex(day) === 6;
    const cents = weekend && rate.weekendCents && rate.weekendCents > 0 ? rate.weekendCents : rate.dailyCents;
    if (!cents || cents <= 0) return null;
    total += cents;
  }
  return total;
}

export function lowestDailyCents(rates: RateInput[]) {
  const values = rates
    .filter((rate) => rate.confirmed && rate.dailyCents && rate.dailyCents > 0)
    .map((rate) => rate.dailyCents as number);
  if (!values.length) return null;
  return Math.min(...values);
}
