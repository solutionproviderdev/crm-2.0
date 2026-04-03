"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { ChatSidebarItem } from "@/lib/types";

import { getMyChats } from "@/app/actions/chat";

export function ChatSidebarList({ initialChats }: { initialChats: ChatSidebarItem[] }) {
  const [chats, setChats] = useState(initialChats);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const supabase = useState(() => createClient())[0];

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  useEffect(() => {
    const channel = supabase
      .channel("schema-messages-sidebar")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async () => {
          const res = await getMyChats();
          if (res.success && res.data) {
            setChats(res.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredChats = chats.filter((chat) => {
    const otherUser = chat.otherUsers?.[0];
    const haystack = [
      otherUser?.name || "",
      chat.latestMessage?.content || "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Search — always visible regardless of chats count */}
      <div className="sticky top-0 z-10 px-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="rounded-xl border-0 bg-white pl-9 shadow-sm ring-1 ring-black/5"
          />
        </div>
      </div>

      {/* Empty state — no chats at all */}
      {chats.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-gray-400">
          <MessageCircle className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">No conversations yet.</p>
          <p className="text-xs mt-1">Start a new chat using the button above.</p>
        </div>
      )}

      {/* Filtered empty state */}
      {chats.length > 0 && filteredChats.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          No conversations match your search.
        </div>
      )}

      <div className="flex flex-col gap-1 overflow-y-auto">
        {filteredChats.map((chat) => {
          const otherUser = chat.otherUsers?.[0];
          if (!otherUser) return null;

          const isActive = pathname === `/chat/${chat.id}`;
          const latestMsg = chat.latestMessage?.content || "Started a chat";
          const preview = chat.latestMessage?.sender_id === otherUser.id ? latestMsg : `You: ${latestMsg}`;
          const dateString = chat.updated_at ? new Date(chat.updated_at) : new Date();

          return (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 transition-all",
                isActive
                  ? "border-[var(--brand-primary)]/15 bg-white shadow-sm"
                  : "border-transparent hover:border-gray-100/50 hover:bg-white hover:shadow-xs"
              )}
            >
              <Avatar className="h-11 w-11 ring-1 ring-[var(--brand-primary)]/10">
                <AvatarImage src={otherUser.profile_picture || undefined} alt={otherUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--brand-primary)] to-[#0a8cb3] text-xs font-bold text-white">
                  {otherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-semibold text-sm text-gray-900 truncate pr-2">
                    {otherUser.name}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {formatDistanceToNow(dateString, { addSuffix: true }).replace("about ", "")}
                  </span>
                </div>
                <p className={cn(
                  "text-xs truncate",
                  chat.isUnread && !isActive ? "text-gray-900 font-bold" : "text-gray-500"
                )}>
                  {preview}
                </p>
              </div>

              {/* Unread badge indicator */}
              {chat.isUnread && !isActive && (
                <div className="shrink-0 h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
