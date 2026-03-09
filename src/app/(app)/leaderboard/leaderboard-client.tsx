"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, parse } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SPARK_CATEGORIES, getCurrentMonthKey } from "@/lib/constants";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface LeaderboardEmployee {
  id: string;
  name: string;
  avatar_url: string | null;
  team: string;
  sparks_earned_total: number;
  current_cycle_sparks: number;
}

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

function formatMonthDisplay(monthKey: string): string {
  try {
    const date = parse(monthKey, "yyyy-MM", new Date());
    return format(date, "MMMM yyyy");
  } catch {
    return monthKey;
  }
}

export function LeaderboardClient({
  employees,
  categoryBreakdown,
  currentUserId,
  availableMonths,
  monthlySparkCounts,
  monthlyCategoryBreakdown,
}: {
  employees: LeaderboardEmployee[];
  categoryBreakdown: Record<string, Record<string, number>>;
  currentUserId: string;
  availableMonths: string[];
  monthlySparkCounts: Record<string, Record<string, number>>;
  monthlyCategoryBreakdown: Record<string, Record<string, Record<string, number>>>;
}) {
  const currentMonth = getCurrentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const pluralize = (count: number) => `${count} ${count === 1 ? 'spark' : 'sparks'}`;

  // Get current month index for navigation
  const currentMonthIndex = availableMonths.indexOf(selectedMonth);
  const canGoNewer = currentMonthIndex > 0;
  const canGoOlder = currentMonthIndex < availableMonths.length - 1;

  const goNewer = () => {
    if (canGoNewer) {
      setSelectedMonth(availableMonths[currentMonthIndex - 1]);
    }
  };

  const goOlder = () => {
    if (canGoOlder) {
      setSelectedMonth(availableMonths[currentMonthIndex + 1]);
    }
  };

  // Build sorted list based on selected month
  const sorted = useMemo(() => {
    const monthCounts = monthlySparkCounts[selectedMonth] || {};
    return [...employees]
      .map((emp) => ({
        ...emp,
        monthlyCount: monthCounts[emp.id] || 0,
      }))
      .filter((emp) => emp.monthlyCount > 0)
      .sort((a, b) => {
        const diff = b.monthlyCount - a.monthlyCount;
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      });
  }, [employees, monthlySparkCounts, selectedMonth]);

  // Get category breakdown for selected month
  const getMonthCategoryBreakdown = (employeeId: string) => {
    return monthlyCategoryBreakdown[selectedMonth]?.[employeeId] || {};
  };

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const medals = ["🥇", "🥈", "🥉"];

  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" variants={itemVariants}>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground text-[15px] mt-0.5">Monthly spark earners</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border border-border/60 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={goOlder}
            disabled={!canGoOlder}
            className="h-9 w-9 p-0 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 px-3 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-semibold">
              {formatMonthDisplay(selectedMonth)}
            </span>
            {isCurrentMonth && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                NOW
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goNewer}
            disabled={!canGoNewer}
            className="h-9 w-9 p-0 rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Top 3 podium — award ceremony style */}
      {top3.length > 0 && (
        <motion.div className="grid grid-cols-3 gap-3 sm:gap-5 items-end" variants={itemVariants}>
          {/* Reorder: 2nd, 1st, 3rd for visual podium effect */}
          {[1, 0, 2].map((idx) => {
            const emp = top3[idx];
            if (!emp) return <div key={idx} />;
            const count = emp.monthlyCount;
            const isFirst = idx === 0;
            const isSecond = idx === 1;

            return (
              <motion.div
                key={emp.id}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href={`/profile/${emp.id}`}
                  className={cn(
                    "flex flex-col items-center text-center p-4 sm:p-6 rounded-3xl transition-all relative overflow-hidden",
                    isFirst
                      ? "podium-gold crown-glow sm:pb-8"
                      : isSecond
                      ? "podium-silver sm:pb-6"
                      : "podium-bronze sm:pb-6"
                  )}
                >
                  {/* Crown decoration for #1 */}
                  {isFirst && (
                    <motion.div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl"
                      animate={{ y: [0, -4, 0], rotate: [0, -3, 3, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      👑
                    </motion.div>
                  )}

                  <span className={cn("mb-2 mt-2", isFirst ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}>{medals[idx]}</span>

                  <div className="relative">
                    <Avatar className={cn(
                      "mb-2 ring-4 shadow-lg",
                      isFirst ? "h-20 w-20 ring-amber-300" : "h-14 w-14 ring-border/40"
                    )}>
                      <AvatarImage src={emp.avatar_url ?? undefined} />
                      <AvatarFallback
                        className={cn("font-display font-bold text-white", isFirst ? "text-xl" : "text-sm")}
                        style={{ backgroundColor: getAvatarColor(emp.name) }}
                      >
                        {getInitials(emp.name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Animated glow ring for #1 */}
                    {isFirst && (
                      <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" style={{ animationDuration: '3s' }} />
                    )}
                  </div>

                  <p className="font-display font-bold text-sm truncate max-w-full mt-1">{emp.name}</p>
                  {emp.team && emp.team !== "General" && <p className="text-[11px] text-muted-foreground">{emp.team}</p>}

                  <motion.div
                    className={cn(
                      "mt-3 font-display font-bold text-base px-4 py-1.5 rounded-2xl",
                      isFirst
                        ? "bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                        : "bg-primary/10 text-primary"
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 400 }}
                  >
                    {pluralize(count)}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Your rank banner (if not in top 3) */}
      {(() => {
        const myRank = sorted.findIndex((e) => e.id === currentUserId);
        if (myRank >= 3) {
          return (
            <motion.div variants={itemVariants}>
              <div className="bg-primary/8 border border-primary/20 rounded-2xl px-5 py-3 text-sm font-medium">
                Your rank: <span className="font-display font-bold text-primary">#{myRank + 1}</span>
                <span className="text-muted-foreground ml-2">of {sorted.length}</span>
              </div>
            </motion.div>
          );
        }
        return null;
      })()}

      {/* Rest of the list */}
      {rest.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 warm-card rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-2">
              {rest.map((emp, i) => {
                const count = emp.monthlyCount;
                const rank = i + 4;
                const cats = getMonthCategoryBreakdown(emp.id);
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/profile/${emp.id}`}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3.5 hover:bg-accent/60 transition-all duration-200 group"
                    >
                      <span className="w-9 h-9 flex items-center justify-center text-sm font-display font-bold text-muted-foreground bg-accent rounded-xl tabular-nums">
                        {rank}
                      </span>
                      <Avatar className="h-10 w-10 ring-2 ring-border/30">
                        <AvatarImage src={emp.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs text-white font-semibold" style={{ backgroundColor: getAvatarColor(emp.name) }}>{getInitials(emp.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{emp.name}</p>
                        {emp.team && emp.team !== "General" && <p className="text-[11px] text-muted-foreground">{emp.team}</p>}
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5">
                        {SPARK_CATEGORIES.map((cat) => {
                          const c = cats[cat.name] || 0;
                          if (c === 0) return null;
                          return (
                            <span
                              key={cat.code}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold text-white"
                              style={{ backgroundColor: cat.color }}
                              title={`${cat.name}: ${c}`}
                            >
                              {c}
                            </span>
                          );
                        })}
                      </div>
                      <span className="bg-primary/10 text-primary font-display font-bold text-[13px] px-3.5 py-1.5 rounded-xl tabular-nums">
                        {count}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {sorted.length === 0 && (
        <motion.div
          className="text-center py-20 text-muted-foreground"
          variants={itemVariants}
        >
          <motion.span
            className="text-6xl block mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🏆
          </motion.span>
          <p className="text-lg font-display font-bold">No sparks for {formatMonthDisplay(selectedMonth)}</p>
          <p className="text-sm mt-1">
            {isCurrentMonth ? "Be the first to earn a Spark this month!" : "No one earned sparks during this month."}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
