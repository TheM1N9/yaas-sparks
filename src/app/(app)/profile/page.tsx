import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
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

  const { data: received } = await supabase
    .from("sparks")
    .select("*, giver:employees!giver_id(name, avatar_url)")
    .eq("receiver_id", user.id)
    .order("created_at", { ascending: false });

  const { data: given } = await supabase
    .from("sparks")
    .select("*, receiver:employees!receiver_id(name, avatar_url)")
    .eq("giver_id", user.id)
    .order("created_at", { ascending: false });

  const { data: milestones } = await supabase
    .from("milestone_claims")
    .select("*")
    .eq("employee_id", user.id);

  return (
    <ProfileClient
      employee={employee}
      received={received ?? []}
      given={given ?? []}
      milestonesClaimed={milestones?.length ?? 0}
      isOwnProfile
    />
  );
}
