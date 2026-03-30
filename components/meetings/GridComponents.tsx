"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { LeadMeeting } from "@/lib/types";
import { cn } from "@/utils/cn";
import { Clock, ExternalLink, Phone } from "lucide-react";

import Link from "next/link";
import { MeetingStatusMenu } from "./MeetingStatusMenu";

// ── Status color system (inspired by old repo) ──────────────────
export const STATUS_CONFIG: Record<
  string,
  { gradient: string; badge: string; dot: string; label: string }
> = {
  Fixed: {
    gradient: "from-[#82b1c4] to-[#4f91ac]",
    badge: "bg-white/20 text-white",
    dot: "bg-white",
    label: "Fixed",
  },
  Rescheduled: {
    gradient: "from-[#FFD180] to-[#FF9800]",
    badge: "bg-white/20 text-white",
    dot: "bg-white",
    label: "Rescheduled",
  },
  Postponed: {
    gradient: "from-[#FF8A80] to-[#e53935]",
    badge: "bg-white/20 text-white",
    dot: "bg-white",
    label: "Postponed",
  },
  Canceled: {
    gradient: "from-[#b71c1c] to-[#7f0000]",
    badge: "bg-white/20 text-white",
    dot: "bg-white",
    label: "Canceled",
  },
  Complete: {
    gradient: "from-[#4DB6AC] to-[#00897B]",
    badge: "bg-white/20 text-white",
    dot: "bg-white",
    label: "Complete",
  },
  Sold: {
    gradient: "from-[#8BC34A] to-[#558B2F]",
    badge: "bg-white/20 text-white",
    dot: "bg-white",
    label: "Sold",
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.Fixed;
}

// ── Draggable Meeting Card ─────────────────────────────────────
interface DraggableMeetingProps {
  id: string;
  meeting: LeadMeeting;
}

export function DraggableMeeting({ id, meeting }: DraggableMeetingProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { meeting },
  });

  const config = getStatusConfig(meeting.status);
  const lead = meeting.lead as any;
  const phones = lead?.phones ?? [];
  const requirements = (lead?.requirements as string[]) ?? [];
  const cre = lead?.cre;

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : 1 }
    : { zIndex: 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute inset-0 m-1 rounded-2xl bg-linear-to-b p-2.5 select-none transition-all duration-300",
        config.gradient,
        isDragging ? "shadow-2xl scale-105 rotate-1 opacity-90" : "shadow-md hover:shadow-xl hover:-translate-y-0.5",
      )}
    >
      {/* ── Top row: CRE + status menu ────────────── */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* CRE Avatar */}
          <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center shrink-0 ring-1 ring-white/50 text-[8px] font-black text-white uppercase overflow-hidden">
            {cre?.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cre.profile_picture} alt={cre.nickname || cre.name} className="w-full h-full object-cover" />
            ) : (
              <span>{cre?.nickname?.[0] ?? cre?.name?.[0] ?? "?"}</span>
            )}
          </div>
          <span className="text-[9px] font-bold text-white/90 truncate">
            {cre?.nickname ?? cre?.name ?? "No CRE"}
          </span>
        </div>

        {/* Status Menu — no drag propagation */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <MeetingStatusMenu
            meeting={meeting}
            onUpdate={(updated) => setMeeting((prev) => ({ ...prev, ...updated }))}
            stopPropagation
          />
        </div>
      </div>

      {/* ── Middle: Drag handle area ──────────────── */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        {/* Lead Name */}
        <div className="font-black text-white text-[11px] leading-tight truncate mb-1">
          {meeting.lead?.name ?? "Unknown"}
        </div>

        {/* CID + Status */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[9px] font-black text-white/70 bg-black/20 rounded-lg px-1.5 py-0.5 uppercase tracking-widest">
            {meeting.lead?.cid ?? "??"}
          </span>
          <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-lg", config.badge)}>
            {meeting.status}
          </span>
        </div>

        {/* Phone */}
        {phones.length > 0 && (
          <div className="flex items-center gap-1 text-[9px] text-white/80 mb-1">
            <Phone className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{phones[0]}</span>
          </div>
        )}

        {/* Requirements tags */}
        {requirements.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {requirements.slice(0, 2).map((req, i) => (
              <span
                key={i}
                className="text-[8px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full truncate max-w-20"
              >
                {req}
              </span>
            ))}
            {requirements.length > 2 && (
              <span className="text-[8px] font-bold text-white/60">+{requirements.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom: Charge + link ─────────────────── */}
      <div className="flex items-center justify-between border-t border-white/20 pt-1.5 mt-auto">
        <span className="text-[9px] font-black text-white/90">৳{meeting.visit_charge ?? 0}</span>
        <Link
          href={`/leads/${meeting.lead_id}`}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-2.5 h-2.5 text-white/70" />
        </Link>
      </div>
    </div>
  );
}

// ── Droppable Slot ─────────────────────────────────────────────
interface DroppableSlotProps {
  id: string;
  children?: React.ReactNode;
  isOccupied: boolean;
}

export function DroppableSlot({ id, children, isOccupied }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex-1 min-w-48 h-36 border-r border-b border-slate-100 transition-all duration-200",
        isOver && !isOccupied && "bg-[var(--brand-primary)]/8 ring-2 ring-inset ring-[var(--brand-primary)]/30",
        isOver && isOccupied && "bg-red-50 ring-2 ring-inset ring-red-200",
        !isOccupied && !isOver && "hover:bg-slate-50/70"
      )}
    >
      {children}
      {!isOccupied && !isOver && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          <Clock className="w-4 h-4 text-slate-200" />
        </div>
      )}
    </div>
  );
}
