import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardClient } from "./leaderboard-client";

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

  // Get category breakdown per employee via sparks
  const { data: sparks } = await supabase
    .from("sparks")
    .select("receiver_id, category");

  // Build category counts per employee
  const categoryBreakdown: Record<string, Record<string, number>> = {};
  sparks?.forEach((s) => {
    if (!categoryBreakdown[s.receiver_id]) categoryBreakdown[s.receiver_id] = {};
    categoryBreakdown[s.receiver_id][s.category] =
      (categoryBreakdown[s.receiver_id][s.category] || 0) + 1;
  });

  return (
    <LeaderboardClient
      employees={employees ?? []}
      categoryBreakdown={categoryBreakdown}
      currentUserId={user.id}
    />
  );
}
