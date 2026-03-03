import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { MILESTONES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { milestone } = body;

    // Validate milestone value
    if (!MILESTONES.includes(milestone)) {
      return NextResponse.json({ error: "Invalid milestone" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get employee data
    const { data: employee } = await admin
      .from("employees")
      .select("current_cycle_sparks")
      .eq("id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Check if milestone reached
    if (employee.current_cycle_sparks < milestone) {
      return NextResponse.json(
        { error: "Milestone not yet reached" },
        { status: 400 }
      );
    }

    // Check if already claimed
    const { data: existing } = await admin
      .from("milestone_claims")
      .select("id")
      .eq("employee_id", user.id)
      .eq("milestone", milestone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Milestone already claimed" },
        { status: 400 }
      );
    }

    // Insert claim
    const { error: insertError } = await admin
      .from("milestone_claims")
      .insert({
        employee_id: user.id,
        milestone,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // If 100-spark milestone, reset cycle
    if (milestone === 100) {
      await admin
        .from("employees")
        .update({
          current_cycle_sparks: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
