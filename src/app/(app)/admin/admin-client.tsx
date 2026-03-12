"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import {
  Download,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Copy,
  Check,
  Users,
  Sparkles,
  TrendingUp,
  Gift,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getCategoryByName, getCurrentMonthKey, MILESTONE_REWARDS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/database";

interface SparkWithNames {
  id: string;
  category: string;
  reason: string;
  created_at: string;
  month_key: string;
  receiver_id: string;
  giver: { name: string; email: string };
  receiver: { name: string; email: string };
}

interface MilestoneClaimWithEmployee {
  id: string;
  employee_id: string;
  milestone: number;
  claimed_at: string;
  employee: { name: string; email: string };
}

function formatMonthDisplay(monthKey: string): string {
  try {
    const date = parse(monthKey, "yyyy-MM", new Date());
    return format(date, "MMMM yyyy");
  } catch {
    return monthKey;
  }
}

function generateEmailTemplate(
  employeeName: string,
  employeeEmail: string,
  milestone: number,
  amount: number,
  amountLabel: string,
  claimedAt: string
): string {
  return `Subject: 🌟 Your YAASparks Reward - ${amountLabel}

Hi ${employeeName},

Congratulations! You've claimed your ${milestone} Sparks milestone reward!

🎉 Reward Details:
• Milestone: ${milestone} Sparks
• Reward: ${amountLabel}
• Claimed on: ${format(new Date(claimedAt), "MMMM d, yyyy 'at' h:mm a")}

To process your reward, please reply to this email with your preferred payment method${milestone === 100 ? " for the cash transfer" : " or confirm your gift card preference"}.

Thank you for being an amazing part of the YAAS team! Your contributions don't go unnoticed.

Keep sparking! ✨

Best regards,
The YAASparks Team

---
This is an automated message from YAASparks.
Employee Email: ${employeeEmail}`;
}

