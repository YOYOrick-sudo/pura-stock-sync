import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocationDisplayName(location: string): string {
  if (location === 'West') return 'Dailt';
  if (location === 'Midsland') return 'Foodbar';
  return location;
}
