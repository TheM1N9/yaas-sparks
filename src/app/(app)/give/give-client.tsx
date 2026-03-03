"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Search, ChevronLeft, ChevronRight, Sparkles, Check, Flame, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SPARK_CATEGORIES } from "@/lib/constants";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  avatar_url: string | null;
  team: string;
}

// Category card color mapping for rich gradient backgrounds
const categoryGradients: Record<string, string> = {
  Support: "from-blue-50 via-blue-100/50 to-blue-50",
  Proactivity: "from-amber-50 via-amber-100/50 to-amber-50",
  Artistry: "from-violet-50 via-violet-100/50 to-violet-50",
  Reliability: "from-emerald-50 via-emerald-100/50 to-emerald-50",
  "Knowledge Sharing": "from-cyan-50 via-cyan-100/50 to-cyan-50",
  Spirit: "from-red-50 via-red-100/50 to-red-50",
};

const categoryBorders: Record<string, string> = {
  Support: "border-blue-200",
  Proactivity: "border-amber-200",
  Artistry: "border-violet-200",
  Reliability: "border-emerald-200",
  "Knowledge Sharing": "border-cyan-200",
  Spirit: "border-red-200",
};

export function GiveSparkClient({
  currentUserId,
  sparksRemaining,
  employees,
}: {
  currentUserId: string;
  sparksRemaining: number;
  employees: Employee[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Employee | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredEmployees = employees.filter(
    (e) =>
      e.id !== currentUserId &&
      e.name.toLowerCase().includes(search.toLowerCase())
  );

  const canSubmit =
    selectedPerson && selectedCategory && reason.length >= 10 && reason.length <= 280;

  const fireConfetti = useCallback(() => {
    const end = Date.now() + 1200;
    const colors = ["#E05C33", "#FF8C42", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sparks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: selectedPerson!.id,
          category: selectedCategory,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
      fireConfetti();
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (sparksRemaining <= 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-6 shadow-sm">
          <span className="text-5xl animate-sparkle">&#10024;</span>
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">All Sparks Given!</h2>
        <p className="text-muted-foreground max-w-sm text-[15px] leading-relaxed">
          You&apos;ve used all 5 Sparks this month. Come back next month to spread more appreciation!
        </p>
        <Button
          variant="outline"
          className="mt-8 rounded-xl px-6 h-11 font-semibold"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="text-8xl mb-6"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          🌟
        </motion.div>
        <h2 className="text-3xl font-display font-bold mb-3 text-gradient">Spark Sent!</h2>
        <p className="text-muted-foreground text-[15px]">
          You sparked <span className="font-bold text-foreground">{selectedPerson?.name}</span> for{" "}
          <span className="font-bold text-foreground">{selectedCategory}</span>
        </p>
        <motion.div
          className="flex items-center gap-2 mt-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Heart className="h-4 w-4 text-primary" />
          Redirecting to dashboard...
        </motion.div>
      </motion.div>
    );
  }

  const cat = SPARK_CATEGORIES.find((c) => c.name === selectedCategory);
  const stepLabels = ["Who", "Category", "Why"];
  const stepIcons = ["👤", "✨", "💬"];

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Give a Spark</h1>
        <p className="text-muted-foreground text-[15px] mt-1">
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-primary" />
            {sparksRemaining} spark{sparksRemaining !== 1 ? "s" : ""} remaining this month
          </span>
        </p>
      </div>

      {/* Step indicator — visual journey */}
      <div className="flex items-center gap-0">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <motion.div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold transition-all",
                  step > s
                    ? "bg-gradient-to-br from-primary to-amber-500 text-white shadow-[0_4px_12px_rgba(224,92,51,0.3)]"
                    : step === s
                    ? "bg-gradient-to-br from-primary to-amber-500 text-white shadow-[0_0_0_4px_rgba(224,92,51,0.15),0_4px_12px_rgba(224,92,51,0.3)]"
                    : "bg-accent text-muted-foreground border border-border"
                )}
                animate={step === s ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {step > s ? <Check className="h-5 w-5" /> : <span className="text-base">{stepIcons[s - 1]}</span>}
              </motion.div>
              <span className={cn(
                "text-[13px] font-semibold hidden sm:inline",
                step >= s ? "text-foreground" : "text-muted-foreground"
              )}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 3 && (
              <div className={cn(
                "h-[3px] flex-1 mx-4 rounded-full transition-all duration-500",
                step > s ? "bg-gradient-to-r from-primary to-amber-500" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <motion.div
          className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Who */}
        {step === 1 && (
          <motion.div
            key="step1"
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 rounded-2xl bg-white border-border/60 text-[15px]"
              />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredEmployees.map((emp, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all border-2 group",
                    selectedPerson?.id === emp.id
                      ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(224,92,51,0.08)]"
                      : "border-transparent hover:bg-accent/60 hover:border-border/40"
                  )}
                  onClick={() => setSelectedPerson(emp)}
                >
                  <Avatar className="h-11 w-11 ring-2 ring-border/30">
                    <AvatarImage src={emp.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs text-white font-semibold" style={{ backgroundColor: getAvatarColor(emp.name) }}>{getInitials(emp.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{emp.name}</p>
                    {emp.team && emp.team !== "General" && <p className="text-[12px] text-muted-foreground">{emp.team}</p>}
                  </div>
                  {selectedPerson?.id === emp.id && (
                    <motion.div
                      className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-sm"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
              {filteredEmployees.length === 0 && (
                <p className="text-center text-muted-foreground py-10 text-sm">
                  No employees found
                </p>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-12 bg-gradient-to-r from-primary to-amber-500 hover:from-[#C44D28] hover:to-amber-600 rounded-2xl font-display font-bold text-[15px] shadow-[0_4px_14px_rgba(224,92,51,0.3)]"
                disabled={!selectedPerson}
                onClick={() => setStep(2)}
              >
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <motion.div
            key="step2"
            className="space-y-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {SPARK_CATEGORIES.map((category, i) => (
                <motion.div
                  key={category.code}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200",
                    `bg-gradient-to-br ${categoryGradients[category.name]}`,
                    selectedCategory === category.name
                      ? `${categoryBorders[category.name]} shadow-lg`
                      : "border-transparent hover:shadow-md"
                  )}
                  style={
                    selectedCategory === category.name
                      ? { boxShadow: `0 8px 24px ${category.color}25` }
                      : undefined
                  }
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {selectedCategory === category.name && (
                    <motion.div
                      className="absolute top-2.5 right-2.5 h-6 w-6 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: category.color }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="h-3.5 w-3.5 text-white" />
                    </motion.div>
                  )}
                  <span className="text-4xl block mb-3">{category.emoji}</span>
                  <p className="font-display font-bold text-sm">{category.name}</p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                    {category.description}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-2xl font-semibold border-border/60">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-12 bg-gradient-to-r from-primary to-amber-500 hover:from-[#C44D28] hover:to-amber-600 rounded-2xl font-display font-bold text-[15px] shadow-[0_4px_14px_rgba(224,92,51,0.3)]"
                  disabled={!selectedCategory}
                  onClick={() => setStep(3)}
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Why */}
        {step === 3 && (
          <motion.div
            key="step3"
            className="space-y-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Preview card */}
            <Card className="border-0 overflow-hidden rounded-2xl shadow-sm"
              style={{ background: `linear-gradient(135deg, ${cat?.color}08 0%, ${cat?.color}04 100%)` }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 ring-2 ring-border/30">
                    <AvatarImage src={selectedPerson?.avatar_url ?? undefined} />
                    <AvatarFallback
                      className="text-xs text-white font-semibold"
                      style={{ backgroundColor: selectedPerson ? getAvatarColor(selectedPerson.name) : undefined }}
                    >
                      {selectedPerson ? getInitials(selectedPerson.name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-display font-bold">{selectedPerson?.name}</p>
                    {selectedPerson?.team && selectedPerson?.team !== "General" && <p className="text-[12px] text-muted-foreground">{selectedPerson.team}</p>}
                  </div>
                </div>
                <Badge
                  className="text-xs font-semibold rounded-lg px-3 py-1"
                  style={{ backgroundColor: cat?.color + "18", color: cat?.color }}
                >
                  {cat?.emoji} {selectedCategory}
                </Badge>
              </CardContent>
            </Card>

            <div>
              <Textarea
                placeholder="Why does this person deserve a Spark? (10-280 characters)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none rounded-2xl text-[15px] bg-white border-border/60 focus:ring-primary/20"
              />
              <div className="flex justify-end mt-2">
                <span
                  className={cn(
                    "text-xs font-semibold px-3 py-1 rounded-lg",
                    reason.length < 10
                      ? "bg-accent text-muted-foreground"
                      : reason.length > 280
                      ? "bg-red-50 text-red-500"
                      : "bg-emerald-50 text-emerald-600"
                  )}
                >
                  {reason.length}/280
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-2xl font-semibold border-border/60">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-12 bg-gradient-to-r from-primary to-amber-500 hover:from-[#C44D28] hover:to-amber-600 rounded-2xl font-display font-bold text-[15px] shadow-[0_4px_14px_rgba(224,92,51,0.3)]"
                  disabled={!canSubmit || loading}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        &#10024;
                      </motion.span>
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-4 w-4" /> Send Spark
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
