import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SPARKS_PER_MONTH, getCurrentMonthKey } from "@/lib/constants";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!employee) redirect("/login");

  const monthKey = getCurrentMonthKey();

  const { count: monthEarned } = await supabase
    .from("sparks")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("month_key", monthKey);

  // Top 5 leaderboard this month
  const { data: topEmployees } = await supabase
    .from("employees")
    .select("id, name, avatar_url, team, sparks_earned_total")
    .order("sparks_earned_total", { ascending: false })
    .limit(5);

  // Recent sparks
  const { data: recentSparks } = await supabase
    .from("sparks")
    .select("*, giver:employees!giver_id(name, avatar_url), receiver:employees!receiver_id(name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(5);

  const sparksRemaining = SPARKS_PER_MONTH - employee.sparks_given_this_month;

  // Calculate next milestone
  const cycle = employee.current_cycle_sparks;
  let nextMilestone = 25;
  if (cycle >= 50) nextMilestone = 100;
  else if (cycle >= 25) nextMilestone = 50;

  return (
    <DashboardClient
      employee={employee}
      sparksRemaining={sparksRemaining}
      monthEarned={monthEarned ?? 0}
      nextMilestone={nextMilestone}
      topEmployees={topEmployees ?? []}
      recentSparks={recentSparks ?? []}
    />
  );
}
