import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";
import { getCurrentMonthKey } from "@/lib/constants";

export default async function AdminPage() {
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

  if (!employee || employee.role !== "admin") redirect("/dashboard");

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .order("name");

  const { data: sparks } = await supabase
    .from("sparks")
    .select("*, giver:employees!giver_id(name, email), receiver:employees!receiver_id(name, email)")
    .order("created_at", { ascending: false });

  // Get all milestone claims
  const { data: milestoneClaims } = await supabase
    .from("milestone_claims")
    .select("*, employee:employees!employee_id(name, email)")
    .order("claimed_at", { ascending: false });

  // Get unique months from sparks for navigation
  const monthsSet = new Set<string>();
  sparks?.forEach((s) => monthsSet.add(s.month_key));
  // Add current month even if no sparks yet
  monthsSet.add(getCurrentMonthKey());
  const availableMonths = Array.from(monthsSet).sort().reverse();

  // Build monthly spark counts per employee (received)
  const monthlyReceivedCounts: Record<string, Record<string, number>> = {};
  sparks?.forEach((s) => {
    if (!monthlyReceivedCounts[s.month_key]) monthlyReceivedCounts[s.month_key] = {};
    monthlyReceivedCounts[s.month_key][s.receiver_id] =
      (monthlyReceivedCounts[s.month_key][s.receiver_id] || 0) + 1;
  });

  return (
    <AdminClient
      employees={employees ?? []}
      sparks={sparks ?? []}
      milestoneClaims={milestoneClaims ?? []}
      availableMonths={availableMonths}
      monthlyReceivedCounts={monthlyReceivedCounts}
    />
  );
}
