"use client";

import { useState } from "react";
import {
  Menu,
  Search,
  Building2,
  LogOut,
} from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { CommandPalette } from "./command-palette";
import { NotificationBell } from "./notification-bell";
import { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

interface HeaderProps {
  user: SessionUser;
  onMobileMenuToggle: () => void;
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "PROJECT_MANAGER":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "DEVELOPER":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "QA_TESTER":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "DEVOPS":
        return "bg-sky-100 text-sky-700 border-sky-200";
      case "SEO_TEAM":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <>
      <header className="h-16 px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-slate-100">
        {/* Left Section: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Section: Command Palette, Department Tag, Notification Bell, User Session */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Shortcut */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline font-medium">Quick search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Department Pills */}
          {user.departments && user.departments.length > 0 && (
            <div className="hidden xl:flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1">
                {user.departments.map((dept) => (
                  <span
                    key={dept.id}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                    title={dept.name}
                  >
                    {dept.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile Card & Sign Out */}
          <div className="flex items-center gap-2.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200/80 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="hidden sm:flex flex-col min-w-0 pr-1">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]" title={user.name}>
                {user.name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </div>

            <form action={logoutAction} className="shrink-0">
              <button
                type="submit"
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
