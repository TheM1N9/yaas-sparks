"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SPARK_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface LeaderboardEmployee {
  id: string;
  name: string;
  avatar_url: string | null;
  team: string;
  sparks_earned_total: number;
  current_cycle_sparks: number;
}

export function LeaderboardClient({
  employees,
  categoryBreakdown,
}: {
  employees: LeaderboardEmployee[];
  categoryBreakdown: Record<string, Record<string, number>>;
}) {
  const [view, setView] = useState<"all" | "month">("all");

  const sorted = [...employees].sort((a, b) =>
    view === "all"
      ? b.sparks_earned_total - a.sparks_earned_total
      : b.current_cycle_sparks - a.current_cycle_sparks
  );

  const getCount = (emp: LeaderboardEmployee) =>
    view === "all" ? emp.sparks_earned_total : emp.current_cycle_sparks;

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground text-[15px] mt-0.5">Top spark earners across the company</p>
        </div>

        {/* Pill toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setView("all")}
            className={cn(
              "px-4 py-1.5 text-[13px] font-medium rounded-md transition-all",
              view === "all"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Time
          </button>
          <button
            onClick={() => setView("month")}
            className={cn(
              "px-4 py-1.5 text-[13px] font-medium rounded-md transition-all",
              view === "month"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            This Cycle
          </button>
        </div>
      </div>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Reorder: 2nd, 1st, 3rd for visual podium effect */}
          {[1, 0, 2].map((idx) => {
            const emp = top3[idx];
            if (!emp) return <div key={idx} />;
            const count = getCount(emp);
            const isFirst = idx === 0;
            return (
              <Link
                key={emp.id}
                href={`/profile/${emp.id}`}
                className={cn(
                  "flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl transition-all hover:-translate-y-0.5",
                  isFirst
                    ? "bg-gradient-to-b from-amber-50 to-white border-2 border-amber-200/60 shadow-md sm:-mt-4 sm:pb-7"
                    : "bg-white border border-border/60 shadow-sm mt-2"
                )}
              >
                <span className="text-2xl sm:text-3xl mb-2">{medals[idx]}</span>
                <Avatar className={cn("mb-2", isFirst ? "h-16 w-16" : "h-12 w-12")}>
                  <AvatarImage src={emp.avatar_url ?? undefined} />
                  <AvatarFallback className={cn("font-medium bg-muted", isFirst ? "text-lg" : "text-sm")}>
                    {getInitials(emp.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm truncate max-w-full">{emp.name}</p>
                <p className="text-[11px] text-muted-foreground">{emp.team}</p>
                <div className="mt-2 bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-full">
                  {count} sparks
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Rest of the list */}
      {rest.length > 0 && (
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <CardContent className="p-2">
            {rest.map((emp, i) => {
              const count = getCount(emp);
              if (count === 0) return null;
              const rank = i + 4;
              const cats = categoryBreakdown[emp.id] || {};
              return (
                <Link
                  key={emp.id}
                  href={`/profile/${emp.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="w-8 text-center text-sm font-semibold text-muted-foreground tabular-nums">
                    {rank}
                  </span>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={emp.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-muted font-medium">{getInitials(emp.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{emp.team}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    {SPARK_CATEGORIES.map((cat) => {
                      const c = cats[cat.name] || 0;
                      if (c === 0) return null;
                      return (
                        <span
                          key={cat.code}
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                          title={`${cat.name}: ${c}`}
                        />
                      );
                    })}
                  </div>
                  <span className="bg-primary/10 text-primary font-bold text-[13px] px-3 py-1 rounded-full tabular-nums">
                    {count}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <span className="text-4xl block mb-3">🏆</span>
          <p>No one on the leaderboard yet!</p>
        </div>
      )}
    </div>
  );
}
