"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/lib/types";
import type { PermissionMap } from "@/lib/permissions";
import { isRouteAllowed } from "@/lib/permissions";

const MODULE_NAV_ITEMS = [
  { name: "Map Data", href: "/utility/map", icon: Map },
];

function SidebarSkeleton() {
  return (
    <div className="w-full md:w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="h-3 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <nav className="p-2 space-y-1">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-xl bg-gray-100 animate-pulse"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </nav>
    </div>
  );
}

export default function UtilityModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useState(() => createClient())[0];

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("*, role:roles(*)")
          .eq("id", session.user.id)
          .single();
        setUser(data);
      }
      setLoading(false);
    }
    fetchUser();
  }, [supabase]);

  const isAdmin = user?.type === "Admin";
  const permissions = (user?.role?.permissions ?? {}) as PermissionMap;

  const visibleItems = loading
    ? MODULE_NAV_ITEMS
    : MODULE_NAV_ITEMS.filter((item) =>
        isRouteAllowed(item.href, permissions, isAdmin)
      );

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* ── Local Sidebar ──────────────────────────── */}
      {loading ? (
        <SidebarSkeleton />
      ) : (
        <aside className="w-full md:w-64 shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
          <div className="sticky top-0 z-10 px-4 py-4 border-b border-gray-100 bg-white">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Utility
            </h3>
          </div>
          <nav className="p-2 space-y-0.5">
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between group px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-5 w-0.5 rounded-full transition-all duration-150 shrink-0",
                        isActive ? "bg-[var(--brand-primary)]" : "bg-transparent"
                      )}
                    />
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-[var(--brand-primary)]"
                          : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* ── Content Area ───────────────────────────── */}
      <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-hidden flex flex-col bg-[#f8fafc] h-[calc(100vh-64px)]">
        {children}
      </div>
    </div>
  );
}
