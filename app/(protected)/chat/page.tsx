import { MessagesSquare } from "lucide-react";

export default function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#e6f4f8,transparent_45%),linear-gradient(to_bottom,#ffffff,#f8fafc)] p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[var(--brand-primary)]/10">
        <MessagesSquare className="h-10 w-10 text-[var(--brand-primary)]/35" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">Your inbox is ready</h2>
      <p className="max-w-sm text-sm text-gray-500">
        Open a conversation from the sidebar or start a new message to begin chatting with a teammate.
      </p>
    </div>
  );
}
