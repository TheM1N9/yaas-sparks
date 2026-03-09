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
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("current_cycle_sparks")
      .eq("id", user.id)
      .single();

    if (employeeError) {
      console.error("Employee fetch error:", employeeError);
      return NextResponse.json({ error: `Employee fetch failed: ${employeeError.message}` }, { status: 500 });
    }

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Check if user has enough sparks to claim this milestone
    if (employee.current_cycle_sparks < milestone) {
      return NextResponse.json(
        { error: `You need at least ${milestone} sparks to claim this reward. You have ${employee.current_cycle_sparks}.` },
        { status: 400 }
      );
    }

    // Insert claim record
    const { error: insertError } = await admin
      .from("milestone_claims")
      .insert({
        employee_id: user.id,
        milestone,
      });

    if (insertError) {
      console.error("Milestone claim insert error:", insertError);
      return NextResponse.json({ error: `Claim failed: ${insertError.message}` }, { status: 500 });
    }

    // Deduct the milestone amount from current_cycle_sparks (wallet)
    const newBalance = employee.current_cycle_sparks - milestone;
    
    const { error: updateError } = await admin
      .from("employees")
      .update({
        current_cycle_sparks: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Employee update error:", updateError);
      return NextResponse.json({ error: `Balance update failed: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      newBalance,
      message: `Successfully claimed ${milestone} sparks reward! Your new balance is ${newBalance} sparks.`
    });
  } catch (error) {
    console.error("Milestone claim error:", error);
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}
