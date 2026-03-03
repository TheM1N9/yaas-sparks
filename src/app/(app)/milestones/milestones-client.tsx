"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Lock, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MILESTONES, MILESTONE_REWARDS } from "@/lib/constants";
import type { MilestoneClaim } from "@/types/database";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

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
    <motion.div
      className="space-y-8 max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-display font-bold tracking-tight">Milestones</h1>
        <p className="text-muted-foreground text-[15px] mt-0.5">
          Earn Sparks and unlock rewards in your current cycle
        </p>
      </motion.div>

      {/* Visual progress bar with glow */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 warm-card rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="pt-6 pb-6 px-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Cycle Progress</span>
              <span className="text-lg font-display font-bold text-primary tabular-nums">
                {currentCycleSparks} <span className="text-muted-foreground font-normal text-sm">/ 100</span>
              </span>
            </div>
            <div className="relative">
              {/* Track */}
              <div className="h-4 bg-accent rounded-full overflow-hidden">
                {/* Fill */}
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-[#E8724A] to-amber-500 progress-glow"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              {/* Glow dot at current position */}
              {progressPercent > 0 && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary border-3 border-white shadow-[0_0_12px_rgba(224,92,51,0.5)]"
                  initial={{ left: 0 }}
                  animate={{ left: `calc(${progressPercent}% - 10px)` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              )}
              {/* Milestone markers */}
              {MILESTONES.map((m) => (
                <div
                  key={m}
                  className="absolute top-1/2"
                  style={{ left: `${(m / 100) * 100}%`, transform: `translateX(-50%) translateY(-50%)` }}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-3 transition-all",
                      currentCycleSparks >= m
                        ? "bg-primary border-white shadow-[0_0_8px_rgba(224,92,51,0.4)]"
                        : "bg-white border-border/60"
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="relative mt-4 h-4">
              {/* 0 label — pinned left */}
              <span className="absolute left-0 text-[11px] text-muted-foreground tabular-nums font-medium" style={{ transform: 'translateX(0%)' }}>0</span>
              {/* Milestone labels — pinned to exact same % positions as dots */}
              {MILESTONES.map((m) => (
                <span
                  key={m}
                  className={cn(
                    "absolute text-[11px] tabular-nums font-medium",
                    currentCycleSparks >= m ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                  style={{ left: `${m}%`, transform: 'translateX(-50%)' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <motion.div
          className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Milestone cards — dramatic states */}
      <div className="space-y-4">
        {MILESTONES.map((milestone, i) => {
          const reward = MILESTONE_REWARDS[milestone];
          const reached = currentCycleSparks >= milestone;
          const claimed = claimedMilestones.has(milestone);
          const canClaim = reached && !claimed;
          const progressToThis = Math.min((currentCycleSparks / milestone) * 100, 100);

          return (
            <motion.div
              key={milestone}
              variants={itemVariants}
              whileHover={canClaim ? { scale: 1.01, y: -2 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Card
                className={cn(
                  "border-0 rounded-2xl transition-all overflow-hidden relative",
                  canClaim
                    ? "milestone-unlocked shadow-lg milestone-glow"
                    : claimed
                    ? "milestone-claimed shadow-sm"
                    : "warm-card shadow-sm milestone-locked"
                )}
              >
                <CardContent className="p-0">
                  {/* Top progress strip */}
                  {!claimed && (
                    <div className="h-1 w-full bg-accent">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToThis}%` }}
                        transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-5 sm:p-6">
                    {/* Icon */}
                    <motion.div
                      className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 relative",
                        claimed
                          ? "bg-emerald-100"
                          : canClaim
                          ? "bg-gradient-to-br from-primary/20 to-amber-500/20"
                          : "bg-accent"
                      )}
                      animate={canClaim ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className={cn("text-4xl", !reached && !claimed && "grayscale opacity-50")}>{reward.emoji}</span>
                      {/* Lock overlay for unreached */}
                      {!reached && !claimed && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-accent/60">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      {/* Checkmark for claimed */}
                      {claimed && (
                        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-display font-bold text-base",
                        !reached && !claimed && "text-muted-foreground"
                      )}>
                        {milestone} Sparks
                      </h3>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {reward.label}
                        {milestone === 100 && " — resets cycle"}
                      </p>
                      {/* Mini progress for unreached */}
                      {!reached && !claimed && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-muted-foreground/30 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressToThis}%` }}
                              transition={{ duration: 1, delay: i * 0.15 }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                            {currentCycleSparks}/{milestone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    {claimed ? (
                      <span className="text-[13px] font-bold text-emerald-600 bg-emerald-100 px-4 py-2 rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Claimed
                      </span>
                    ) : canClaim ? (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => handleClaim(milestone)}
                          disabled={loading === milestone}
                          className="bg-gradient-to-r from-primary to-amber-500 hover:from-[#C44D28] hover:to-amber-600 rounded-xl font-display font-bold shadow-[0_4px_14px_rgba(224,92,51,0.3)] px-5"
                        >
                          {loading === milestone ? (
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 animate-spin" />
                              Claiming...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Claim Reward
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    ) : (
                      <span className="text-[13px] text-muted-foreground bg-accent px-4 py-2 rounded-xl tabular-nums font-medium flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        {currentCycleSparks}/{milestone}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Claims history */}
      {claims.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-base font-display font-bold mb-3">Claim History</h2>
          <Card className="border-0 warm-card rounded-2xl shadow-sm">
            <CardContent className="p-2">
              {claims.map((claim) => {
                const reward = MILESTONE_REWARDS[claim.milestone];
                return (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <span className="text-xl">{reward?.emoji}</span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold">
                          {claim.milestone} Sparks
                        </span>
                        <p className="text-[12px] text-muted-foreground">{reward?.label}</p>
                      </div>
                    </div>
                    <span className="text-[12px] text-muted-foreground font-medium">
                      {format(new Date(claim.claimed_at), "MMM d, yyyy")}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
