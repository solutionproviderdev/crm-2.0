"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShieldCheck, Building2, ChevronRight, Cpu } from "lucide-react";
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
            name: "AI Providers",
            href: "/settings/ai-providers",
            icon: Cpu,
            description: "OpenAI and model credentials",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#f8fafc]">
      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="w-full lg:w-72 border-r border-gray-100 bg-white lg:h-full p-6 flex flex-col gap-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">Manage your experience</p>
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
                    : "hover:bg-gray-50 text-gray-500 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-gray-200"
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
      <main className="flex-1 min-w-0 bg-gray-50/50 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
