import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function ratingToStars(x10: number) {
  return Math.round(x10) / 10;
}
