"use client";

import { NavBar } from "./nav-bar";
import type { Employee } from "@/types/database";

export function AppShell({
  children,
  employee,
}: {
  children: React.ReactNode;
  employee: Employee | null;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar employee={employee} />
      <main className="sm:pl-[240px]">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 pb-24 pt-6 sm:pb-10 sm:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}
