'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Bell, CalendarDays, Columns3, Inbox, LayoutDashboard, MessagesSquare, Settings, Users } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import type { User } from '@/lib/types';
import type { PermissionMap } from '@/lib/permissions';
import { isRouteAllowed } from '@/lib/permissions';
import { TopNavbar } from './TopNavbar';
import { UserProvider } from '@/components/providers/UserProvider';
import type { SiteSettings } from '@/lib/types';

interface NavItem {
	name: string;
	href: string;
	alternateHrefs?: string[];
	icon: React.ElementType;
}

const ALL_NAV_ITEMS: NavItem[] = [
	{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ name: 'Workspace', href: '/workspace/inbox', alternateHrefs: ['/workspace'], icon: Inbox },
	{ name: 'Pipeline', href: '/pipeline/leads', alternateHrefs: ['/pipeline', '/clients', '/projects'], icon: Columns3 },
	{ name: 'Leads', href: '/leads', alternateHrefs: [], icon: Users },
	{ name: 'Reminders', href: '/reminders', icon: Bell },
	{ name: 'Calendar', href: '/calendar', alternateHrefs: ['/meetings', '/meetings/slots'], icon: CalendarDays },
	{ name: 'Reports', href: '/reports', alternateHrefs: ['/reports/lifecycle', '/reports/conversion'], icon: BarChart3 },
	{ name: 'Users', href: '/users', alternateHrefs: ['/users/departments', '/users/roles'], icon: Users },
	{ name: 'Chat', href: '/chat', icon: MessagesSquare },
	{ name: 'Settings', href: '/settings/profile', alternateHrefs: ['/settings'], icon: Settings },
];

interface Props {
	user: User;
  settings: SiteSettings;
	children: React.ReactNode;
}

export function DashboardShell({ user, settings, children }: Props) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [accessDeniedToast, setAccessDeniedToast] = useState(false);

	const isAdmin = user.type === 'Admin';
	const permissions = (user.role?.permissions ?? {}) as PermissionMap;

	// Show access-denied toast when redirected by middleware
	useEffect(() => {
		if (searchParams.get('access_denied')) {
			// Use requestAnimationFrame to avoid "cascading renders" warning
			requestAnimationFrame(() => {
				setAccessDeniedToast(true);
			});

			const t = setTimeout(() => setAccessDeniedToast(false), 4000);
			const url = new URL(window.location.href);
			url.searchParams.delete('access_denied');
			router.replace(url.pathname);
			return () => clearTimeout(t);
		}
	}, [searchParams, router]);

	// Filter nav items based on role permissions.
	// PUBLIC items (Dashboard, Chat, Reminders) always show.
	// All other items require at least one matching permission.
	const ALWAYS_VISIBLE = new Set(['Dashboard', 'Workspace', 'Pipeline', 'Reminders', 'Calendar', 'Chat']);

	const visibleNavItems = ALL_NAV_ITEMS.map(item => {
		// Always visible items — no permission required
		if (ALWAYS_VISIBLE.has(item.name)) return item;
		// Admins see everything
		if (isAdmin) return item;

		// Check if any of this item's routes is permitted
		const hrefsToCheck = [item.href, ...(item.alternateHrefs || [])];
		const firstAllowed = hrefsToCheck.find(h => isRouteAllowed(h, permissions, false));
		if (firstAllowed) return { ...item, href: firstAllowed };
		return null;
	}).filter(Boolean) as NavItem[];

	async function handleLogout() {
		setIsLoggingOut(true);
		await logout();
	}

	return (
		<div className="flex flex-col h-dvh overflow-hidden bg-background text-foreground w-full">
			{/* ── Top Navbar ─────────────────────────────── */}
			<TopNavbar
				user={user}
        settings={settings}
				navItems={visibleNavItems}
				onLogout={handleLogout}
				isLoggingOut={isLoggingOut}
			/>

			{/* ── Main content ────────────────────────────── */}
			<div className="flex flex-1 min-h-0 flex-col w-full">
				<UserProvider initialUser={user}>
					{/* Page content */}
					<main className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto">
						{children}
					</main>
				</UserProvider>
			</div>

			{/* Access denied toast */}
			{accessDeniedToast && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl animate-slide-up">
					<span className="text-red-400">🚫</span>
					You don&apos;t have permission to access that page
				</div>
			)}

			<style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translate(-50%, 1rem); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
		</div>
	);
}
