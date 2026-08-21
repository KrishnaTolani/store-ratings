import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, Store as StoreIcon, UserRound, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const NAV: Record<Role, Array<{ to: string; label: string }>> = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/stores", label: "Stores" },
  ],
  USER: [{ to: "/user/stores", label: "Stores" }],
  OWNER: [
    { to: "/owner/dashboard", label: "Dashboard" },
    { to: "/profile", label: "My Profile" },
  ],
};

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const items = user ? NAV[user.role] : [];

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", replace: true });
  };

  const accountMenu = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex max-w-[220px] items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          <span className="truncate">{shortName(user.name)}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal text-muted-foreground">Account</DropdownMenuLabel>
        {user.role === "USER" && (
          <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
            <UserRound className="mr-2 h-4 w-4" />
            My profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-float">
                <StoreIcon className="h-4.5 w-4.5 text-primary-foreground" />
              </span>
              <span className="text-base font-bold tracking-tight">Store Ratings</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                    (item.to === "/profile" ? pathname === item.to : pathname.startsWith(item.to)) &&
                    "bg-secondary text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            {accountMenu}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              {user?.role === "USER" && (
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: "/profile" });
                  }}
                >
                  My profile
                </button>
              )}
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-secondary"
                onClick={handleLogout}
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
