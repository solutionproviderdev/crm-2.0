"use client";

import Link from "next/link";
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Moon,
  Sun,
  Laptop
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/types";

interface UserMenuProps {
  user: User;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
}

export function UserMenu({ user, onLogout, isLoggingOut }: UserMenuProps) {
  const { theme, setTheme } = useTheme();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 pl-2 border-l border-white/10 group focus:outline-none">
          <Avatar className="h-8 w-8 rounded bg-white/10 object-cover ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
            <AvatarImage src={user.profile_picture || ""} alt={user.name} />
            <AvatarFallback className="bg-[var(--brand-secondary)] text-white text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold leading-none text-white">{user.name}</p>
            <p className="text-[10px] opacity-60 mt-0.5 text-white">{user.type}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 rounded-2xl shadow-2xl border-gray-100 p-2" align="end">
        <DropdownMenuLabel className="font-bold text-xs text-gray-400 uppercase tracking-widest px-3 py-2">
          Manage Account
        </DropdownMenuLabel>
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuItem asChild>
            <Link href={`/users/${user.id}`} className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-[var(--brand-primary)]/5 focus:text-[var(--brand-primary)] transition-all">
              <UserIcon className="mr-3 h-4 w-4" />
              <span className="font-bold text-sm">My Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-[var(--brand-primary)]/5 focus:text-[var(--brand-primary)] transition-all">
              <Settings className="mr-3 h-4 w-4" />
              <span className="font-bold text-sm">Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-2 bg-gray-50" />
        
        <DropdownMenuLabel className="font-bold text-xs text-gray-400 uppercase tracking-widest px-3 py-2">
          Theme Preference
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 p-1">
          <button 
            onClick={() => setTheme("light")}
            className={`p-2 flex flex-col items-center gap-1 rounded-xl transition-all ${theme === 'light' ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Sun className="h-4 w-4" />
            <span className="text-[10px] font-bold">Light</span>
          </button>
          <button 
            onClick={() => setTheme("dark")}
            className={`p-2 flex flex-col items-center gap-1 rounded-xl transition-all ${theme === 'dark' ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Moon className="h-4 w-4" />
            <span className="text-[10px] font-bold">Dark</span>
          </button>
          <button 
            onClick={() => setTheme("system")}
            className={`p-2 flex flex-col items-center gap-1 rounded-xl transition-all ${theme === 'system' ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Laptop className="h-4 w-4" />
            <span className="text-[10px] font-bold">Sys</span>
          </button>
        </div>

        <DropdownMenuSeparator className="my-2 bg-gray-50" />
        
        <DropdownMenuItem 
          onClick={onLogout}
          disabled={isLoggingOut}
          className="rounded-xl px-3 py-2.5 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 transition-all"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-bold text-sm">{isLoggingOut ? 'Logging out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
