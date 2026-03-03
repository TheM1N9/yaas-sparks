"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryByName } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/database";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface SparkWithPerson {
  id: string;
  category: string;
  reason: string;
  created_at: string;
  giver?: { name: string; avatar_url: string | null };
  receiver?: { name: string; avatar_url: string | null };
}

export function ProfileClient({
  employee,
  received,
  given,
  milestonesClaimed,
  isOwnProfile,
}: {
  employee: Employee;
  received: SparkWithPerson[];
  given: SparkWithPerson[];
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

  return (
    <div className="space-y-6">
      {/* Profile header with gradient cover */}
      <div className="relative">
        {/* Gradient cover */}
        <div className="h-32 sm:h-40 rounded-2xl bg-gradient-to-r from-primary to-[#FF8C42] overflow-hidden">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptMCAxNXY2aC02di02aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />
        </div>

        {/* Avatar - overlapping the cover */}
        <div className="flex flex-col items-center -mt-14 sm:-mt-16 relative z-10">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white shadow-lg">
            <AvatarImage src={employee.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold mt-3">{employee.name}</h1>
          <p className="text-muted-foreground text-[13px]">{employee.team}</p>
          <p className="text-[12px] text-muted-foreground">
            Joined {format(new Date(employee.created_at), "MMMM yyyy")}
          </p>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="mt-3 rounded-lg text-[13px] h-8"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Earned", value: employee.sparks_earned_total, highlight: true },
          { label: "Given", value: given.length, highlight: false },
          { label: "Milestones", value: milestonesClaimed, highlight: false },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardContent className="py-4 px-3 text-center">
              <p className={cn("text-2xl font-bold", stat.highlight && "text-primary")}>
                {stat.value}
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex bg-muted rounded-lg p-1">
        <button
          onClick={() => setTab("received")}
          className={cn(
            "flex-1 py-2 text-[13px] font-medium rounded-md transition-all text-center",
            tab === "received"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Received ({received.length})
        </button>
        <button
          onClick={() => setTab("given")}
          className={cn(
            "flex-1 py-2 text-[13px] font-medium rounded-md transition-all text-center",
            tab === "given"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Given ({given.length})
        </button>
      </div>

      {/* Spark cards */}
      <div className="space-y-3">
        {sparks.map((spark) => {
          const cat = getCategoryByName(spark.category);
          const person = tab === "received" ? spark.giver : spark.receiver;
          return (
            <Card key={spark.id} className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div
                    className="w-1 shrink-0"
                    style={{ backgroundColor: cat?.color }}
                  />
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-2 py-0 h-5 font-medium"
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
                    <p className="text-[13px] text-foreground/80 leading-relaxed">
                      &ldquo;{spark.reason}&rdquo;
                    </p>
                    {person && (
                      <p className="text-[12px] text-muted-foreground mt-2">
                        {tab === "received" ? "From" : "To"} {person.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {sparks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <span className="text-3xl block mb-2">🌟</span>
            <p className="text-sm">No sparks {tab} yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
