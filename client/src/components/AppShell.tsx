import { Link, useLocation } from "wouter";
import { Moon, Sun, LayoutDashboard, BookOpen, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "./Brand";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const NAV = [
  { href: "/", label: "Exams", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/notes", label: "Study Notes", icon: BookOpen },
];

export function AppShell({ children }: Props) {
  const { theme, toggle } = useTheme();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between">
          <Link href="/" data-testid="link-home" className="hover-elevate rounded-md px-1.5 py-1 -ml-1.5">
            <BrandLockup />
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {NAV.map((n) => {
              const active = location === n.href || (n.href !== "/" && location.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  data-testid={`nav-${n.label.toLowerCase().replace(" ", "-")}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md hover-elevate",
                    active ? "text-primary font-medium" : "text-muted-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            data-testid="button-theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border mt-20">
        <div className="mx-auto max-w-7xl px-5 py-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>Sentry is an independent study tool. CompTIA® and CySA+® are trademarks of CompTIA.</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
