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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              OSS Contributor
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <GitPullRequest className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">OSS Contributor</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4 justify-end">
          <ThemeToggle />
        </div>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}