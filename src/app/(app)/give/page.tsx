export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GiveSparkClient } from "./give-client";

export default async function GivePage() {
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

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, avatar_url, team")
    .neq("id", user.id)
    .order("name");

  return (
    <GiveSparkClient
      currentUserId={user.id}
      sparksRemaining={5 - employee.sparks_given_this_month}
      employees={employees ?? []}
    />
  );
}
