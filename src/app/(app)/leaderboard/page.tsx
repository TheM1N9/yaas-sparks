import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardClient } from "./leaderboard-client";
import { getCurrentMonthKey } from "@/lib/constants";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, avatar_url, team, sparks_earned_total, current_cycle_sparks")
    .order("sparks_earned_total", { ascending: false });

  // Get all sparks with month_key for building monthly leaderboards
  const { data: sparks } = await supabase
    .from("sparks")
    .select("receiver_id, category, month_key")
    .order("created_at", { ascending: false });

  // Build category counts per employee (all time)
  const categoryBreakdown: Record<string, Record<string, number>> = {};
  sparks?.forEach((s) => {
    if (!categoryBreakdown[s.receiver_id]) categoryBreakdown[s.receiver_id] = {};
    categoryBreakdown[s.receiver_id][s.category] =
      (categoryBreakdown[s.receiver_id][s.category] || 0) + 1;
  });

  // Get unique months from sparks for navigation
  const monthsSet = new Set<string>();
  sparks?.forEach((s) => monthsSet.add(s.month_key));
  // Add current month even if no sparks yet
  monthsSet.add(getCurrentMonthKey());
  const availableMonths = Array.from(monthsSet).sort().reverse();

  // Build monthly spark counts per employee
  const monthlySparkCounts: Record<string, Record<string, number>> = {};
  sparks?.forEach((s) => {
    if (!monthlySparkCounts[s.month_key]) monthlySparkCounts[s.month_key] = {};
    monthlySparkCounts[s.month_key][s.receiver_id] =
      (monthlySparkCounts[s.month_key][s.receiver_id] || 0) + 1;
  });

  // Build monthly category breakdown
  const monthlyCategoryBreakdown: Record<string, Record<string, Record<string, number>>> = {};
  sparks?.forEach((s) => {
    if (!monthlyCategoryBreakdown[s.month_key]) monthlyCategoryBreakdown[s.month_key] = {};
    if (!monthlyCategoryBreakdown[s.month_key][s.receiver_id]) {
      monthlyCategoryBreakdown[s.month_key][s.receiver_id] = {};
    }
    monthlyCategoryBreakdown[s.month_key][s.receiver_id][s.category] =
      (monthlyCategoryBreakdown[s.month_key][s.receiver_id][s.category] || 0) + 1;
  });

  return (
    <LeaderboardClient
      employees={employees ?? []}
      categoryBreakdown={categoryBreakdown}
      currentUserId={user.id}
      availableMonths={availableMonths}
      monthlySparkCounts={monthlySparkCounts}
      monthlyCategoryBreakdown={monthlyCategoryBreakdown}
    />
  );
}
