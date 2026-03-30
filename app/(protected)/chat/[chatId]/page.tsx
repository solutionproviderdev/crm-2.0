import { getChatMessages } from "@/app/actions/chat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import type { ChatMessage, ChatUser } from "@/lib/types";

/**
 * ChatLoadingSkeleton
 * A simple skeleton for the chat window content
 */
function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-pulse">
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 h-[65px]" />
      <div className="flex-1 px-4 py-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className={`h-12 w-48 rounded-2xl ${i % 2 === 0 ? 'bg-slate-200' : 'bg-slate-100'}`} />
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white p-4 h-[80px]" />
    </div>
  );
}

/**
 * ChatContent
 * The dynamic part of the chat page that fetches user data and messages
 */
async function ChatContent({ chatId }: { chatId: string }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  // Get historical messages
  const msgRes = await getChatMessages(chatId);
  const messages = msgRes.success ? (msgRes.data as unknown as ChatMessage[] || []) : [];

  // Identify who the "other" participant is
  const { data: partData } = await supabase
    .from("chat_participants")
    .select("users(id, name, profile_picture)")
    .eq("chat_id", chatId)
    .neq("user_id", user.id)
    .single();

  const otherUser = partData?.users as unknown as ChatUser;
  if (!otherUser) return notFound();

  return (
    <ChatWindow 
      chatId={chatId} 
      currentUserId={user.id} 
      otherUser={otherUser} 
      initialMessages={messages} 
    />
  );
}

/**
 * ActiveChatPage
 * The entry point which is perfectly static (except for params) to allow PPR
 */
export default async function ActiveChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return (
    <Suspense fallback={<ChatLoadingSkeleton />}>
      <ChatContent chatId={chatId} />
    </Suspense>
  );
}
