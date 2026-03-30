"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { startDirectChat } from "@/app/actions/chat";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { ContactableUser } from "@/lib/types";

export function NewChatDialog({ 
  contacts, 
  children 
}: { 
  contacts: ContactableUser[];
  children?: React.ReactNode; 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = contacts.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleStartChat(targetUserId: string) {
    setLoadingId(targetUserId);
    const result = await startDirectChat(targetUserId);
    if (result.success && result.chatId) {
      setOpen(false);
      router.push(`/chat/${result.chatId}`);
    } else {
      toast.error(result.error || "Failed to start chat");
    }
    setLoadingId(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="icon" variant="ghost" className="h-9 w-9 text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 rounded-full">
             <UserPlus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 bg-[#f8fafc] border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900">New Message</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Pick a colleague to start a direct conversation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 border-b border-gray-100 bg-white sticky top-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search directory..."
              className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm shadow-none focus-visible:ring-[var(--brand-primary)]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto bg-white p-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No employees found.</div>
          )}
          {filtered.map(contact => (
            <button
              key={contact.id}
              onClick={() => handleStartChat(contact.id)}
              disabled={loadingId === contact.id}
              className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-[#f8fafc] rounded-xl transition-all"
            >
              <Avatar className="h-10 w-10 shrink-0 ring-1 ring-[var(--brand-primary)]/10">
                <AvatarImage src={contact.profile_picture || undefined} alt={contact.name} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--brand-primary)] to-[#0a8cb3] text-sm font-bold text-white">
                  {contact.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {contact.name}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {contact.department?.name || "No Dept"}
                </p>
              </div>
              
              {loadingId === contact.id && (
                <div className="h-4 w-4 rounded-full border-2 border-[var(--brand-primary)] border-r-transparent animate-spin" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
