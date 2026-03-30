'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Bell, MessagesSquare, CalendarDays } from 'lucide-react';
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
	icon: React.ElementType;
}

// All possible nav items - Global level
const ALL_NAV_ITEMS: NavItem[] = [
	{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ name: 'Leads', href: '/leads', icon: Users },
	{ name: 'Reminders', href: '/reminders', icon: Bell },
	{ name: 'Meetings', href: '/meetings/slots', icon: CalendarDays },
	{ name: 'Users', href: '/users', icon: Users },
	{ name: 'Chat', href: '/chat', icon: MessagesSquare },
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

	// Filter nav items based on role permissions
	const visibleNavItems = ALL_NAV_ITEMS.filter(item => {
		if (item.href === '/dashboard') return true;
		return isRouteAllowed(item.href, permissions, isAdmin);
	});

	async function handleLogout() {
		setIsLoggingOut(true);
		await logout();
	}

	return (
		<div className="flex flex-col min-h-screen bg-[#f8fafc] w-full">
			{/* ── Top Navbar ─────────────────────────────── */}
			<TopNavbar
				user={user}
        settings={settings}
				navItems={visibleNavItems}
				onLogout={handleLogout}
				isLoggingOut={isLoggingOut}
			/>

			{/* ── Main content ────────────────────────────── */}
			<div className="flex flex-1 flex-col w-full">
				<UserProvider initialUser={user}>
					{/* Page content */}
					<main className="flex-1 w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
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
