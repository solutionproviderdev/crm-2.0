"use client";

import { useState } from "react";
import { LeadMeeting, User, MeetingSlot } from "@/lib/types";
import { Calendar, MapPin, Phone, ExternalLink } from "lucide-react";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { MeetingStatusMenu } from "./MeetingStatusMenu";
import { format } from "date-fns";


interface MeetingListViewProps {
  meetings: LeadMeeting[];
  users?: User[];
  slots?: MeetingSlot[];
}


const STATUS_TEXT: Record<string, string> = {
  Fixed: "text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20",
  Rescheduled: "text-orange-700 bg-orange-50 border-orange-200",
  Postponed: "text-red-600 bg-red-50 border-red-200",
  Canceled: "text-red-900 bg-red-100 border-red-300",
  Complete: "text-teal-700 bg-teal-50 border-teal-200",
  Sold: "text-green-700 bg-green-50 border-green-200",
};

function Avatar({ name, src }: { name?: string; src?: string | null }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0 ring-1 ring-[var(--brand-primary)]/20 overflow-hidden">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase">
          {name?.[0] ?? "?"}
        </span>
      )}
    </div>
  );
}

export function MeetingListView({ meetings: initialMeetings }: MeetingListViewProps) {
  const [meetings, setMeetings] = useState<LeadMeeting[]>(initialMeetings);

  // Sync when parent re-fetches
  if (JSON.stringify(initialMeetings.map((m) => m.id)) !== JSON.stringify(meetings.map((m) => m.id))) {
    setMeetings(initialMeetings);
  }

  const handleUpdate = (updated: LeadMeeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  };

  const handleDelete = (meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
  };

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-sm font-bold text-slate-400">No meetings found for this period</p>
        <p className="text-xs text-slate-300 mt-1">Try adjusting the date range or filters</p>
      </div>
    );
  }

  // Group by date
  const grouped = meetings.reduce<Record<string, LeadMeeting[]>>((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {Object.entries(grouped).map(([date, dayMeetings]) => (
        <div key={date}>
          {/* Date group header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-[var(--brand-primary)] flex flex-col items-center justify-center shadow-md shadow-[var(--brand-primary)]/20 shrink-0">
              <span className="text-[9px] font-black text-white/70 uppercase leading-none">
                {format(new Date(date), "MMM")}
              </span>
              <span className="text-sm font-black text-white leading-none">
                {format(new Date(date), "dd")}
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-700">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-xs font-bold text-slate-400">{dayMeetings.length} meeting{dayMeetings.length > 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Meeting cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayMeetings.map((meeting) => {
              const badgeClass = STATUS_TEXT[meeting.status] ?? STATUS_TEXT.Fixed;
              const lead = meeting.lead;
              const phones = lead?.phones ?? [];
              const source = lead?.source ?? "Unknown";
              const requirements = lead?.requirements ?? [];
              const cre = lead?.cre;
              const projectStatus = lead?.project_status;
              
              const addressObj = (meeting.lead as { address?: { area?: string, district?: string } })?.address;
              const addressStr = addressObj?.area ? `${addressObj.area}${addressObj.district ? `, ${addressObj.district}` : ''}` : 'No address';

              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200/60 hover:shadow-lg hover:border-[var(--brand-primary)]/30 transition-all duration-300 overflow-visible relative flex flex-col"
                >
                  {/* Action Menu (Absolute top right) */}
                  <div className="absolute right-2 top-2 z-10 flex gap-1">
                    <Link
                      href={`/leads/${meeting.lead_id}`}
                      className="p-1.5 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-slate-100 text-slate-400 hover:text-[var(--brand-primary)] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg hover:bg-slate-100 transition-colors">
                      <MeetingStatusMenu
                        meeting={meeting}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        stopPropagation={true}
                      />
                    </div>
                  </div>

                  {/* Compact Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 pr-16">
                        <Avatar name={meeting.lead?.name} />
                        <div>
                          <h3 className="text-sm font-black text-slate-800 leading-tight">
                            {meeting.lead?.name ?? "Unknown Lead"}
                          </h3>
                          <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-0.5 font-bold">
                            <MapPin className="h-3 w-3 text-[var(--brand-primary)]" />
                            <span className="truncate max-w-35 uppercase tracking-wider">{addressStr}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    
                    {/* Status & Time */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-xl border", badgeClass)}>
                        {meeting.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Calendar className="h-3 w-3 text-[var(--brand-primary)]" />
                        <span className="uppercase tracking-wider">
                          {format(new Date(meeting.date), "MMM d, yyyy")} • {meeting.slot}
                        </span>
                      </div>
                    </div>

                    {/* Contact & Basic Info 2x2 */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Left Col */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-5 h-5 rounded-md bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0">
                            <Phone className="h-3 w-3 text-[var(--brand-primary)]" />
                          </div>
                          <span className="font-bold text-slate-700 truncate">
                            {phones[0] || 'No phone'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-5 h-5 rounded-md bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0">
                            <MapPin className="h-3 w-3 text-[var(--brand-primary)]" />
                          </div>
                          <span className="font-bold text-slate-500 truncate">{source}</span>
                        </div>
                      </div>

                      {/* Right Col */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-5 h-5 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                            <span className="font-black text-green-600 text-[10px]">৳</span>
                          </div>
                          <span className="font-black text-slate-600">
                            Charge: <span className="text-green-600">৳{meeting.visit_charge ?? 0}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                            <MapPin className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="font-bold text-slate-500 truncate">
                            {projectStatus ? `${projectStatus.status} - ${projectStatus.subStatus}` : 'No Status'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    {requirements.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {requirements.map((req, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[var(--brand-primary)]/5 text-[var(--brand-primary)] rounded-md border border-[var(--brand-primary)]/10"
                            >
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-100">
                      {/* Team Members */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          Team Members
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {/* CRE */}
                          {cre ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name={cre.nickname ?? cre.name} src={cre.profile_picture} />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-700 truncate">
                                  {cre.nickname ?? cre.name ?? "Unknown"}
                                </p>
                                <p className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-wider">CRE</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name="?" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400">No CRE</p>
                              </div>
                            </div>
                          )}

                          {/* Sales Executive */}
                          {meeting.sales_executive ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name={meeting.sales_executive.nickname ?? meeting.sales_executive.name} src={meeting.sales_executive.profile_picture} />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-700 truncate">
                                  {meeting.sales_executive.nickname ?? meeting.sales_executive.name ?? "Unknown"}
                                </p>
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-wider">Sales Exec</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name="?" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400">No Sales Exec</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
