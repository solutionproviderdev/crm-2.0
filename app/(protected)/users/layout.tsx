"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  Building2, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/lib/types";
import type { PermissionMap } from "@/lib/permissions";
import { isRouteAllowed } from "@/lib/permissions";

const MODULE_NAV_ITEMS = [
  { name: "All Users",   href: "/users",             icon: Users },
  { name: "Create User", href: "/users/new",         icon: UserPlus },
  { name: "Departments", href: "/users/departments", icon: Building2 },
  { name: "Roles",       href: "/users/roles",       icon: ShieldCheck },
];

export default function UserModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from("users")
          .select("*, role:roles(*)")
          .eq("id", authUser.id)
          .single();
        setUser(data);
      }
    }
    fetchUser();
  }, [supabase]);

  if (!user) return null;

  const isAdmin = user.type === "Admin";
  const permissions = (user.role?.permissions ?? {}) as PermissionMap;

  // Filter local nav items
  const visibleItems = MODULE_NAV_ITEMS.filter((item) => 
    isRouteAllowed(item.href, permissions, isAdmin)
  );

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* ── Local Sidebar ──────────────────────────── */}
      <aside className="w-full md:w-64 shrink-0 bg-white border-r border-[#046288]/10 overflow-y-auto">
        <div className="sticky top-0 sticky-top z-10 px-4 py-4 border-b border-[#046288]/10 bg-white">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            User Module
          </h3>
        </div>
          <nav className="p-2 space-y-1">
            {visibleItems.map((item) => {
              const isActive = item.href === "/users" 
                ? pathname === "/users" 
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between group px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#046288]/10 text-[#046288]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-[#046288]" : "text-gray-400 group-hover:text-gray-600"
                    )} />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3" />}
                </Link>
              );
            })}
          </nav>
      </aside>

      {/* ── Content Area ───────────────────────────── */}
      <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto bg-[#f8fafc] h-[calc(100vh-4rem)]">
        {children}
      </div>
    </div>
  );
}
