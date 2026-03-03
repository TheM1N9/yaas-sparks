import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";

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
    .select("*, giver:employees!giver_id(name), receiver:employees!receiver_id(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminClient employees={employees ?? []} sparks={sparks ?? []} />;
}
