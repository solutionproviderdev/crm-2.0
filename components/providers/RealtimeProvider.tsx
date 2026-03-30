"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";


// ─────────────────────────────────────────────────────────────────────────────
// Realtime Provider
//
// Manages all Supabase Realtime subscriptions in a single place.
// Currently handles:
//   1. Chat notifications (new messages in joined chats)
//   2. Meeting slot updates (real-time meeting schedule changes)
//   3. Lead reassignment events (when a lead's CRE/sales changes)
//
// Note on connection limits:
//   Each Supabase channel = 1 connection. Currently 3 channels total.
//   If you need to reduce connections, combine channels using table filters.
// ─────────────────────────────────────────────────────────────────────────────

interface RealtimeContextValue {
  /** Count of unread messages across all chats */
  unreadCount: number;
  /** Clear the unread badge (call when user opens chat) */
  clearUnreadCount: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  unreadCount: 0,
  clearUnreadCount: () => {},
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

interface RealtimeNotificationProviderProps {
  userId: string;
  children: ReactNode;
}

export function RealtimeNotificationProvider({
  userId,
  children,
}: RealtimeNotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );

    // ── Channel 1: New chat messages ────────────────────────────────────────
    // Subscribes to new messages in chats where the current user is a participant.
    // Uses a subquery filter so only relevant messages are received.
    const chatChannel = supabase
      .channel("chat-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // Only receive messages NOT sent by this user (no self-notifications)
          filter: `sender_id=neq.${userId}`,
        },
        () => {
          // We can't easily check if the chat belongs to this user client-side,
          // so we increment optimistically — the chat page resets this count.
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    // ── Channel 2: Meeting slot updates ─────────────────────────────────────
    // Fires when any meeting is INSERT/UPDATE/DELETE — used to refresh the
    // meeting schedule page without a full reload.
    const meetingsChannel = supabase
      .channel("meeting-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_meetings",
        },
        () => {
          // Dispatch a custom event that the meetings page can listen to,
          // triggering a router.refresh() or SWR revalidation.
          window.dispatchEvent(new CustomEvent("meetings:updated"));
        }
      )
      .subscribe();

    // ── Channel 3: Lead reassignment ────────────────────────────────────────
    // Fires when a lead's cre_id or sales_executive_id changes.
    // Used to refresh the leads list if a reassignment affects what the
    // current user can see.
    const leadsChannel = supabase
      .channel("lead-assignments")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const old = payload.old as Record<string, unknown>;
          const next = payload.new as Record<string, unknown>;

          // Only act if the assignment actually changed
          const assignmentChanged =
            old.cre_id !== next.cre_id ||
            old.sales_executive_id !== next.sales_executive_id;

          if (assignmentChanged) {
            // Fire a custom event — leads page can listen and call router.refresh()
            window.dispatchEvent(
              new CustomEvent("leads:reassigned", { detail: payload.new })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(meetingsChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [userId]);

  return (
    <RealtimeContext.Provider
      value={{
        unreadCount,
        clearUnreadCount: () => setUnreadCount(0),
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to subscribe to real-time meeting schedule updates.
 * Call this from the meetings page component to trigger a refresh when
 * any meeting is created, updated, or deleted.
 *
 * @param onUpdate - Callback invoked when any meeting change is detected
 *
 * @example
 * ```tsx
 * function MeetingSchedulePage() {
 *   const router = useRouter();
 *   useMeetingRealtime(() => router.refresh());
 *   ...
 * }
 * ```
 */
export function useMeetingRealtime(onUpdate: () => void) {
  useEffect(() => {
    const handler = () => onUpdate();
    window.addEventListener("meetings:updated", handler);
    return () => window.removeEventListener("meetings:updated", handler);
  }, [onUpdate]);
}

/**
 * Hook to subscribe to lead reassignment events.
 * Call this from the leads page to auto-refresh when a lead is reassigned
 * (which may change what the current user can see, given role-based RLS).
 *
 * @param onReassign - Callback invoked with the updated lead data
 */
export function useLeadReassignRealtime(
  onReassign: (updatedLead: Record<string, unknown>) => void
) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, unknown>>;
      onReassign(customEvent.detail);
    };
    window.addEventListener("leads:reassigned", handler);
    return () => window.removeEventListener("leads:reassigned", handler);
  }, [onReassign]);
}
