"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/dashboard";
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSignupDone(true);
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#E05C33] to-[#FF8C42]">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="text-[120px] leading-none mb-8 drop-shadow-lg">🌟</div>
          <h1 className="text-white text-3xl font-bold text-center leading-tight mb-3">
            Appreciation is good.
            <br />
            Structured appreciation
            <br />
            is <span className="underline decoration-white/40 underline-offset-4">culture</span>.
          </h1>
          <p className="text-white/70 text-center text-base max-w-sm mt-2">
            Recognize your teammates for the behaviors that matter most.
          </p>
          <div className="mt-12 flex gap-4">
            {[
              { emoji: "🤝", label: "Support" },
              { emoji: "⚡", label: "Proactivity" },
              { emoji: "🎨", label: "Artistry" },
            ].map((card) => (
              <div key={card.label} className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 text-white/90 text-sm font-medium flex items-center gap-2 border border-white/10">
                <span className="text-lg">{card.emoji}</span>
                {card.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <span className="text-3xl">🌟</span>
            <span className="text-xl font-bold text-[#E05C33]">YAAS Sparks</span>
          </div>

          {signupDone ? (
            <div className="space-y-4">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-2xl font-bold">Check your inbox</h2>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                We sent a confirmation email to <strong className="text-foreground">{email}</strong>. Click the link to activate your account, then sign in.
              </p>
              <button onClick={() => { setSignupDone(false); setMode("signin"); }} className="text-sm text-[#E05C33] font-medium hover:underline underline-offset-2 mt-2 inline-block">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {mode === "signin" ? "Sign in to YAAS Sparks" : "Create your account"}
                </h2>
                <p className="text-muted-foreground text-[15px]">
                  {mode === "signin" ? "Welcome back 👋" : "Join your team on YAAS Sparks"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[13px] font-medium">Full name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 rounded-lg text-[15px]"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-medium">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@yaas.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-11 rounded-lg text-[15px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
                    {mode === "signin" && (
                      <span className="text-xs text-muted-foreground">Min 6 characters</span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 rounded-lg text-[15px] pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full h-11 text-[15px] font-semibold bg-[#E05C33] hover:bg-[#C44D28] rounded-lg"
                >
                  {loading ? "Please wait..." : (
                    <>
                      {mode === "signin" ? "Sign in" : "Create account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-sm text-center text-muted-foreground mt-6">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                  className="text-[#E05C33] font-medium hover:underline underline-offset-2"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
