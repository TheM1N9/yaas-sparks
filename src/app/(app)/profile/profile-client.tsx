"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { LogOut } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryByName } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import type { Employee } from "@/types/database";

interface SparkWithPerson {
  id: string;
  category: string;
  reason: string;
  created_at: string;
  giver?: { name: string; avatar_url: string | null };
  receiver?: { name: string; avatar_url: string | null };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function ProfileClient({
  employee,
  received,
  given,
  givenCount,
  milestonesClaimed,
  isOwnProfile,
}: {
  employee: Employee;
  received: SparkWithPerson[];
  given: SparkWithPerson[];
  givenCount: number;
  milestonesClaimed: number;
  isOwnProfile?: boolean;
}) {
  const [tab, setTab] = useState<"received" | "given">("received");
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sparks = tab === "received" ? received : given;
  const showTeam = employee.team && employee.team !== "General";

  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Profile header */}
      <motion.div className="relative" variants={itemVariants}>
        {/* Gradient cover — avatar + name fully inside */}
        <div className="rounded-2xl bg-gradient-to-r from-primary via-[#E8724A] to-amber-500 overflow-hidden relative px-6 pt-5 pb-5">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          {/* Sign Out — top-right, clearly visible */}
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="absolute top-4 right-4 bg-white text-[#E05C33] border-white hover:bg-white/90 text-[12px] h-8 rounded-lg font-semibold z-20 shadow-sm"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
            </Button>
          )}

          {/* Avatar + name row — fully inside cover */}
          <div className="flex items-center gap-4 relative z-10">
          <Avatar className="h-16 w-16 border-2 border-white/30 shadow-lg shrink-0">
            <AvatarImage src={employee.avatar_url ?? undefined} />
            <AvatarFallback
              className="text-xl text-white font-display font-bold"
              style={{ backgroundColor: getAvatarColor(employee.name) }}
            >
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-display font-bold truncate text-white">{employee.name}</h1>
            <p className="text-[12px] text-white/70 mt-0.5">
              {showTeam && <span className="font-medium">{employee.team} · </span>}
              Joined {format(new Date(employee.created_at), "MMMM yyyy")}
            </p>
          </div>
          </div>{/* end avatar+name row */}
        </div>{/* end cover */}
      </motion.div>

      {/* Stats — horizontal strip */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center bg-white rounded-2xl border border-border/60 shadow-sm px-2 py-4">
          {[
            { label: "Earned", value: employee.sparks_earned_total, highlight: true },
            { label: "Given", value: givenCount, highlight: false },
            { label: "Milestones", value: milestonesClaimed, highlight: false },
          ].map((stat, i) => (
            <div key={stat.label} className="flex-1 flex items-center">
              <div className={cn(
                "flex-1 text-center",
                i > 0 && "border-l border-border/60"
              )}>
                <p className={cn(
                  "text-2xl font-display font-bold",
                  stat.highlight ? "text-primary" : "text-foreground"
                )}>
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tab toggle — minimal underline style */}
      <motion.div variants={itemVariants}>
        <div className="flex border-b border-border/60">
          <button
            onClick={() => setTab("received")}
            className={cn(
              "flex-1 pb-2.5 text-[13px] font-semibold transition-colors duration-200 text-center relative",
              tab === "received"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Received ({received.length})
            {tab === "received" && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
          <button
            onClick={() => setTab("given")}
            className={cn(
              "flex-1 pb-2.5 text-[13px] font-semibold transition-colors duration-200 text-center relative",
              tab === "given"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Given ({given.length})
            {tab === "given" && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        </div>
      </motion.div>

      {/* Spark cards */}
      <div className="space-y-3">
        {sparks.map((spark, i) => {
          const cat = getCategoryByName(spark.category);
          const person = tab === "received" ? spark.giver : spark.receiver;
          return (
            <motion.div
              key={spark.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="bg-white border border-border/60 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Colored left border */}
                    <div
                      className="w-1 shrink-0 rounded-l-xl"
                      style={{ backgroundColor: cat?.color }}
                    />
                    <div className="flex-1 p-3.5">
                      {/* Category + timestamp */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className="text-[11px] px-2 py-0.5 h-5 font-bold rounded-md"
                          style={{
                            backgroundColor: cat?.color + "15",
                            color: cat?.color,
                          }}
                        >
                          {cat?.emoji} {spark.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(spark.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {/* Reason — prominent, no tinted box */}
                      <p className="text-[13px] text-foreground leading-relaxed">
                        &ldquo;{spark.reason}&rdquo;
                      </p>
                      {/* From/To */}
                      {person && (
                        <p className="text-[12px] text-muted-foreground mt-2 font-medium">
                          {tab === "received" ? "From" : "To"}{" "}
                          <span className="text-foreground/70 font-semibold">{person.name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {sparks.length === 0 && (
          <motion.div
            className="text-center py-16 text-muted-foreground"
            variants={itemVariants}
          >
            <motion.span
              className="text-5xl block mb-3"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              🌟
            </motion.span>
            <p className="text-sm font-medium">No sparks {tab} yet</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
