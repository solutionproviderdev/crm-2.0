"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, Cpu, GitBranch, Settings2, ShieldCheck, User } from "lucide-react";
import { cn } from "@/utils/cn";
import { useUser } from "@/components/providers/UserProvider";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.type === "Admin";

  const menuItems = [
    {
      name: "Profile",
      href: "/settings/profile",
      icon: User,
      description: "Nickname, avatar, and theme",
    },
    {
      name: "Security",
      href: "/settings/security",
      icon: ShieldCheck,
      description: "Password and verification",
    },
    ...(isAdmin
      ? [
          {
            name: "Company",
            href: "/settings/company",
            icon: Building2,
            description: "Branding and site config",
          },
          {
            name: "Pipeline",
            href: "/settings/pipeline",
            icon: Settings2,
            description: "Stages and statuses",
          },
          {
            name: "Transitions",
            href: "/settings/status-transitions",
            icon: GitBranch,
            description: "Lifecycle rules",
          },
          {
            name: "AI Providers",
            href: "/settings/ai-providers",
            icon: Cpu,
            description: "OpenAI and model credentials",
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-slate-950 lg:flex-row">
      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="flex w-full shrink-0 flex-col gap-8 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 lg:h-full lg:w-72">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Settings</h1>
          <p className="mt-1 text-xs font-bold uppercase leading-none tracking-widest text-slate-400">Manage your experience</p>
        </div>

        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-4 p-3 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-[#046288] text-white shadow-lg shadow-[#046288]/20 translate-x-1"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-900 dark:group-hover:bg-slate-800"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold leading-none">{item.name}</p>
                  <p className={cn(
                    "text-[10px] mt-1 line-clamp-1",
                    isActive ? "text-white/70" : "text-gray-400"
                  )}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "h-3 w-3 transition-transform",
                  isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                )} />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Content Area ──────────────────────────── */}
      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
