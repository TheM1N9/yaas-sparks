import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import type { Employee } from "@/types/database";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let employee: Employee | null = null;
  if (user) {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("id", user.id)
      .single();
    employee = data;
  }

  return <AppShell employee={employee}>{children}</AppShell>;
}
