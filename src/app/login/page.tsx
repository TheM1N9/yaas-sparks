"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — rich, warm, celebratory */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917]">
        {/* Warm glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-amber-500/10" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          {/* Logo mark */}
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-[0_0_60px_rgba(224,92,51,0.3)] mb-10">
            <Sparkles className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-white text-4xl font-display font-bold text-center leading-tight mb-4">
            Appreciation is good.
            <br />
            Structured appreciation
            <br />
            is <span className="text-gradient">culture</span>.
          </h1>
          <p className="text-white/50 text-center text-base max-w-sm mt-2 leading-relaxed">
            Recognize your teammates for the behaviors that matter most.
          </p>
          <div className="mt-14 flex gap-3">
            {[
              { emoji: "🤝", label: "Support", color: "#3B82F6" },
              { emoji: "⚡", label: "Proactivity", color: "#F59E0B" },
              { emoji: "🎨", label: "Artistry", color: "#8B5CF6" },
            ].map((card) => (
              <div
                key={card.label}
                className="backdrop-blur-sm rounded-2xl px-5 py-3 text-white/90 text-sm font-semibold flex items-center gap-2 border transition-all hover:-translate-y-1"
                style={{ backgroundColor: `${card.color}20`, borderColor: `${card.color}30` }}
              >
                <span className="text-lg">{card.emoji}</span>
                {card.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">YAAS Sparks</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-[15px]">Sign in with your YAAS Google account</p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-4 font-medium">{error}</p>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full h-13 text-[15px] font-semibold border-2 border-border/80 hover:bg-accent rounded-2xl transition-all hover:shadow-sm"
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading ? "Redirecting..." : "Continue with Google"}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Only @yaas.com accounts can sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
