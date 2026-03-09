"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Search, ChevronLeft, ChevronRight, Sparkles, Check, Flame, Heart, Info, Users, Zap, ArrowLeft, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SPARK_CATEGORIES, SPARKS_PER_MONTH } from "@/lib/constants";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import Link from "next/link";

interface Employee {
  id: string;
  name: string;
  avatar_url: string | null;
  team: string;
}

// Enhanced category card styling
const categoryStyles: Record<string, { gradient: string; border: string; shadow: string; accent: string }> = {
  Support: { 
    gradient: "from-blue-50 via-blue-100/50 to-blue-50", 
    border: "border-blue-200", 
    shadow: "shadow-blue-100/50",
    accent: "bg-blue-500"
  },
  Proactivity: { 
    gradient: "from-amber-50 via-amber-100/50 to-amber-50", 
    border: "border-amber-200", 
    shadow: "shadow-amber-100/50",
    accent: "bg-amber-500"
  },
  Artistry: { 
    gradient: "from-violet-50 via-violet-100/50 to-violet-50", 
    border: "border-violet-200", 
    shadow: "shadow-violet-100/50",
    accent: "bg-violet-500"
  },
  Reliability: { 
    gradient: "from-emerald-50 via-emerald-100/50 to-emerald-50", 
    border: "border-emerald-200", 
    shadow: "shadow-emerald-100/50",
    accent: "bg-emerald-500"
  },
  "Knowledge Sharing": { 
    gradient: "from-cyan-50 via-cyan-100/50 to-cyan-50", 
    border: "border-cyan-200", 
    shadow: "shadow-cyan-100/50",
    accent: "bg-cyan-500"
  },
  Spirit: { 
    gradient: "from-red-50 via-red-100/50 to-red-50", 
    border: "border-red-200", 
    shadow: "shadow-red-100/50",
    accent: "bg-red-500"
  },
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
    const end = Date.now() + 2000;
    const colors = ["#E05C33", "#FF8C42", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 70,
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
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (sparksRemaining <= 0) {
    return (
      <div className="max-w-2xl">
        <motion.div
          className="flex flex-col items-center justify-center py-24 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-8 shadow-lg">
            <span className="text-6xl animate-bounce">✨</span>
          </div>
          <h2 className="text-3xl font-display font-bold mb-4 text-gradient">All Sparks Given!</h2>
          <p className="text-muted-foreground max-w-md text-[16px] leading-relaxed mb-8">
            You&apos;ve used all {SPARKS_PER_MONTH} Sparks this month. Your generosity is appreciated! Come back next month to spread more joy.
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-xl px-6 h-12 font-semibold">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/milestones">
              <Button className="rounded-xl px-6 h-12 font-semibold bg-gradient-to-r from-primary to-amber-500">
                <Sparkles className="mr-2 h-4 w-4" />
                View Rewards
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="flex flex-col items-center justify-center py-24 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="text-8xl mb-8"
            animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🌟
          </motion.div>
          <h2 className="text-4xl font-display font-bold mb-4 text-gradient">Spark Sent!</h2>
          <div className="bg-gradient-to-br from-primary/10 to-amber-100/50 rounded-2xl p-6 mb-6 border border-primary/20">
            <p className="text-[16px] text-foreground">
              You sparked <span className="font-bold text-primary">{selectedPerson?.name}</span> for{" "}
              <span className="font-bold text-primary">{selectedCategory}</span>
            </p>
            <p className="text-[14px] text-muted-foreground mt-2 italic">"{reason}"</p>
          </div>
          <motion.div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Heart className="h-4 w-4 text-primary" />
            Redirecting to dashboard...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const cat = SPARK_CATEGORIES.find((c) => c.name === selectedCategory);
  const stepLabels = ["Choose Person", "Select Category", "Write Message"];
  const stepIcons = [Users, Zap, Heart];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Enhanced Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-display font-bold tracking-tight">Give a Spark</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Rules & Guidelines
                  </DialogTitle>
                  <DialogDescription>
                    Follow these guidelines to make the most of your Sparks
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <div>
                      <p className="font-semibold text-sm">{SPARKS_PER_MONTH} Sparks per month</p>
                      <p className="text-[13px] text-muted-foreground">Use them wisely — they don't roll over!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <div>
                      <p className="font-semibold text-sm">1 Spark per person per month</p>
                      <p className="text-[13px] text-muted-foreground">Make each one count and spread the love</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <div>
                      <p className="font-semibold text-sm">Be specific and genuine</p>
                      <p className="text-[13px] text-muted-foreground">Share what they did that impressed you</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <div>
                      <p className="font-semibold text-sm">10-280 characters required</p>
                      <p className="text-[13px] text-muted-foreground">Write a meaningful message</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-xl px-3 py-1.5">
            <Flame className="h-4 w-4" />
            {sparksRemaining} spark{sparksRemaining !== 1 ? "s" : ""} remaining this month
          </div>
        </div>
        <p className="text-muted-foreground text-[15px] mb-2">
          Recognize someone&apos;s amazing work and spread positivity across the team
        </p>
      </div>

      {/* Enhanced Step Indicator */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((s, index) => {
          const StepIcon = stepIcons[index];
          // Smart navigation logic
          const isCompleted = (s === 1 && selectedPerson) || 
                             (s === 2 && selectedCategory) || 
                             (s === 3 && reason.length >= 10);
          const canNavigate = s === 1 || 
                             (s === 2 && selectedPerson) || 
                             (s === 3 && selectedPerson && selectedCategory);
          
          return (
            <motion.button
              key={s}
              className={cn(
                "flex flex-col items-center gap-3 px-4 py-4 rounded-2xl transition-all w-full",
                isCompleted
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl cursor-pointer"
                  : step === s
                  ? "bg-gradient-to-br from-primary to-amber-500 text-white shadow-lg scale-105 cursor-pointer"
                  : canNavigate
                  ? "bg-white border-2 border-border text-muted-foreground hover:border-primary/50 hover:text-primary cursor-pointer"
                  : "bg-accent text-muted-foreground/50 cursor-not-allowed",
                !canNavigate && "opacity-50"
              )}
              animate={step === s && !isCompleted ? { scale: [1.05, 1.02, 1.05] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              onClick={() => {
                if (canNavigate) {
                  setStep(s);
                  setError(null);
                }
              }}
              disabled={!canNavigate}
              whileHover={canNavigate ? { scale: 1.02 } : {}}
              whileTap={canNavigate ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center justify-center w-10 h-10">
                {isCompleted ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <StepIcon className="h-6 w-6" />
                )}
              </div>
              <span className="text-[13px] font-semibold text-center">
                {stepLabels[s - 1]}
              </span>
            </motion.button>
          );
        })}
      </div>


      {error && (
        <motion.div
          className="rounded-2xl bg-red-50 border border-red-200 px-6 py-4 text-sm text-red-700 shadow-sm"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            {error}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Enhanced Person Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-white border-border/60 text-[16px] shadow-sm"
              />
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 py-1">
              {filteredEmployees.map((emp, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border group mx-1",
                    selectedPerson?.id === emp.id
                      ? "border-primary bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg shadow-primary/20"
                      : "border-border bg-white hover:border-primary/30 hover:shadow-md"
                  )}
                  onClick={() => setSelectedPerson(emp)}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                    <AvatarImage src={emp.avatar_url ?? undefined} />
                    <AvatarFallback 
                      className="text-sm text-white font-semibold" 
                      style={{ backgroundColor: getAvatarColor(emp.name) }}
                    >
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold text-[15px] transition-colors",
                      selectedPerson?.id === emp.id ? "text-primary" : "text-foreground group-hover:text-primary"
                    )}>
                      {emp.name}
                    </p>
                    {emp.team && emp.team !== "General" && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">{emp.team}</p>
                    )}
                  </div>
                  {selectedPerson?.id === emp.id && (
                    <motion.div
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-sm"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No employees found</p>
                  <p className="text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
            
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-14 bg-gradient-to-r from-primary to-amber-500 hover:from-[#C44D28] hover:to-amber-600 rounded-2xl font-display font-bold text-[16px] shadow-lg"
                disabled={!selectedPerson}
                onClick={() => setStep(2)}
              >
                Continue <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Enhanced Category Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {SPARK_CATEGORIES.map((category, i) => {
                const style = categoryStyles[category.name];
                return (
                  <motion.div
                    key={category.code}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -8, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 shadow-sm hover:shadow-lg",
                      `bg-gradient-to-br ${style.gradient}`,
                      selectedCategory === category.name
                        ? `${style.border} shadow-lg scale-105`
                        : "border-transparent hover:shadow-md"
                    )}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {selectedCategory === category.name && (
                      <motion.div
                        className={`absolute top-3 right-3 h-7 w-7 rounded-xl flex items-center justify-center shadow-sm ${style.accent}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Check className="h-4 w-4 text-white" />
                      </motion.div>
                    )}
                    <span className="text-5xl block mb-4">{category.emoji}</span>
                    <h3 className="font-display font-bold text-[16px] mb-2">{category.name}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)} 
                className="flex-1 h-14 rounded-2xl font-semibold border-border/60"
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Back
              </Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-14 bg-gradient-to-r from-primary to-amber-500 hover:from-[#C44D28] hover:to-amber-600 rounded-2xl font-display font-bold text-[16px] shadow-lg"
                  disabled={!selectedCategory}
                  onClick={() => setStep(3)}
                >
                  Continue <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Enhanced Message Writing */}
        {step === 3 && (
          <motion.div
            key="step3"
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Enhanced Preview Card */}
            <Card className="border-0 overflow-hidden rounded-2xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${cat?.color}08 0%, ${cat?.color}04 100%)` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 ring-2 ring-border/30 shadow-sm">
                    <AvatarImage src={selectedPerson?.avatar_url ?? undefined} />
                    <AvatarFallback
                      className="text-sm text-white font-semibold"
                      style={{ backgroundColor: selectedPerson ? getAvatarColor(selectedPerson.name) : undefined }}
                    >
                      {selectedPerson ? getInitials(selectedPerson.name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-display font-bold">{selectedPerson?.name}</p>
                    {selectedPerson?.team && selectedPerson?.team !== "General" && (
                      <p className="text-[13px] text-muted-foreground">{selectedPerson.team}</p>
                    )}
                  </div>
                </div>
                <Badge
                  className="text-sm font-semibold rounded-xl px-4 py-2"
                  style={{ backgroundColor: cat?.color + "20", color: cat?.color }}
                >
                  {cat?.emoji} {selectedCategory}
                </Badge>
              </CardContent>
            </Card>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Why does {selectedPerson?.name} deserve this Spark?
              </label>
              <Textarea
                placeholder="Share what they did that impressed you, helped the team, or made your day better..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                className="resize-none rounded-2xl text-[15px] bg-white border-border/60 focus:ring-primary/20 shadow-sm"
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-[12px] text-muted-foreground">
                  Minimum 10 characters for a meaningful message
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold px-3 py-1 rounded-lg",
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

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)} 
                className="flex-1 h-14 rounded-2xl font-semibold border-border/60"
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Back
              </Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-14 bg-gradient-to-r from-primary to-amber-500 hover:from-[#C44D28] hover:to-amber-600 rounded-2xl font-display font-bold text-[16px] shadow-lg"
                  disabled={!canSubmit || loading}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ✨
                      </motion.span>
                      Sending Spark...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" /> Send Spark
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