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
    <div className="flex flex-1 min-h-0 bg-[var(--background)]">
      <aside
        className={cn(
          "min-h-0 w-full shrink-0 border-r border-[var(--brand-primary)]/10 bg-[#f8fafc] md:flex md:w-80 md:flex-col",
          hasActiveChat ? "hidden md:flex" : "flex flex-col"
        )}
      >
        <div className="flex-none border-b border-[var(--brand-primary)]/10 px-4 py-4">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-3">
          <ChatSidebarList initialChats={chats} />
        </div>
      </aside>

      <section
        className={cn(
          "min-h-0 flex-1 flex-col bg-white md:flex",
          hasActiveChat ? "flex" : "hidden md:flex"
        )}
      >
        {children}
      </section>
    </div>
  );
}
