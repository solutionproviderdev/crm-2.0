import { getMyChats, getContactableUsers } from "@/app/actions/chat";
import { ChatShell } from "@/components/chat/ChatShell";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chatsRes, contactsRes] = await Promise.all([
    getMyChats(),
    getContactableUsers()
  ]);

  const chats = chatsRes.success ? (chatsRes.data || []) : [];
  const contacts = contactsRes.success ? (contactsRes.data || []) : [];

  return (
    <ChatShell chats={chats} contacts={contacts}>
      {children}
    </ChatShell>
  );
}
