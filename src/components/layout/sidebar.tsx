"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Inbox,
  UserCheck,
  BookOpen,
  BarChart3,
  FolderKanban,
  Users,
  Settings,
  Layers,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";

interface SidebarProps {
  user: SessionUser;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ user, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navSections = [
    {
      title: "Workspaces",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "All Issues", href: "/issues", icon: AlertCircle },
        { label: "Assigned to Me", href: "/assigned-to-me", icon: Inbox },
        { label: "My Reported Issues", href: "/my-issues", icon: UserCheck },
      ],
    },
    {
      title: "Knowledge Base",
      items: [
        { label: "Technical Solutions", href: "/knowledge-base", icon: BookOpen },
        { label: "RCA & Post-Mortems", href: "/reports", icon: BarChart3 },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Projects", href: "/projects", icon: FolderKanban },
        { label: "Team & Departments", href: "/team", icon: Users },
        {
          label: "System Settings",
          href: "/settings",
          icon: Settings,
          badge: user.role === "ADMIN" ? "Admin" : undefined,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-base tracking-tight">TechIssue</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              HUB
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Issue CRM & Knowledge Base</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar-dark">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
