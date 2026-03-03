import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfileClient } from "../profile-client";

export default async function OtherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If viewing own profile, redirect to /profile
  if (id === user.id) redirect("/profile");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();
  if (!employee) notFound();

  const { data: received } = await supabase
    .from("sparks")
    .select("*, giver:employees!giver_id(name, avatar_url)")
    .eq("receiver_id", id)
    .order("created_at", { ascending: false });

  const { data: given } = await supabase
    .from("sparks")
    .select("*, receiver:employees!receiver_id(name, avatar_url)")
    .eq("giver_id", id)
    .order("created_at", { ascending: false });

  const { data: milestones } = await supabase
    .from("milestone_claims")
    .select("*")
    .eq("employee_id", id);

  return (
    <ProfileClient
      employee={employee}
      received={received ?? []}
      given={given ?? []}
      givenCount={given?.length ?? 0}
      milestonesClaimed={milestones?.length ?? 0}
    />
  );
}
