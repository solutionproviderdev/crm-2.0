'use client';

import React from 'react';
import { Sidebar, type NavItem } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
	children: React.ReactNode;
	navItems: NavItem[];
	role: string;
}

export function DashboardLayout({
	children,
	navItems,
	role,
}: DashboardLayoutProps) {
	return (
		<div className="flex min-h-screen w-full flex-col bg-muted/20 md:flex-row">
			{/* Desktop Sidebar */}
			<div className="hidden md:flex">
				<Sidebar navItems={navItems} role={role} />
			</div>

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col">
				<Header />

				<main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
					<div className="mx-auto   h-full">{children}</div>
				</main>
			</div>
		</div>
	);
}
