"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SPARK_CATEGORIES, getCategoryByName } from "@/lib/constants";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface FeedSpark {
  id: string;
  category: string;
  reason: string;
  created_at: string;
  giver: { id: string; name: string; avatar_url: string | null };
  receiver: { id: string; name: string; avatar_url: string | null };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function FeedClient({ sparks }: { sparks: FeedSpark[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? sparks.filter((s) => s.category === filter)
    : sparks;

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground text-[15px] mt-0.5">All Sparks across the company</p>
      </div>

      {/* Category filter pills — beautiful, tactile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilter(null)}
          className={cn(
            "shrink-0 px-5 py-2 rounded-2xl text-[13px] font-semibold transition-all duration-200 border-2",
            filter === null
              ? "bg-[#E05C33] text-white border-[#E05C33] shadow-sm"
              : "bg-white text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
          )}
        >
          All
        </motion.button>
        {SPARK_CATEGORIES.map((cat) => (
          <motion.button
            key={cat.code}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(filter === cat.name ? null : cat.name)}
            className={cn(
              "shrink-0 px-5 py-2 rounded-2xl text-[13px] font-semibold transition-all duration-200 border-2 flex items-center gap-1.5",
              filter === cat.name
                ? "text-white border-transparent shadow-md"
                : "bg-white text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
            )}
            style={
              filter === cat.name
                ? { backgroundColor: cat.color, borderColor: cat.color, boxShadow: `0 4px 14px ${cat.color}40` }
                : undefined
            }
          >
            <span className="text-base">{cat.emoji}</span>
            {cat.name}
          </motion.button>
        ))}
      </div>

      {/* Feed cards — social post style */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={filter}
      >
        {filtered.map((spark) => {
          const cat = getCategoryByName(spark.category);
          return (
            <motion.div key={spark.id} variants={cardVariants}>
              <Card className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <CardContent className="px-4 py-3">
                  {/* Header: giver → receiver + badge + time */}
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/profile/${spark.giver.id}`} className="shrink-0">
                      <Avatar className="h-8 w-8 ring-1 ring-border/30 hover:ring-primary/30 transition-all">
                        <AvatarImage src={spark.giver.avatar_url ?? undefined} />
                        <AvatarFallback
                          className="text-[10px] text-white font-semibold"
                          style={{ backgroundColor: getAvatarColor(spark.giver.name) }}
                        >
                          {getInitials(spark.giver.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <p className="text-[13px] flex-1 min-w-0">
                      <Link
                        href={`/profile/${spark.giver.id}`}
                        className="font-bold hover:text-primary transition-colors"
                      >
                        {spark.giver.name}
                      </Link>
                      <span className="text-muted-foreground mx-1">→</span>
                      <Link
                        href={`/profile/${spark.receiver.id}`}
                        className="font-bold hover:text-primary transition-colors"
                      >
                        {spark.receiver.name}
                      </Link>
                    </p>
                    <Badge
                      className="text-[11px] font-bold rounded-lg px-2 py-0.5 shrink-0"
                      style={{
                        backgroundColor: cat?.color + "15",
                        color: cat?.color,
                      }}
                    >
                      {cat?.emoji} {spark.category}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(spark.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Reason — hero text */}
                  <p className="text-[15px] font-medium text-foreground leading-snug">
                    &ldquo;{spark.reason}&rdquo;
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <motion.div
            className="text-center py-20 text-muted-foreground"
            variants={cardVariants}
          >
            <motion.span
              className="text-6xl block mb-4"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              🌟
            </motion.span>
            <p className="text-lg font-display font-bold">No sparks found</p>
            <p className="text-sm mt-1">{filter ? "Try a different filter!" : "Be the first to give one!"}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
