'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { UserMenu } from './UserMenu';
import type { User, SiteSettings } from '@/lib/types';

interface NavItem {
	name: string;
	href: string;
	icon: React.ElementType;
	tooltip?: string;
}

interface TopNavbarProps {
	user: User;
	settings: SiteSettings;
	navItems: NavItem[];
	onLogout: () => Promise<void>;
	isLoggingOut: boolean;
}

export function TopNavbar({
	user,
	settings,
	navItems,
	onLogout,
	isLoggingOut,
}: TopNavbarProps) {
	const pathname = usePathname();

	return (
		<nav className="bg-[var(--brand-primary)] text-white h-16 flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
			{/* ── Left: Logo ────────────────────────────── */}
			<div className="flex items-center gap-4">
				<Link href="/dashboard" className="flex items-center gap-2">
					{settings.brand_logo_url ? (
						<img
							src={settings.brand_logo_url}
							alt={settings.company_name}
							className="h-8 w-auto object-contain"
						/>
					) : (
						<div className="flex h-8 w-8 items-center justify-center rounded bg-white/20">
							<span className="text-xs font-black text-white">
								{settings.company_name
									.split(' ')
									.map(n => n[0])
									.join('')
									.slice(0, 2)
									.toUpperCase()}
							</span>
						</div>
					)}
					<span className="font-bold text-white tracking-tight hidden sm:inline-block">
						{settings.company_name}
						{/* <span className="font-normal opacity-80 text-xs">CRM 2.0</span> */}
					</span>
				</Link>

				{/* Divider */}
				<div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

				{/* ── Center: Nav Items ────────────────────── */}
				<div className="flex items-center gap-1">
					{navItems.map(item => {
						const isActive =
							item.href === '/dashboard'
								? pathname === '/dashboard'
								: pathname.startsWith(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								title={item.name}
								className={cn(
									'p-2.5 rounded-full transition-all duration-200 group relative',
									isActive
										? 'bg-[var(--brand-secondary)] text-white shadow-inner'
										: 'hover:bg-white/10 text-white/80 hover:text-white',
								)}
							>
								<item.icon className="h-5 w-5" />
								{/* Active Indicator Dot */}
								{isActive && (
									<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white shadow-sm" />
								)}
							</Link>
						);
					})}
				</div>
			</div>

			{/* ── Right: User & Actions ─────────────────── */}
			<div className="flex items-center gap-3">
				{/* Global Search */}
				<div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-sm text-white/60 w-48 hover:bg-white/15 transition-colors cursor-pointer">
					<Search className="h-3.5 w-3.5" />
					<span>Search...</span>
				</div>

				{/* Notifications */}
				<button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
					<Bell className="h-5 w-5" />
					<span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--brand-primary)]" />
				</button>

				{/* User Menu Dropdown */}
				<UserMenu user={user} onLogout={onLogout} isLoggingOut={isLoggingOut} />
			</div>
		</nav>
	);
}
