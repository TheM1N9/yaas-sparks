import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#8B5CF6", // purple
  "#E05C33", // orange
  "#EF4444", // red
  "#0D9488", // teal
  "#F59E0B", // amber
  "#6366F1", // indigo
  "#EC4899", // pink
  "#06B6D4", // cyan
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
