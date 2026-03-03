"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Send, Trophy, Rss, User, Award, Shield, Sparkles } from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee } from "@/types/database";

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
      {/* Desktop sidebar — dark warm stone */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col bg-sidebar z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(224,92,51,0.3)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-display font-bold tracking-tight text-white">
            YAAS Sparks
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 px-3 pt-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-r-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-primary/8 text-white border-l-[3px] border-l-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border-l-[3px] border-l-transparent"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                )}>
                  <Icon className="h-4 w-4 shrink-0" />
                </div>
                <span className={cn(active && "font-semibold")}>{label}</span>
              </Link>
            );
          })}

          {employee?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "group flex items-center gap-3 rounded-r-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                pathname === "/admin"
                  ? "bg-primary/8 text-white border-l-[3px] border-l-primary"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border-l-[3px] border-l-transparent"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-200",
                pathname === "/admin"
                  ? "text-primary"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
              )}>
                <Shield className="h-4 w-4 shrink-0" />
              </div>
              Admin
            </Link>
          )}
        </nav>

        {/* Spark count badge */}
        <div className="px-4 pb-2">
          <div className="rounded-xl bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/20 px-4 py-3">
            <p className="text-[11px] text-sidebar-foreground/50 uppercase tracking-wider font-medium">This cycle</p>
            <p className="text-xl font-display font-bold text-white mt-0.5">{employee?.current_cycle_sparks ?? 0} <span className="text-[13px] font-normal text-sidebar-foreground/40">sparks</span></p>
          </div>
        </div>

        {/* User avatar at bottom */}
        {employee && (
          <div className="border-t border-sidebar-border p-3">
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                pathname.startsWith("/profile")
                  ? "bg-primary/20"
                  : "hover:bg-sidebar-accent"
              )}
            >
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-border">
                <AvatarImage src={employee.avatar_url ?? undefined} />
                <AvatarFallback
                  className="text-xs text-white font-semibold"
                  style={{ backgroundColor: getAvatarColor(employee.name) }}
                >
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate text-sidebar-foreground">{employee.name}</p>
                {employee.team && employee.team !== "General" && <p className="text-[11px] text-sidebar-foreground/40 truncate">{employee.team}</p>}
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md sm:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[15px] font-display font-bold text-foreground">YAAS Sparks</span>
          </Link>
          {employee && (
            <Link href="/profile">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarImage src={employee.avatar_url ?? undefined} />
                <AvatarFallback
                  className="text-xs text-white font-semibold"
                  style={{ backgroundColor: getAvatarColor(employee.name) }}
                >
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </header>

      {/* Bottom mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/80 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-around py-1.5">
          {[...navItems.slice(0, 3), { href: "/milestones", label: "Goals", icon: Award }, { href: "/profile", label: "Profile", icon: User }].map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  active && "bg-primary/10"
                )}>
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                </div>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
