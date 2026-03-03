import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MilestonesClient } from "./milestones-client";

export default async function MilestonesPage() {
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

  const { data: claims } = await supabase
    .from("milestone_claims")
    .select("*")
    .eq("employee_id", user.id)
    .order("claimed_at", { ascending: false });

  return (
    <MilestonesClient
      currentCycleSparks={employee.current_cycle_sparks}
      claims={claims ?? []}
    />
  );
}
