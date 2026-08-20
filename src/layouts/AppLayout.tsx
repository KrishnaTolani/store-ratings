import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, Store as StoreIcon, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const NAV: Record<Role, Array<{ to: string; label: string }>> = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/stores", label: "Stores" },
  ],
  USER: [
    { to: "/user/stores", label: "Stores" },
    { to: "/user/update-password", label: "Password" },
  ],
  OWNER: [
    { to: "/owner/dashboard", label: "Dashboard" },
    { to: "/owner/update-password", label: "Password" },
  ],
};

const roleLabel: Record<Role, string> = {
  ADMIN: "Administrator",
  USER: "Normal user",
  OWNER: "Store owner",
};

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
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
                    pathname.startsWith(item.to) && "bg-secondary text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="max-w-[180px] truncate text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{roleLabel[user.role]}</p>
              </div>
            )}
            {user && (
              <Badge variant="secondary" className="hidden lg:inline-flex">
                {user.email}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
              <LogOut className="mr-1.5 h-4 w-4" /> Logout
            </Button>
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
              <Button variant="outline" size="sm" className="mt-2 justify-start" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-4 w-4" /> Logout
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
