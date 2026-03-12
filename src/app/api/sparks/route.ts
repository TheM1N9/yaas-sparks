import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getCurrentMonthKey, SPARKS_PER_MONTH, getCategoryByName, SPARK_CATEGORIES } from "@/lib/constants";
import { sendSlackNotificationWithAPI } from "@/lib/slack";

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
    const { receiver_id, category, reason } = body;

    // Validate category
    const validCategories = SPARK_CATEGORIES.map((c) => c.name);
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Validate reason
    if (!reason || reason.length < 10 || reason.length > 280) {
      return NextResponse.json(
        { error: "Reason must be 10-280 characters" },
        { status: 400 }
      );
    }

    // Cannot self-award
    if (receiver_id === user.id) {
      return NextResponse.json(
        { error: "Cannot give a Spark to yourself" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const monthKey = getCurrentMonthKey();

    // Check giver has sparks remaining
    const { data: giver } = await admin
      .from("employees")
      .select("sparks_given_this_month")
      .eq("id", user.id)
      .single();

    if (!giver || giver.sparks_given_this_month >= SPARKS_PER_MONTH) {
      return NextResponse.json(
        { error: "No Sparks remaining this month" },
        { status: 400 }
      );
    }

    // Check no duplicate this month
    const { data: existing } = await admin
      .from("sparks")
      .select("id")
      .eq("giver_id", user.id)
      .eq("receiver_id", receiver_id)
      .eq("month_key", monthKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Already gave a Spark to this person this month" },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const { data: receiver } = await admin
      .from("employees")
      .select("id, name")
      .eq("id", receiver_id)
      .single();

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 400 });
    }

    // Insert spark
    const { error: insertError } = await admin.from("sparks").insert({
      giver_id: user.id,
      receiver_id,
      category,
      reason,
      month_key: monthKey,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update giver count
    await admin
      .from("employees")
      .update({
        sparks_given_this_month: giver.sparks_given_this_month + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Update receiver counts
    await admin.rpc("increment_receiver_sparks", { receiver_uuid: receiver_id });

    // If RPC doesn't exist, fallback to manual update
    const { data: receiverData } = await admin
      .from("employees")
      .select("sparks_earned_total, current_cycle_sparks")
      .eq("id", receiver_id)
      .single();

    if (receiverData) {
      await admin
        .from("employees")
        .update({
          sparks_earned_total: receiverData.sparks_earned_total + 1,
          current_cycle_sparks: receiverData.current_cycle_sparks + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", receiver_id);
    }

    // Get giver name for Slack
    const { data: giverData } = await admin
      .from("employees")
      .select("name")
      .eq("id", user.id)
      .single();

    // Send Slack notification via Bot API
    const cat = getCategoryByName(category);
    if (cat && giverData?.name) {
      try {
        await sendSlackNotificationWithAPI(
          giverData.name,
          receiver.name,
          category,
          reason,
          cat.emoji,
          '#sparks-notifications'
        );
      } catch (error) {
        // Slack notification failure shouldn't block the response
        console.error('Failed to send Slack notification:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin
    const admin = createAdminClient();
    const { data: employee } = await admin
      .from("employees")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!employee || employee.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sparkId = searchParams.get("id");

    if (!sparkId) {
      return NextResponse.json({ error: "Missing spark id" }, { status: 400 });
    }

    // Get spark details before deletion to adjust counts
    const { data: spark } = await admin
      .from("sparks")
      .select("giver_id, receiver_id")
      .eq("id", sparkId)
      .single();

    if (spark) {
      // Decrement receiver counts
      const { data: receiverData } = await admin
        .from("employees")
        .select("sparks_earned_total, current_cycle_sparks")
        .eq("id", spark.receiver_id)
        .single();

      if (receiverData) {
        await admin
          .from("employees")
          .update({
            sparks_earned_total: Math.max(0, receiverData.sparks_earned_total - 1),
            current_cycle_sparks: Math.max(0, receiverData.current_cycle_sparks - 1),
          })
          .eq("id", spark.receiver_id);
      }
    }

    await admin.from("sparks").delete().eq("id", sparkId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
