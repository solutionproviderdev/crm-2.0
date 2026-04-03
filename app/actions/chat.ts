"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ChatSidebarItem, ChatUser, ContactableUser } from "@/lib/types";

interface ChatParticipantRow {
  user: ChatUser | null;
}

interface ChatMessageRow {
  content: string;
  created_at: string;
  sender_id: string;
}

interface ChatListRow {
  chat_id: string;
  last_read_at: string | null;
  chats: {
    id: string;
    type: string;
    updated_at: string;
    messages: ChatMessageRow[];
    participants: ChatParticipantRow[];
  };
}

interface DirectChatLookupRow {
  chat_id: string;
  chats: {
    id: string;
    type: string;
    participants: Array<{ user_id: string }>;
  };
}

/**
 * Fetches all users (to start a new chat)
 */
export async function getContactableUsers() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("users")
    .select("id, name, department:departments(name), profile_picture")
    .neq("id", user.id)
    .order("name");

  if (error) {
    console.error("fetchContactableUsers error:", error.message);
    return { success: false, error: error.message };
  }
  const parsedData = (data || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    profile_picture: u.profile_picture,
    department: Array.isArray(u.department) ? u.department[0] : u.department
  }));

  return { success: true, data: parsedData as unknown as ContactableUser[] };
}

/**
 * Fetches all chats the current user is a participant of.
 */
export async function getMyChats() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("chat_participants")
    .select(`
      chat_id,
      last_read_at,
      chats!inner(
        id,
        type,
        updated_at,
        messages(
          content,
          created_at,
          sender_id
        ),
        participants:chat_participants(
          user:users(id, name, profile_picture)
        )
      )
    `)
    .eq("user_id", user.id)
    .order("chats(updated_at)", { ascending: false });

  if (error) return { success: false, error: error.message };

  // Transform data to make it easier to digest on frontend
  const formattedChats: ChatSidebarItem[] = ((data || []) as unknown as ChatListRow[]).map((cp) => {
    // Other participants in the chat
    const others = cp.chats.participants
      .filter((participant) => participant.user?.id !== user.id)
      .map((participant) => participant.user)
      .filter((participant): participant is ChatUser => Boolean(participant));

    // Get the latest message (Supabase nested arrays)
    const sortedMessages = cp.chats.messages.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;

    // Check if unread (if message created after my last_read_at)
    let isUnread = false;
    if (latestMessage && cp.last_read_at) {
      isUnread = new Date(latestMessage.created_at) > new Date(cp.last_read_at);
    } else if (latestMessage && !cp.last_read_at) {
      isUnread = true; // Never read
    }

    return {
      id: cp.chat_id,
      type: cp.chats.type,
      updated_at: cp.chats.updated_at,
      otherUsers: others,
      latestMessage,
      isUnread,
    };
  });

  // Re-sort in JS just to be absolutely sure since nested ordering can be tricky
  formattedChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return { success: true, data: formattedChats };
}

/**
 * Ensures a direct chat exists between current user and target user.
 * Returns the chat ID.
 */
export async function startDirectChat(targetUserId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 1. Check if a direct chat already exists between these two
  const { data: existingChats, error: checkErr } = await supabase
    .rpc('get_direct_chat_id', { user_a: user.id, user_b: targetUserId });

  if (!checkErr && existingChats) {
    const rpcChatId = Array.isArray(existingChats) ? existingChats[0] : existingChats;
    if (typeof rpcChatId === "string" && rpcChatId) {
      return { success: true, chatId: rpcChatId };
    }
  }

  // Fallback if the RPC is unavailable: find an exact direct chat between these two users.
  const { data: myDirectChats, error: myDirectChatsError } = await supabase
    .from("chat_participants")
    .select(`
      chat_id,
      chats!inner(
        id,
        type,
        participants:chat_participants(user_id)
      )
    `)
    .eq("user_id", user.id)
    .eq("chats.type", "direct");

  if (myDirectChatsError) {
    return { success: false, error: myDirectChatsError.message };
  }

  const existingDirectChat = (myDirectChats as unknown as DirectChatLookupRow[] | null)?.find((entry) => {
    const participants = entry.chats?.participants?.map((participant) => participant.user_id) || [];
    return participants.length === 2 && participants.includes(user.id) && participants.includes(targetUserId);
  });

  if (existingDirectChat?.chat_id) {
    return { success: true, chatId: existingDirectChat.chat_id };
  }

  // 2. Doesn't exist, create it (Using admin client to bypass the chicken-and-egg RLS problem)
  const adminClient = createAdminClient();
  const { data: newChat, error: chatErr } = await adminClient
    .from("chats")
    .insert({ type: 'direct' })
    .select("id")
    .single();

  if (chatErr || !newChat) {
    console.error("Chats insert error:", chatErr);
    return { success: false, error: chatErr?.message || "Failed to create chat" };
  }

  // 3. Add participants
  const { error: partErr } = await adminClient
    .from("chat_participants")
    .insert([
      { chat_id: newChat.id, user_id: user.id },
      { chat_id: newChat.id, user_id: targetUserId }
    ]);

  if (partErr) return { success: false, error: partErr.message };

  revalidatePath("/chat");
  return { success: true, chatId: newChat.id };
}

/**
 * Sends a message in a specific chat
 */
export async function sendMessage(chatId: string, content: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const trimmedContent = content.trim();
  if (!trimmedContent) return { success: false, error: "Message cannot be empty" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: user.id,
      content: trimmedContent
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Bump the chat's updated_at timestamp so it jumps to top
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  // Update my own read receipt so I don't see my own msg as unread
  await markChatAsRead(chatId);

  revalidatePath(`/chat`);
  return { success: true, data };
}

/**
 * Fetch historical messages for a chat room
 */
export async function getChatMessages(chatId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("messages")
    .select("id, content, created_at, sender:users(id, name, profile_picture)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) return { success: false, error: error.message };

  return { success: true, data };
}

/**
 * Update my last_read_at for this chat
 */
export async function markChatAsRead(chatId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("chat_participants")
    .update({ last_read_at: new Date().toISOString() })
    .match({ chat_id: chatId, user_id: user.id });

  revalidatePath("/chat");
}
