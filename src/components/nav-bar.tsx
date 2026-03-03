"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Send, Trophy, Rss, User, Award, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee } from "@/types/database";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/give", label: "Give a Spark", icon: Send },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/milestones", label: "Milestones", icon: Award },
];

export function NavBar({ employee }: { employee: Employee | null }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col border-r border-sidebar-border bg-sidebar z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
          <span className="text-2xl leading-none">🌟</span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">YAAS Sparks</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}

          {employee?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                pathname === "/admin"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Admin
            </Link>
          )}
        </nav>

        {/* User avatar at bottom */}
        {employee && (
          <div className="border-t border-sidebar-border p-3">
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                pathname.startsWith("/profile")
                  ? "bg-primary/10"
                  : "hover:bg-sidebar-accent"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={employee.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{employee.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{employee.team}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm sm:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🌟</span>
            <span className="text-[15px] font-semibold text-primary">YAAS Sparks</span>
          </Link>
          {employee && (
            <Link href="/profile">
              <Avatar className="h-8 w-8">
                <AvatarImage src={employee.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </header>

      {/* Bottom mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 backdrop-blur-sm sm:hidden">
        <div className="flex items-center justify-around py-1.5">
          {[...navItems.slice(0, 3), { href: "/milestones", label: "Goals", icon: Award }, { href: "/profile", label: "Profile", icon: User }].map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
