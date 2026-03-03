"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Download, Trash2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getCategoryByName } from "@/lib/constants";
import type { Employee } from "@/types/database";

interface SparkWithNames {
  id: string;
  category: string;
  reason: string;
  created_at: string;
  month_key: string;
  giver: { name: string };
  receiver: { name: string };
}

export function AdminClient({
  employees,
  sparks,
}: {
  employees: Employee[];
  sparks: SparkWithNames[];
}) {
  const router = useRouter();
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

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
    const headers = ["Date", "Giver", "Receiver", "Category", "Reason", "Month"];
    const rows = sparks.map((s) => [
      format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
      s.giver.name,
      s.receiver.name,
      s.category,
      `"${s.reason.replace(/"/g, '""')}"`,
      s.month_key,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sparks-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground text-[15px]">Manage employees, sparks, and monthly resets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
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
                <Button variant="outline" onClick={() => setResetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleResetMonthly}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Resetting..." : "Confirm Reset"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Employees table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employees ({employees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Team</th>
                  <th className="pb-2 font-medium text-right">Earned</th>
                  <th className="pb-2 font-medium text-right">Given/Mo</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{emp.name}</td>
                    <td className="py-2 text-muted-foreground">{emp.email}</td>
                    <td className="py-2">{emp.team}</td>
                    <td className="py-2 text-right">{emp.sparks_earned_total}</td>
                    <td className="py-2 text-right">{emp.sparks_given_this_month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sparks management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Sparks ({sparks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sparks.map((spark) => {
            const cat = getCategoryByName(spark.category);
            return (
              <div
                key={spark.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{spark.giver.name}</span>
                    {" → "}
                    <span className="font-medium">{spark.receiver.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: cat?.color + "20", color: cat?.color }}
                    >
                      {cat?.emoji} {spark.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(spark.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSpark(spark.id)}
                  disabled={deleteLoading === spark.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
