"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Send, Sparkles, TrendingUp, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SPARKS_PER_MONTH, getCategoryByName } from "@/lib/constants";
import type { Employee } from "@/types/database";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface DashboardProps {
  employee: Employee;
  sparksRemaining: number;
  monthEarned: number;
  nextMilestone: number;
  topEmployees: Pick<Employee, "id" | "name" | "avatar_url" | "team" | "sparks_earned_total">[];
  recentSparks: Array<{
    id: string;
    category: string;
    reason: string;
    created_at: string;
    giver: { name: string; avatar_url: string | null };
    receiver: { name: string; avatar_url: string | null };
  }>;
}

export function DashboardClient({
  employee,
  sparksRemaining,
  monthEarned,
  nextMilestone,
  topEmployees,
  recentSparks,
}: DashboardProps) {
  const givenProgress = ((SPARKS_PER_MONTH - sparksRemaining) / SPARKS_PER_MONTH) * 100;
  const milestoneProgress = (employee.current_cycle_sparks / nextMilestone) * 100;

  const statCards = [
    {
      label: "Sparks to Give",
      icon: Send,
      value: sparksRemaining,
      sub: `${SPARKS_PER_MONTH - sparksRemaining} of ${SPARKS_PER_MONTH} given`,
      progress: givenProgress,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      label: "Sparks Earned",
      icon: Sparkles,
      value: employee.sparks_earned_total,
      sub: "All time",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "This Month",
      icon: TrendingUp,
      value: monthEarned,
      sub: "Sparks received",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      label: "Milestone",
      icon: Target,
      value: `${employee.current_cycle_sparks}/${nextMilestone}`,
      sub: "Next reward",
      progress: milestoneProgress,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {employee.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-[15px] mt-0.5">Here&apos;s your Sparks overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-medium text-muted-foreground">{stat.label}</span>
                  <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                {stat.progress !== undefined && (
                  <Progress value={stat.progress} className="mt-2.5 h-1.5" />
                )}
                <p className="text-xs text-muted-foreground mt-1.5">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA Button */}
      <Link href="/give">
        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold bg-primary hover:bg-[#C44D28] shadow-[0_4px_14px_rgba(224,92,51,0.35)] hover:shadow-[0_6px_20px_rgba(224,92,51,0.45)] transition-all rounded-xl"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Give a Spark
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mini leaderboard */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-[15px] font-semibold">Top Sparkers</h2>
            <Link
              href="/leaderboard"
              className="text-[13px] text-primary font-medium hover:underline underline-offset-2"
            >
              View all
            </Link>
          </div>
          <CardContent className="px-5 pb-5 space-y-1">
            {topEmployees.map((emp, i) => (
              <Link
                key={emp.id}
                href={`/profile/${emp.id}`}
                className="flex items-center gap-3 hover:bg-muted/60 rounded-lg py-2 px-2 -mx-2 transition-colors"
              >
                <span className="w-6 text-center text-sm font-semibold shrink-0">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={emp.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[11px] bg-muted font-medium">
                    {getInitials(emp.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-[11px] text-muted-foreground">{emp.team}</p>
                </div>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {emp.sparks_earned_total}
                </span>
              </Link>
            ))}
            {topEmployees.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No sparks given yet. Be the first!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-[15px] font-semibold">Recent Activity</h2>
            <Link
              href="/feed"
              className="text-[13px] text-primary font-medium hover:underline underline-offset-2"
            >
              View all
            </Link>
          </div>
          <CardContent className="px-5 pb-5 space-y-3">
            {recentSparks.map((spark) => {
              const cat = getCategoryByName(spark.category);
              return (
                <div key={spark.id} className="flex items-start gap-3 py-1">
                  <div
                    className="w-1 self-stretch rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: cat?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{spark.giver.name}</span>
                      {" sparked "}
                      <span className="font-medium">{spark.receiver.name}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-2 py-0 h-5 font-medium"
                        style={{ backgroundColor: cat?.color + "15", color: cat?.color }}
                      >
                        {cat?.emoji} {spark.category}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(spark.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {recentSparks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No activity yet. Give the first Spark!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