export function AdminClient({
  employees,
  sparks,
  milestoneClaims,
  availableMonths,
  
  monthlyReceivedCounts,
}: {
  employees: Employee[];
  sparks: SparkWithNames[];
  milestoneClaims: MilestoneClaimWithEmployee[];
  availableMonths: string[];
  monthlyReceivedCounts: Record<string, Record<string, number>>;
}) {
  const router = useRouter();
  const currentMonth = getCurrentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<MilestoneClaimWithEmployee | null>(null);

  // Get current month index for navigation
  const currentMonthIndex = availableMonths.indexOf(selectedMonth);
  const canGoNewer = currentMonthIndex > 0;
  const canGoOlder = currentMonthIndex < availableMonths.length - 1;

  const goNewer = () => {
    if (canGoNewer) {
      setSelectedMonth(availableMonths[currentMonthIndex - 1]);
    }
  };

  const goOlder = () => {
    if (canGoOlder) {
      setSelectedMonth(availableMonths[currentMonthIndex + 1]);
    }
  };

  // Filter sparks by selected month
  const filteredSparks = useMemo(() => {
    return sparks.filter((s) => s.month_key === selectedMonth);
  }, [sparks, selectedMonth]);

  // Filter milestone claims by selected month
  const filteredClaims = useMemo(() => {
    return milestoneClaims.filter((c) => {
      const claimMonth = format(new Date(c.claimed_at), "yyyy-MM");
      return claimMonth === selectedMonth;
    });
  }, [milestoneClaims, selectedMonth]);

  // Calculate total payout for the month based on milestone claims
  const monthlyPayout = useMemo(() => {
    return filteredClaims.reduce((sum, claim) => {
      const reward = MILESTONE_REWARDS[claim.milestone];
      return sum + (reward?.amount || 0);
    }, 0);
  }, [filteredClaims]);

  // Stats for selected month
  const monthStats = useMemo(() => {
    const totalSparks = filteredSparks.length;
    const totalClaims = filteredClaims.length;
    const uniqueReceivers = new Set(filteredSparks.map((s) => s.receiver_id)).size;
    const uniqueGivers = new Set(filteredSparks.map((s) => s.giver.email)).size;
    return { totalSparks, totalClaims, totalPayout: monthlyPayout, uniqueReceivers, uniqueGivers };
  }, [filteredSparks, filteredClaims, monthlyPayout]);

  const isCurrentMonth = selectedMonth === currentMonth;

  async function handleResetMonthly() {
    setResetLoading(true);
    await fetch("/api/admin/reset-monthly", { method: "POST" });
    setResetLoading(false);
    setResetOpen(false);
    router.refresh();
  }

  async function handleDeleteSpark(sparkId: string) {
    setDeleteLoading(sparkId);
    await fetch(`/api/sparks?id=${sparkId}`, { method: "DELETE" });
    setDeleteLoading(null);
    router.refresh();
  }

  function handleExportCSV() {
    const headers = ["Date", "Giver", "Giver Email", "Receiver", "Receiver Email", "Category", "Reason", "Month"];
    const rows = filteredSparks.map((s) => [
      format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
      s.giver.name,
      s.giver.email,
      s.receiver.name,
      s.receiver.email,
      s.category,
      `"${s.reason.replace(/"/g, '""')}"`,
      s.month_key,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sparks-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportClaimsCSV() {
    const headers = ["Date", "Employee", "Email", "Milestone", "Reward"];
    const rows = filteredClaims.map((c) => {
      const reward = MILESTONE_REWARDS[c.milestone];
      return [
        format(new Date(c.claimed_at), "yyyy-MM-dd HH:mm"),
        c.employee.name,
        c.employee.email,
        c.milestone,
        reward?.amountLabel || "",
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `milestone-claims-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyEmail(claim: MilestoneClaimWithEmployee) {
    const reward = MILESTONE_REWARDS[claim.milestone];
    const email = generateEmailTemplate(
      claim.employee.name,
      claim.employee.email,
      claim.milestone,
      reward?.amount || 0,
      reward?.amountLabel || "",
      claim.claimed_at
    );
    navigator.clipboard.writeText(email);
    setCopiedEmail(claim.id);
    setTimeout(() => setCopiedEmail(null), 2000);
  }

  // Format currency in INR
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground text-[15px]">Manage sparks, milestone claims, and payouts</p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border border-border/60 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={goOlder}
            disabled={!canGoOlder}
            className="h-9 w-9 p-0 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 px-3 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-semibold">
              {formatMonthDisplay(selectedMonth)}
            </span>
            {isCurrentMonth && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                NOW
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goNewer}
            disabled={!canGoNewer}
            className="h-9 w-9 p-0 rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Sparks</p>
                  <p className="text-2xl font-display font-bold">{monthStats.totalSparks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Payout</p>
                  <p className="text-2xl font-display font-bold">{formatINR(monthStats.totalPayout)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Claims</p>
                  <p className="text-2xl font-display font-bold">{monthStats.totalClaims}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Active Givers</p>
                  <p className="text-2xl font-display font-bold">{monthStats.uniqueGivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="claims" className="space-y-4">
        <TabsList className="bg-white border border-border/60 rounded-2xl p-1 h-auto">
          <TabsTrigger value="claims" className="rounded-xl px-4 py-2 text-[13px] font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-amber-500 data-[state=active]:text-white">
            🎁 Milestone Claims
          </TabsTrigger>
          <TabsTrigger value="sparks" className="rounded-xl px-4 py-2 text-[13px] font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-amber-500 data-[state=active]:text-white">
            ✨ Sparks
          </TabsTrigger>
          <TabsTrigger value="employees" className="rounded-xl px-4 py-2 text-[13px] font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-amber-500 data-[state=active]:text-white">
            👥 Employees
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl px-4 py-2 text-[13px] font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-amber-500 data-[state=active]:text-white">
            ⚙️ Settings
          </TabsTrigger>
        </TabsList>

        {/* Milestone Claims Tab */}
        <TabsContent value="claims" className="space-y-4">
          <Card className="border-0 warm-card rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">
                  Milestone Claims — {formatMonthDisplay(selectedMonth)}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportClaimsCSV} className="rounded-xl">
                  <Download className="mr-1.5 h-4 w-4" /> Export CSV
                </Button>
              </div>
              <p className="text-[13px] text-muted-foreground">
                {filteredClaims.length} claim{filteredClaims.length !== 1 ? "s" : ""} • Total payout: {formatINR(monthlyPayout)}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredClaims.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <span className="text-4xl block mb-3">🎁</span>
                  <p className="font-medium">No milestone claims this month</p>
                  <p className="text-sm">Check previous months using the navigation above</p>
                </div>
              ) : (
                filteredClaims.map((claim, i) => {
                  const reward = MILESTONE_REWARDS[claim.milestone];
                  return (
                    <motion.div
                      key={claim.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-2xl p-3 hover:bg-accent/50 transition-all group"
                    >
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-amber-100 flex items-center justify-center">
                        <span className="text-2xl">{reward?.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{claim.employee.name}</p>
                        <p className="text-[11px] text-muted-foreground">{claim.employee.email}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(new Date(claim.claimed_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary">
                          {claim.milestone} sparks
                        </Badge>
                        <span className={cn(
                          "font-display font-bold px-3 py-1.5 rounded-xl text-sm",
                          claim.milestone === 100 
                            ? "text-amber-700 bg-amber-50" 
                            : "text-emerald-600 bg-emerald-50"
                        )}>
                          {reward?.amountLabel}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyEmail(claim)}
                          className="h-9 w-9 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy email template"
                        >
                          {copiedEmail === claim.id ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClaim(claim)}
                          className="h-9 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium"
                        >
                          View Email
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Milestone Summary */}
          <Card className="border-0 warm-card rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">Payout Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[25, 50, 100].map((milestone) => {
                  const reward = MILESTONE_REWARDS[milestone];
                  const count = filteredClaims.filter((c) => c.milestone === milestone).length;
                  const total = count * (reward?.amount || 0);
                  return (
                    <div key={milestone} className="text-center p-4 rounded-xl bg-accent/50">
                      <span className="text-3xl block mb-2">{reward?.emoji}</span>
                      <p className="text-sm font-semibold">{milestone} Sparks</p>
                      <p className="text-[12px] text-muted-foreground">{reward?.amountLabel}</p>
                      <div className="mt-3 pt-3 border-t border-border/40">
                        <p className="text-2xl font-display font-bold text-primary">{count}</p>
                        <p className="text-[11px] text-muted-foreground">claims</p>
                        <p className="text-sm font-semibold text-emerald-600 mt-1">{formatINR(total)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sparks Tab */}
        <TabsContent value="sparks" className="space-y-4">
          <Card className="border-0 warm-card rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">
                  Sparks — {formatMonthDisplay(selectedMonth)} ({filteredSparks.length})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl">
                  <Download className="mr-1.5 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredSparks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <span className="text-4xl block mb-3">✨</span>
                  <p className="font-medium">No sparks this month</p>
                </div>
              ) : (
                filteredSparks.map((spark) => {
                  const cat = getCategoryByName(spark.category);
                  return (
                    <div
                      key={spark.id}
                      className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/50 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{spark.giver.name}</span>
                          {" → "}
                          <span className="font-medium">{spark.receiver.name}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{spark.reason}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: cat?.color + "20", color: cat?.color }}
                          >
                            {cat?.emoji} {spark.category}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(spark.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSpark(spark.id)}
                        disabled={deleteLoading === spark.id}
                        className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card className="border-0 warm-card rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-display">All Employees ({employees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-semibold">Name</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Team</th>
                      <th className="pb-3 font-semibold text-right">Total Earned</th>
                      <th className="pb-3 font-semibold text-right">Wallet</th>
                      <th className="pb-3 font-semibold text-right">Given/Mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      return (
                        <tr key={emp.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="py-3 font-medium">{emp.name}</td>
                          <td className="py-3 text-muted-foreground">{emp.email}</td>
                          <td className="py-3">{emp.team}</td>
                          <td className="py-3 text-right font-semibold">{emp.sparks_earned_total}</td>
                          <td className="py-3 text-right">
                            <span className={cn(
                              "font-semibold",
                              emp.current_cycle_sparks >= 25 ? "text-primary" : "text-muted-foreground"
                            )}>
                              {emp.current_cycle_sparks}
                            </span>
                          </td>
                          <td className="py-3 text-right">{emp.sparks_given_this_month}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="border-0 warm-card rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-display">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                <div>
                  <p className="font-semibold text-sm">Reset Monthly Counts</p>
                  <p className="text-[12px] text-muted-foreground">
                    Sets all employees&apos; &quot;sparks_given_this_month&quot; to 0. Use at the start of each month.
                  </p>
                </div>
                <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-xl">
                      <RotateCcw className="mr-1.5 h-4 w-4" /> Reset Monthly
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Monthly Counts</DialogTitle>
                      <DialogDescription>
                        This will set all employees&apos; &quot;sparks_given_this_month&quot; to 0.
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setResetOpen(false)} className="rounded-xl">
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleResetMonthly}
                        disabled={resetLoading}
                        className="rounded-xl"
                      >
                        {resetLoading ? "Resetting..." : "Confirm Reset"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="p-4 rounded-xl bg-accent/50 border border-border/60">
                <p className="font-semibold text-sm mb-3">Milestone Rewards Configuration</p>
                <div className="space-y-2">
                  {[25, 50, 100].map((milestone) => {
                    const reward = MILESTONE_REWARDS[milestone];
                    return (
                      <div key={milestone} className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2">
                          <span>{reward?.emoji}</span>
                          <span className="font-medium">{milestone} Sparks</span>
                        </span>
                        <span className="font-semibold text-primary">{reward?.amountLabel}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  To change rewards, update MILESTONE_REWARDS in constants.ts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Preview Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Template for {selectedClaim?.employee.name}</DialogTitle>
            <DialogDescription>
              Copy this email to send to the employee for their milestone reward.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-accent/50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
            <pre className="text-[13px] whitespace-pre-wrap font-mono">
              {selectedClaim && (() => {
                const reward = MILESTONE_REWARDS[selectedClaim.milestone];
                return generateEmailTemplate(
                  selectedClaim.employee.name,
                  selectedClaim.employee.email,
                  selectedClaim.milestone,
                  reward?.amount || 0,
                  reward?.amountLabel || "",
                  selectedClaim.claimed_at
                );
              })()}
            </pre>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedClaim(null)}
              className="rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedClaim) {
                  handleCopyEmail(selectedClaim);
                }
              }}
              className="rounded-xl bg-gradient-to-r from-primary to-amber-500"
            >
              {copiedEmail === selectedClaim?.id ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" /> Copy Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
