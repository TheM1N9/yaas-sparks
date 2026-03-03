"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MILESTONES, MILESTONE_REWARDS } from "@/lib/constants";
import type { MilestoneClaim } from "@/types/database";
import { cn } from "@/lib/utils";

export function MilestonesClient({
  currentCycleSparks,
  claims,
}: {
  currentCycleSparks: number;
  claims: MilestoneClaim[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claimedMilestones = new Set(claims.map((c) => c.milestone));
  const progressPercent = Math.min((currentCycleSparks / 100) * 100, 100);

  async function handleClaim(milestone: number) {
    setLoading(milestone);
    setError(null);
    try {
      const res = await fetch("/api/milestones/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to claim");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    }
    setLoading(null);
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Milestones</h1>
        <p className="text-muted-foreground text-[15px] mt-0.5">
          Earn Sparks and unlock rewards in your current cycle
        </p>
      </div>

      {/* Visual progress bar with glow */}
      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-muted-foreground">Cycle Progress</span>
            <span className="text-sm font-bold text-primary tabular-nums">
              {currentCycleSparks} / 100
            </span>
          </div>
          <div className="relative">
            {/* Track */}
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              {/* Fill */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#FF8C42] transition-all duration-700 ease-out progress-glow"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Glow dot at current position */}
            {progressPercent > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-[0_0_8px_rgba(224,92,51,0.5)] transition-all duration-700"
                style={{ left: `calc(${progressPercent}% - 8px)` }}
              />
            )}
            {/* Milestone markers */}
            {MILESTONES.map((m) => (
              <div
                key={m}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${(m / 100) * 100}%`, transform: `translateX(-50%) translateY(-50%)` }}
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 transition-colors",
                    currentCycleSparks >= m
                      ? "bg-primary border-white"
                      : "bg-white border-muted-foreground/30"
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-0.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">0</span>
            {MILESTONES.map((m) => (
              <span
                key={m}
                className={cn(
                  "text-[11px] tabular-nums",
                  currentCycleSparks >= m ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {m}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Milestone cards */}
      <div className="space-y-3">
        {MILESTONES.map((milestone) => {
          const reward = MILESTONE_REWARDS[milestone];
          const reached = currentCycleSparks >= milestone;
          const claimed = claimedMilestones.has(milestone);
          const canClaim = reached && !claimed;

          return (
            <Card
              key={milestone}
              className={cn(
                "border-0 transition-all overflow-hidden",
                canClaim
                  ? "shadow-[0_2px_12px_rgba(224,92,51,0.15)] milestone-glow"
                  : claimed
                  ? "shadow-[0_1px_3px_rgba(0,0,0,0.06)] opacity-80"
                  : "shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              )}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-5">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0",
                    claimed
                      ? "bg-emerald-50"
                      : canClaim
                      ? "bg-primary/10"
                      : "bg-muted"
                  )}>
                    <span className="text-3xl">{reward.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px]">
                      {milestone} Sparks
                    </h3>
                    <p className="text-[13px] text-muted-foreground">
                      {reward.label}
                      {milestone === 100 && " — resets cycle"}
                    </p>
                  </div>
                  {claimed ? (
                    <span className="text-[13px] font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                      Claimed ✓
                    </span>
                  ) : canClaim ? (
                    <Button
                      onClick={() => handleClaim(milestone)}
                      disabled={loading === milestone}
                      className="bg-primary hover:bg-[#C44D28] rounded-xl font-semibold"
                    >
                      {loading === milestone ? "Claiming..." : "Claim Reward"}
                    </Button>
                  ) : (
                    <span className="text-[13px] text-muted-foreground bg-muted px-3 py-1.5 rounded-full tabular-nums">
                      {currentCycleSparks}/{milestone}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Claims history */}
      {claims.length > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold mb-3">Claim History</h2>
          <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardContent className="p-2">
              {claims.map((claim) => {
                const reward = MILESTONE_REWARDS[claim.milestone];
                return (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between py-3 px-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{reward?.emoji}</span>
                      <span className="text-sm font-medium">
                        {claim.milestone} Sparks — {reward?.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-muted-foreground">
                      {format(new Date(claim.claimed_at), "MMM d, yyyy")}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
