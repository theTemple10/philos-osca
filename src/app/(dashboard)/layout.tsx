"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitPullRequest,
  Search,
  Settings,
  LogOut,
  Clock,
  Menu,
  X,
  Heart,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Discover", href: "/repos", icon: Search },
  { name: "Contribute", href: "/contribute", icon: GitPullRequest },
  { name: "History", href: "/history", icon: Clock },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ease-in-out",
          "bg-[var(--bg-sidebar)] border-r border-[var(--border-soft)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-soft)]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <GitPullRequest className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-[var(--fg-primary)] tracking-tight">
              OSS Contributor
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[var(--accent-light)] text-[var(--accent)] shadow-sm"
                    : "text-[var(--fg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-[var(--accent)]")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-[var(--border-soft)]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full ring-2 ring-[var(--border-soft)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--accent)]">
                  {session?.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--fg-primary)] truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-[var(--fg-muted)] truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-[var(--fg-muted)] hover:text-[var(--color-danger)] transition-colors p-1 rounded-md hover:bg-[var(--color-danger-bg)]"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-soft)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--accent)] rounded flex items-center justify-center">
              <GitPullRequest className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[var(--fg-primary)]">OSS Contributor</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-soft)] px-8 py-3 items-center justify-between">
          <div className="text-sm text-[var(--fg-muted)]">
            Built with <Heart className="w-3.5 h-3.5 inline text-[var(--color-danger)] fill-current" /> for open source
          </div>
          <ThemeToggle />
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
