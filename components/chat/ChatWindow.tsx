"use client";

import { KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { markChatAsRead, sendMessage } from "@/app/actions/chat";
import { ArrowLeft, Send } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ChatMessage, ChatUser } from "@/lib/types";
import { SENTINEL_USER_ID } from "@/constants/system";

export function ChatWindow({
  chatId,
  currentUserId,
  otherUser,
  initialMessages
}: {
  chatId: string;
  currentUserId: string;
  otherUser: ChatUser;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = useState(() => createClient())[0];
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
    void markChatAsRead(chatId);
  }, [chatId]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [inputText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat_room_${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; content: string; created_at: string; sender_id: string };
          const { data: senderObj } = await supabase
            .from("users")
            .select("id, name, profile_picture")
            .eq("id", newMsg.sender_id)
            .single();

          if (senderObj) {
            setMessages((prev) => {
              if (prev.some((message) => message.id === newMsg.id)) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: newMsg.id,
                  content: newMsg.content,
                  created_at: newMsg.created_at,
                  sender: senderObj,
                },
              ];
            });

            if (senderObj.id !== currentUserId) {
              void markChatAsRead(chatId);
            }

            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId, router, supabase]);

  function sendCurrentMessage() {
    if (!inputText.trim() || isPending) return;

    const msg = inputText;
    setInputText("");

    startTransition(async () => {
      const result = await sendMessage(chatId, msg);
      if (!result.success) {
        setInputText(msg);
        toast.error(result.error || "Failed to send message");
      }
    });
  }

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    sendCurrentMessage();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendCurrentMessage();
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-[var(--brand-primary)]/10 bg-white px-4 py-3 shadow-sm z-10 relative md:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => router.push("/chat")}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 ring-1 ring-[var(--brand-primary)]/10">
            <AvatarImage src={otherUser?.profile_picture || undefined} alt={otherUser?.name || "Chat participant"} />
            <AvatarFallback className="bg-gradient-to-br from-[var(--brand-primary)] to-[#0a8cb3] text-xs font-bold text-white">
              {otherUser?.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-bold text-gray-900">{otherUser.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Direct conversation
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages View ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {/* Empty state for fresh conversations */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[var(--brand-primary)]/10">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.profile_picture || undefined} alt={otherUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--brand-primary)] to-[#0a8cb3] text-sm font-bold text-white">
                  {otherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h3 className="text-base font-semibold text-gray-900">{otherUser.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              This is the beginning of your conversation. Say hello! 👋
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isSentinel = msg.sender.id === SENTINEL_USER_ID;
          const isMe = msg.sender.id === currentUserId;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isThread = prevMsg?.sender.id === msg.sender.id && isSameDay(new Date(prevMsg.created_at), new Date(msg.created_at));
          const showDayDivider = !prevMsg || !isSameDay(new Date(prevMsg.created_at), new Date(msg.created_at));

          return (
            <div key={msg.id}>
              {showDayDivider && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
                    {format(new Date(msg.created_at), "MMM d")}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              )}

              <div
                className={cn(
                  "flex w-full items-end gap-2",
                  isMe ? "justify-end" : "justify-start",
                  isThread ? "mt-1" : "mt-4"
                )}
              >
                {!isMe && !isThread && (
                  <Avatar className={cn("h-7 w-7 self-end ring-1", isSentinel ? "ring-gray-200 opacity-50 grayscale" : "ring-[var(--brand-primary)]/10")}>
                    <AvatarImage src={msg.sender.profile_picture || undefined} alt={msg.sender.name} />
                    <AvatarFallback className={cn("text-[10px] font-bold text-white", isSentinel ? "bg-gray-400" : "bg-gradient-to-br from-[var(--brand-primary)] to-[#0a8cb3]")}>
                      {isSentinel ? "👻" : msg.sender.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isMe && isThread && <div className="w-7 shrink-0" />}

                <div
                  className={cn(
                    "flex max-w-[85%] flex-col sm:max-w-[65%]",
                    isMe ? "items-end" : "items-start"
                  )}
                >
                  {!isMe && !isThread && (
                    <span className={cn("mb-1 px-1 text-[11px] font-semibold", isSentinel ? "text-gray-400 italic" : "text-gray-500")}>
                      {isSentinel ? "[Deleted User]" : msg.sender.name}
                    </span>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                      isMe
                        ? "rounded-br-sm bg-[var(--brand-primary)] text-white"
                        : "rounded-bl-sm border border-[var(--brand-primary)]/10 bg-white text-gray-800"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>

                  <span className="mt-1 px-1 text-[11px] text-gray-400">
                    {format(new Date(msg.created_at), "h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-6" />
      </div>

      {/* ── Input Area ── */}
      <div className="shrink-0 border-t border-[var(--brand-primary)]/10 bg-white p-4 z-10 relative">
        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-4xl items-end gap-3"
        >
          <Textarea
            ref={textareaRef}
            placeholder="Write a message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            disabled={isPending}
            rows={1}
            className="max-h-40 min-h-12 rounded-3xl border-gray-200 bg-[#f8fafc] px-5 py-3 text-[15px] shadow-none focus-visible:ring-[var(--brand-primary)]/20"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || isPending}
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full bg-[var(--brand-primary)] text-white shadow-md hover:opacity-90"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-4xl px-2 text-xs text-gray-400">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

