"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Search, ChevronLeft, ChevronRight, Sparkles, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SPARK_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Employee {
  id: string;
  name: string;
  avatar_url: string | null;
  team: string;
}

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
    const end = Date.now() + 800;
    const colors = ["#E05C33", "#FF8C42", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
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
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (sparksRemaining <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="text-xl font-bold mb-2">All Sparks Given!</h2>
        <p className="text-muted-foreground max-w-sm text-[15px]">
          You&apos;ve used all 5 Sparks this month. Come back next month to spread more appreciation!
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-7xl mb-6">🌟</div>
        <h2 className="text-2xl font-bold mb-2">Spark Sent!</h2>
        <p className="text-muted-foreground text-[15px]">
          You sparked <span className="font-semibold text-foreground">{selectedPerson?.name}</span> for{" "}
          <span className="font-semibold text-foreground">{selectedCategory}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-3">Redirecting to dashboard...</p>
      </div>
    );
  }

  const cat = SPARK_CATEGORIES.find((c) => c.name === selectedCategory);
  const stepLabels = ["Who", "Category", "Why"];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Give a Spark</h1>
        <p className="text-muted-foreground text-[15px] mt-0.5">
          {sparksRemaining} spark{sparksRemaining !== 1 ? "s" : ""} remaining this month
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  step > s
                    ? "bg-primary text-white"
                    : step === s
                    ? "bg-primary text-white shadow-[0_0_0_4px_rgba(224,92,51,0.15)]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={cn(
                "text-[13px] font-medium hidden sm:inline",
                step >= s ? "text-foreground" : "text-muted-foreground"
              )}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 3 && (
              <div className={cn(
                "h-[2px] flex-1 mx-3 rounded-full transition-colors",
                step > s ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Who */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                  selectedPerson?.id === emp.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent hover:bg-muted/60"
                )}
                onClick={() => setSelectedPerson(emp)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={emp.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-muted font-medium">{getInitials(emp.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-[12px] text-muted-foreground">{emp.team}</p>
                </div>
                {selectedPerson?.id === emp.id && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="text-center text-muted-foreground py-10 text-sm">
                No employees found
              </p>
            )}
          </div>
          <Button
            className="w-full h-11 bg-primary hover:bg-[#C44D28] rounded-xl font-semibold"
            disabled={!selectedPerson}
            onClick={() => setStep(2)}
          >
            Continue <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Category */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {SPARK_CATEGORIES.map((category) => (
              <div
                key={category.code}
                className={cn(
                  "relative cursor-pointer rounded-2xl border-2 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  selectedCategory === category.name
                    ? "border-primary shadow-md"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
                style={
                  selectedCategory === category.name
                    ? { backgroundColor: category.color + "10" }
                    : undefined
                }
                onClick={() => setSelectedCategory(category.name)}
              >
                {selectedCategory === category.name && (
                  <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <span className="text-3xl block mb-2">{category.emoji}</span>
                <p className="font-semibold text-sm">{category.name}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              className="flex-1 h-11 bg-primary hover:bg-[#C44D28] rounded-xl font-semibold"
              disabled={!selectedCategory}
              onClick={() => setStep(3)}
            >
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Why */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Preview card */}
          <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/[0.02] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedPerson?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-muted font-medium">
                    {selectedPerson ? getInitials(selectedPerson.name) : ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{selectedPerson?.name}</p>
                  <p className="text-[12px] text-muted-foreground">{selectedPerson?.team}</p>
                </div>
              </div>
              <Badge
                className="text-xs font-medium"
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
              className="resize-none rounded-xl text-[15px]"
            />
            <div className="flex justify-end mt-2">
              <span
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  reason.length < 10
                    ? "bg-muted text-muted-foreground"
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
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              className="flex-1 h-11 bg-primary hover:bg-[#C44D28] rounded-xl font-semibold"
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" /> Send Spark
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
