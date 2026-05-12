import { differenceInCalendarDays, eachDayOfInterval, format, isAfter, isBefore, isWithinInterval, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import type { Person, PersoneelHousing } from "@/types/personeel";

/** Format a date period in friendly Dutch: "10 t/m 16 juni · 7 dagen" */
export function formatPeriod(startISO: string, endISO: string): string {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const days = differenceInCalendarDays(end, start) + 1;
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = sameMonth
    ? format(start, "d", { locale: nl })
    : sameYear
      ? format(start, "d MMM", { locale: nl })
      : format(start, "d MMM yyyy", { locale: nl });
  const endStr = format(end, "d MMM yyyy", { locale: nl });
  return `${startStr} t/m ${endStr} · ${days} ${days === 1 ? "dag" : "dagen"}`;
}

/** Returns "light" if a hex color is dark (text should be light) and vice versa. WCAG luminance. */
export function getContrastColor(hex: string): "light" | "dark" {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map(c => c + c).join("")
    : cleaned;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.5 ? "dark" : "light";
}

export function getTextColorForBg(hex: string): string {
  return getContrastColor(hex) === "light" ? "#FFFFFF" : "#0F172A";
}

/**
 * Deterministische unieke kleur per persoon op basis van id-hash.
 * Vaste S/L zodat tekstcontrast altijd voorspelbaar is (witte tekst).
 */
export function getPersonColor(personId: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < personId.length; i++) {
    hash = (hash * 31 + personId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  // L 48% + S 62% → middel-donker, witte tekst altijd leesbaar
  return { bg: `hsl(${hue}, 62%, 48%)`, fg: "#FFFFFF" };
}

/** Returns a Map<dateISO, count> of how many people are active per day in [from, to]. */
export function getDensityPerDay(people: Person[], from: Date, to: Date): Map<string, number> {
  const map = new Map<string, number>();
  const days = eachDayOfInterval({ start: from, end: to });
  for (const day of days) {
    map.set(format(day, "yyyy-MM-dd"), 0);
  }
  for (const p of people) {
    const start = parseISO(p.start_date);
    const end = parseISO(p.end_date);
    for (const day of days) {
      if (isWithinInterval(day, { start, end })) {
        const key = format(day, "yyyy-MM-dd");
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
  }
  return map;
}

/** Compute overbooked days for a housing in a given window. */
export function getOverbookedDays(
  housing: PersoneelHousing,
  people: Person[],
  windowStart: Date,
  windowEnd: Date,
): Date[] {
  if (housing.capacity == null) return [];
  const days = eachDayOfInterval({ start: windowStart, end: windowEnd });
  return days.filter(day => {
    const occupants = people.filter(p =>
      p.housing_id === housing.id &&
      isWithinInterval(day, { start: parseISO(p.start_date), end: parseISO(p.end_date) })
    );
    return occupants.length > (housing.capacity ?? Infinity);
  });
}

/** Person currently active on `day`. */
export function isActiveOn(person: Person, day: Date): boolean {
  const s = parseISO(person.start_date);
  const e = parseISO(person.end_date);
  return !isBefore(day, s) && !isAfter(day, e);
}

/** Categorize people into past / current / future relative to today. */
export function categorizeByDate(people: Person[], today: Date = new Date()) {
  const current: Person[] = [];
  const future: Person[] = [];
  const past: Person[] = [];
  for (const p of people) {
    const s = parseISO(p.start_date);
    const e = parseISO(p.end_date);
    if (isBefore(e, today) && !isWithinInterval(today, { start: s, end: e })) {
      past.push(p);
    } else if (isAfter(s, today)) {
      future.push(p);
    } else {
      current.push(p);
    }
  }
  return { current, future, past };
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy", { locale: nl });
}
