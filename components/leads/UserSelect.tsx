"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { User } from "@/lib/types";
import { 
  Check, 
  Search, 
  ChevronsUpDown
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface UserSelectProps {
  users: User[];
  value?: string | null;
  onSelect: (userId: string) => void;
  placeholder?: string;
  excludeIds?: string[];
  className?: string;
}

export function UserSelect({ 
  users, 
  value, 
  onSelect, 
  placeholder = "Select team member...", 
  excludeIds = [],
  className 
}: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const isExcluded = excludeIds.includes(u.id);
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                           u.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
                           u.role?.name?.toLowerCase().includes(search.toLowerCase());
      return !isExcluded && matchesSearch;
    });
  }, [users, excludeIds, search]);

  const selectedUser = useMemo(() => {
    return users.find(u => u.id === value);
  }, [users, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-11 justify-between rounded-xl border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm",
            className
          )}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-6 w-6 border border-slate-100">
                <AvatarImage src={selectedUser.profile_picture || ""} />
                <AvatarFallback className="text-[8px] bg-[var(--brand-primary)] text-white font-bold">
                  {selectedUser.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.name}</span>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 rounded-2xl shadow-2xl border-slate-100 bg-white/95 backdrop-blur-md overflow-hidden z-100" 
        align="start" 
        side="top"
        sideOffset={8}
      >
        <div className="p-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search team member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-100 focus:ring-0 focus:border-slate-200 bg-slate-50/50"
            />
          </div>
          <div className="max-h-75 overflow-y-auto custom-scrollbar p-1 space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500 font-medium">
                No team member found.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelect(user.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--brand-primary)]/5 transition-colors group text-left"
                >
                  <Avatar className="h-8 w-8 border border-slate-100 group-hover:scale-110 transition-transform">
                    <AvatarImage src={user.profile_picture || ""} />
                    <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-[var(--brand-primary)] transition-colors truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">
                      {user.department?.name || "No Dept"} • {user.role?.name || "No Role"}
                    </span>
                  </div>
                  {value === user.id && (
                    <Check className="ml-auto h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
