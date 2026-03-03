"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Send, Sparkles, TrendingUp, Target, ArrowRight, Flame } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SPARKS_PER_MONTH, getCategoryByName } from "@/lib/constants";
import { getInitials, getAvatarColor } from "@/lib/utils";
import type { Employee } from "@/types/database";

function getGreeting() {
  // Uses client local time — accurate per user's timezone
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

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
      iconColor: "text-primary",
      accentColor: "text-foreground",
    },
    {
      label: "Sparks Earned",
      icon: Sparkles,
      value: employee.sparks_earned_total,
      sub: "All time",
      iconColor: "text-emerald-600",
      accentColor: "text-foreground",
    },
    {
      label: "This Month",
      icon: TrendingUp,
      value: monthEarned,
      sub: "Sparks received",
      iconColor: "text-blue-600",
      accentColor: "text-foreground",
    },
    {
      label: "Milestone",
      icon: Target,
      value: `${employee.current_cycle_sparks}/${nextMilestone}`,
      sub: "Next reward",
      progress: milestoneProgress,
      iconColor: "text-purple-600",
      accentColor: "text-foreground",
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">
          {getGreeting()}
        </p>
        <h1 className="text-3xl font-display font-bold tracking-tight">
          {employee.name.split(" ")[0]}, let&apos;s spark some joy
          <span className="inline-block ml-2 animate-sparkle">&#10024;</span>
        </h1>
      </motion.div>

      {/* Stat cards */}
      <motion.div className="grid gap-4 grid-cols-2 lg:grid-cols-4 items-stretch" variants={itemVariants}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="h-full"
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Card className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full">
                <CardContent className="pt-5 pb-4 px-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                    <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className={`text-3xl font-display font-bold tracking-tight ${stat.accentColor}`}>
                    {stat.value}
                  </div>
                  {stat.progress !== undefined && (
                    <Progress value={stat.progress} className="mt-3 h-2 rounded-full" />
                  )}
                  <p className="text-[12px] text-muted-foreground mt-2 font-medium">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA Button */}
      <motion.div variants={itemVariants}>
        <Link href="/give">
          <Button
            size="lg"
            className="h-11 px-6 text-sm font-display font-bold bg-[#E05C33] hover:bg-[#C44D28] text-white rounded-xl transition-colors shadow-sm"
          >
            <Flame className="mr-2 h-4 w-4" />
            Give a Spark
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mini leaderboard */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 warm-card rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-display font-bold">Top Sparkers</h2>
              <Link
                href="/leaderboard"
                className="text-[13px] text-primary font-semibold hover:underline underline-offset-2 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <CardContent className="px-5 pb-5 space-y-0.5">
              {topEmployees.map((emp, i) => (
                <Link
                  key={emp.id}
                  href={`/profile/${emp.id}`}
                  className="flex items-center gap-3 hover:bg-accent/60 rounded-xl py-2.5 px-2.5 -mx-2.5 transition-all duration-200 group"
                >
                  <span className="w-7 text-center text-base shrink-0">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>}
                  </span>
                  <Avatar className="h-9 w-9 ring-2 ring-border/40">
                    <AvatarImage src={emp.avatar_url ?? undefined} />
                    <AvatarFallback
                      className="text-[11px] text-white font-semibold"
                      style={{ backgroundColor: getAvatarColor(emp.name) }}
                    >
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{emp.name}</p>
                    {emp.team && emp.team !== "General" && <p className="text-[11px] text-muted-foreground">{emp.team}</p>}
                  </div>
                  <span className="text-sm font-display font-bold text-primary tabular-nums bg-primary/10 px-2.5 py-1 rounded-lg">
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
        </motion.div>

        {/* Recent activity */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 warm-card rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-display font-bold">Recent Activity</h2>
              <Link
                href="/feed"
                className="text-[13px] text-primary font-semibold hover:underline underline-offset-2 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <CardContent className="px-5 pb-5 space-y-3">
              {recentSparks.map((spark) => {
                const cat = getCategoryByName(spark.category);
                return (
                  <div key={spark.id} className="flex items-start gap-3 py-1.5 group">
                    <div
                      className="w-1.5 self-stretch rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: cat?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{spark.giver.name}</span>
                        <span className="text-muted-foreground mx-1.5">sparked</span>
                        <span className="font-semibold">{spark.receiver.name}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant="secondary"
                          className="text-[11px] px-2.5 py-0.5 h-5 font-semibold rounded-lg"
                          style={{ backgroundColor: cat?.color + "18", color: cat?.color }}
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
        </motion.div>
      </div>
    </motion.div>
  );
}
