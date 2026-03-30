"use client";

import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent
} from "@dnd-kit/core";
import { 
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import { User, LeadMeeting, MeetingSlot } from "@/lib/types";
import { SalesTeamColumn, TimeSlotsHeader } from "./GridHeaders";
import { DraggableMeeting, DroppableSlot } from "./GridComponents";
import { useState, useTransition, useEffect } from "react";
import { updateMeetingSchedule } from "@/app/actions/leads";
import { toast } from "sonner";

interface MeetingGridProps {
  timeSlots: MeetingSlot[];
  salespeople: User[];
  initialMeetings: LeadMeeting[];
  selectedDate: string;
}

export function MeetingGrid({ 
  timeSlots, 
  salespeople, 
  initialMeetings
}: MeetingGridProps) {
  const [meetings, setMeetings] = useState<LeadMeeting[]>(initialMeetings);
  const [, startTransition] = useTransition();

  // Sync state when props change (Real-time update)
  useEffect(() => {
    setMeetings(initialMeetings);
  }, [initialMeetings]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const meetingId = active.id as string;
    const [salespersonId, slotText] = (over.id as string).split("|");

    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    // Check if the slot is already occupied for this salesperson
    const isOccupied = meetings.some(
      m => m.sales_executive_id === salespersonId && m.slot === slotText && m.id !== meetingId
    );

    if (isOccupied) {
      toast.error("This slot is already occupied");
      return;
    }

    // Optimistic Update
    const previousMeetings = [...meetings];
    setMeetings(prev => prev.map(m => 
      m.id === meetingId 
        ? { ...m, sales_executive_id: salespersonId, slot: slotText } 
        : m
    ));

    startTransition(async () => {
      const result = await updateMeetingSchedule(meetingId, salespersonId, slotText);
      if (result.success) {
        toast.success("Schedule updated");
      } else {
        setMeetings(previousMeetings);
        toast.error(result.error);
      }
    });
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <SalesTeamColumn salespeople={salespeople} />
        
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="min-w-max flex flex-col">
            <TimeSlotsHeader timeSlots={timeSlots.map((s: MeetingSlot) => s.slot_text)} />
            
            <div className="flex flex-col divide-y divide-slate-100">
              {salespeople.map((person: User) => (
                <div key={person.id} className="flex shrink-0">
                  {timeSlots.map((slot: MeetingSlot) => {
                    const meetingAtSlot = meetings.find(
                      m => m.sales_executive_id === person.id && m.slot === slot.slot_text
                    );
                    
                    return (
                      <DroppableSlot 
                        key={`${person.id}|${slot.slot_text}`}
                        id={`${person.id}|${slot.slot_text}`}
                        isOccupied={!!meetingAtSlot}
                      >
                        {meetingAtSlot && (
                          <DraggableMeeting 
                            id={meetingAtSlot.id} 
                            meeting={meetingAtSlot} 
                          />
                        )}
                      </DroppableSlot>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
