"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { MessageSquareMore } from "lucide-react";
import { ChatSidebarList } from "@/components/chat/ChatSidebarList";
import { NewChatDialog } from "@/components/chat/NewChatDialog";
import { cn } from "@/utils/cn";
import type { ChatSidebarItem, ContactableUser } from "@/lib/types";

export function ChatShell({
  chats,
  contacts,
  children,
}: {
  chats: ChatSidebarItem[];
  contacts: ContactableUser[];
  children: ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const hasActiveChat = Boolean(segment);

  return (
    // h-full fills the <main> height from DashboardShell.
    // overflow-hidden ensures nothing leaks outside the chat frame.
    <div className="flex h-full overflow-hidden bg-[var(--background)]">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      {/* min-h-0 is required so this flex child can shrink in a flex-col parent */}
      <aside
        className={cn(
          "flex shrink-0 flex-col w-full overflow-hidden border-r border-[var(--brand-primary)]/10 bg-[#f8fafc] md:w-80",
          hasActiveChat ? "hidden md:flex" : "flex"
        )}
      >
        {/* Sidebar header — fixed, never scrolls */}
        <div className="shrink-0 border-b border-[var(--brand-primary)]/10 px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
                <MessageSquareMore className="h-5 w-5 text-[var(--brand-primary)]" />
                Messages
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Direct conversations with your team
              </p>
            </div>
            <NewChatDialog contacts={contacts} />
          </div>
        </div>

        {/* Conversation list — only this part scrolls */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-3">
          <ChatSidebarList initialChats={chats} />
        </div>
      </aside>

      {/* ── Inbox Panel ──────────────────────────────────────── */}
      {/* overflow-hidden so the ChatWindow can manage its own scroll */}
      <section
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-white",
          hasActiveChat ? "flex" : "hidden md:flex"
        )}
      >
        {children}
      </section>
    </div>
  );
}
