"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SPARK_CATEGORIES, getCategoryByName } from "@/lib/constants";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface FeedSpark {
  id: string;
  category: string;
  reason: string;
  created_at: string;
  giver: { id: string; name: string; avatar_url: string | null };
  receiver: { id: string; name: string; avatar_url: string | null };
}

export function FeedClient({ sparks }: { sparks: FeedSpark[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? sparks.filter((s) => s.category === filter)
    : sparks;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground text-[15px] mt-0.5">All Sparks across the company</p>
      </div>

      {/* Category filter pills — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all border",
            filter === null
              ? "bg-foreground text-background border-foreground"
              : "bg-white text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
          )}
        >
          All
        </button>
        {SPARK_CATEGORIES.map((cat) => (
          <button
            key={cat.code}
            onClick={() => setFilter(filter === cat.name ? null : cat.name)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all border flex items-center gap-1.5",
              filter === cat.name
                ? "text-white border-transparent"
                : "bg-white text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
            )}
            style={
              filter === cat.name ? { backgroundColor: cat.color, borderColor: cat.color } : undefined
            }
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Feed cards */}
      <div className="space-y-3">
        {filtered.map((spark) => {
          const cat = getCategoryByName(spark.category);
          return (
            <Card key={spark.id} className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Category color-coded left border */}
                  <div
                    className="w-1 shrink-0"
                    style={{ backgroundColor: cat?.color }}
                  />
                  <div className="flex items-start gap-3 p-4 flex-1">
                    <Link href={`/profile/${spark.giver.id}`} className="shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={spark.giver.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[11px] bg-muted font-medium">
                          {getInitials(spark.giver.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <Link
                          href={`/profile/${spark.giver.id}`}
                          className="font-semibold hover:underline underline-offset-2"
                        >
                          {spark.giver.name}
                        </Link>
                        <span className="text-muted-foreground mx-1.5">→</span>
                        <Link
                          href={`/profile/${spark.receiver.id}`}
                          className="font-semibold hover:underline underline-offset-2"
                        >
                          {spark.receiver.name}
                        </Link>
                      </p>
                      <div className="mt-1.5">
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
                      </div>
                      <p className="text-[13px] mt-2 text-foreground/80 leading-relaxed">
                        &ldquo;{spark.reason}&rdquo;
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(spark.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <span className="text-4xl block mb-3">🌟</span>
            <p className="text-[15px]">No sparks found. {filter ? "Try a different filter!" : "Be the first to give one!"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
