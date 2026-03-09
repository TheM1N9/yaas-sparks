export const SPARKS_PER_MONTH = 5;

export const SPARK_CATEGORIES = [
  { code: "S", name: "Support", description: "Helped someone through a challenge", emoji: "🤝", color: "#3B82F6" },
  { code: "P", name: "Proactivity", description: "Acted without being asked", emoji: "⚡", color: "#F59E0B" },
  { code: "A", name: "Artistry", description: "Delivered high-quality creative work", emoji: "🎨", color: "#8B5CF6" },
  { code: "R", name: "Reliability", description: "Consistently delivers, never drops the ball", emoji: "🎯", color: "#10B981" },
  { code: "K", name: "Knowledge Sharing", description: "Taught, documented, or upskilled others", emoji: "📚", color: "#06B6D4" },
  { code: "S2", name: "Spirit", description: "Brought energy, positivity, or morale", emoji: "🔥", color: "#EF4444" },
] as const;

export const MILESTONES = [25, 50, 100] as const;

export const MILESTONE_REWARDS: Record<number, { emoji: string; label: string; amount: number; amountLabel: string }> = {
  25: { emoji: "🎁", label: "Gift Card", amount: 5000, amountLabel: "₹5,000 Gift Card" },
  50: { emoji: "⭐", label: "Gift Card", amount: 15000, amountLabel: "₹15,000 Gift Card" },
  100: { emoji: "🏆", label: "Cash Reward", amount: 50000, amountLabel: "₹50,000 Cash" },
};

// Visible milestones (100 is hidden until reached)
export const VISIBLE_MILESTONES = [25, 50] as const;

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getCategoryByName(name: string) {
  return SPARK_CATEGORIES.find((c) => c.name === name);
}
