import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if email is from YAAS domain
      const email = data.user.email;
      const allowedDomains = ['yaas.studio', 'yaas.media'];
      
      if (email && allowedDomains.some(domain => email.endsWith(`@${domain}`))) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        // Sign out the user and redirect with error
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=unauthorized_domain`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
