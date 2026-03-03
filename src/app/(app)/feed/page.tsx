import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedClient } from "./feed-client";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sparks } = await supabase
    .from("sparks")
    .select(
      "*, giver:employees!giver_id(id, name, avatar_url), receiver:employees!receiver_id(id, name, avatar_url)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return <FeedClient sparks={sparks ?? []} />;
}
