"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Lock, CheckCircle2, Sparkles, Wallet, Gift } from "lucide-react";
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

  // Remove the claimed milestones check - allow multiple claims of same milestone
  
  // Determine which milestones to show
  // Show 25 and 50 always, show 100 only if user has >= 100 sparks
  const visibleMilestones = useMemo(() => {
    const milestones: number[] = [25, 50];
    if (currentCycleSparks >= 100) {
      milestones.push(100);
    }
    return milestones;
  }, [currentCycleSparks]);

  // Calculate the next milestone for progress display
  const nextMilestone = useMemo(() => {
    for (const m of MILESTONES) {
      if (currentCycleSparks < m) return m;
    }
    return 100;
  }, [currentCycleSparks]);

  const progressPercent = Math.min((currentCycleSparks / nextMilestone) * 100, 100);

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
          Earn Sparks and unlock rewards — claiming deducts from your wallet
        </p>
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

      {/* Milestone cards */}
      <div className="space-y-4">
        {visibleMilestones.map((milestone, i) => {
          const reward = MILESTONE_REWARDS[milestone];
          const reached = currentCycleSparks >= milestone;
          const canClaim = reached; // Can always claim if you have enough sparks

          return (
            <motion.div
              key={milestone}
              variants={itemVariants}
              whileHover={canClaim ? { scale: 1.01, y: -2 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Card
                className={cn(
                  "rounded-2xl transition-all overflow-hidden relative",
                  canClaim
                    ? "border-2 border-primary shadow-lg bg-gradient-to-br from-white to-orange-50"
                    : "warm-card shadow-sm milestone-locked border-0"
                )}
              >
                <CardContent className="p-0">
                  {/* Top progress strip for unreached */}
                  {!reached && (
                    <div className="h-1 w-full bg-accent">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((currentCycleSparks / milestone) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-5 sm:p-6">
                    {/* Icon */}
                    <motion.div
                      className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 relative",
                        canClaim
                          ? "bg-gradient-to-br from-primary/20 to-amber-500/20"
                          : "bg-accent"
                      )}
                    >
                      <span className={cn("text-4xl", !reached && "grayscale opacity-50")}>{reward.emoji}</span>
                      {/* Lock overlay for unreached */}
                      {!reached && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-accent/60">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-display font-bold text-base",
                        !reached && "text-muted-foreground"
                      )}>
                        {milestone} Sparks
                      </h3>
                      <p className={cn(
                        "text-[14px] font-semibold mt-0.5",
                        canClaim ? "text-primary" : "text-muted-foreground"
                      )}>
                        {reward.amountLabel}
                      </p>
                      {/* Info about deduction */}
                      {canClaim && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Claiming will deduct {milestone} sparks from your wallet
                        </p>
                      )}
                      {/* Mini progress for unreached */}
                      {!reached && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-muted-foreground/30 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((currentCycleSparks / milestone) * 100, 100)}%` }}
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
                    {canClaim ? (
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
                              Claim
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

        {/* Teaser for 100 sparks if not yet visible */}
        {currentCycleSparks < 100 && (
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl transition-all overflow-hidden relative warm-card shadow-sm milestone-locked border-0">
              <CardContent className="p-0">
                {/* Top progress strip */}
                <div className="h-1 w-full bg-accent">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((currentCycleSparks / 100) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  />
                </div>

                <div className="flex items-center gap-4 p-5 sm:p-6">
                  {/* Icon */}
                  <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center shrink-0 relative">
                    <span className="text-4xl grayscale opacity-50">🏆</span>
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-accent/60">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base text-muted-foreground">
                      100 Sparks
                    </h3>
                    <p className="text-[14px] font-semibold mt-0.5 text-muted-foreground">
                      ₹XX,XXX cash reward
                    </p>
                    {/* Mini progress */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-muted-foreground/30 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((currentCycleSparks / 100) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                        {currentCycleSparks}/100
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <span className="text-[13px] text-muted-foreground bg-accent px-4 py-2 rounded-xl tabular-nums font-medium flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    {currentCycleSparks}/100
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
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
                          {claim.milestone} Sparks — {reward?.amountLabel}
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
