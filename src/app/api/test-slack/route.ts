import { NextResponse } from "next/server";
import { sendSlackNotificationWithAPI } from "@/lib/slack";

async function testSlackIntegration() {
  try {
    const success = await sendSlackNotificationWithAPI(
      "Test User",
      "Another Test User", 
      "Support",
      "This is a test message to verify Slack integration is working!",
      "🤝",
      "#sparks-notifications"
    );

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "Test Slack notification sent successfully!" 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to send Slack notification. Check your bot token and channel." 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test Slack notification error:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Error testing Slack integration",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Support both GET and POST requests
export async function GET() {
  return testSlackIntegration();
}

export async function POST() {
  return testSlackIntegration();
}