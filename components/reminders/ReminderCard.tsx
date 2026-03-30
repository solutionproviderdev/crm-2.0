"use client";

import { LeadFollowUp, Lead, FollowUpWithLead, User } from "@/lib/types";
import { cn } from "@/utils/cn";
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MoreHorizontal,
  ChevronRight,
  MapPin,
  User as UserIcon
} from "lucide-react";
import { format, parseISO, isPast, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReminderCardProps {
  reminder: LeadFollowUp;
  onProcess: (reminder: LeadFollowUp) => void;
}

const STATUS_CONFIG: Record<string, { 
  color: string; 
  bg: string; 
  border: string; 
  icon: React.ElementType; 
  label: string;
  gradient: string;
}> = {
  Pending: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    icon: Clock,
    label: "Pending",
    gradient: "from-orange-500 to-amber-500",
  },
  Missed: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    icon: AlertCircle,
    label: "Missed",
    gradient: "from-red-500 to-rose-500",
  },
  Complete: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: CheckCircle2,
    label: "Completed",
    gradient: "from-emerald-500 to-teal-500",
  },
  "Late Complete": {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: CheckCircle2,
    label: "Late Completed",
    gradient: "from-blue-500 to-indigo-500",
  },
};

export function ReminderCard({ reminder: baseReminder, onProcess }: ReminderCardProps) {
  const reminder = baseReminder as FollowUpWithLead;
  const lead = reminder.lead;
  const status = STATUS_CONFIG[reminder.status] || STATUS_CONFIG.Pending;
  const scheduledTime = parseISO(reminder.time);
  const phones = lead?.phones || [];
  
  const isOverdue = isPast(scheduledTime) && reminder.status === "Pending";
  const displayStatus = isOverdue ? STATUS_CONFIG.Missed : status;

  // Formatting address
  const addr = lead?.address;
  const addressStr = [addr?.area, addr?.district].filter(Boolean).join(", ");

  // Latest Comment
  const lastComment = lead?.comments?.[0];

  const typeIcon = reminder.type === "Physical Meeting" ? MapPin : Phone;

  return (
		<div
			className={cn(
				'group relative bg-white rounded-4xl border border-slate-100 p-4.5 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col min-h-85',
				'hover:border-slate-200 hover:-translate-y-1',
			)}
		>
			{/* Header: Status & Assignment */}
			<div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9.5px] font-black uppercase tracking-wider',
              displayStatus.bg,
              displayStatus.color,
              displayStatus.border,
            )}
          >
            <displayStatus.icon className="w-2.5 h-2.5" />
            {displayStatus.label}
          </div>
          
          {/* Follow-up Type Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest">
            {reminder.type === "Physical Meeting" ? <MapPin className="w-2.5 h-2.5" /> : <Phone className="w-2.5 h-2.5" />}
            {reminder.type === "Physical Meeting" ? "Meeting" : "Call"}
          </div>
        </div>

				<div className="flex items-center gap-2">
          <div className="flex flex-col items-end mr-1">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Assigned To</span>
            <span className="text-[10px] font-black text-slate-500 leading-none">{reminder.assigned_user?.name?.split(' ')[0] || 'Unassigned'}</span>
          </div>
          <Avatar className="w-7 h-7 border-2 border-white shadow-sm ring-1 ring-slate-100">
            <AvatarImage src={reminder.assigned_user?.profile_picture || ""} />
            <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-black">
              {reminder.assigned_user?.name?.[0] || <UserIcon className="w-3 h-3" />}
            </AvatarFallback>
          </Avatar>
				</div>
			</div>

			{/* Identity & Core Info (Compact Grid) */}
			<div className="flex items-start gap-3 mb-4">
				<div
					className={cn(
						'w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md rotate-2 group-hover:rotate-0 transition-transform duration-500 bg-linear-to-br shrink-0',
						displayStatus.gradient,
					)}
				>
					{lead?.name?.[0] || '?'}
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="text-base font-black text-slate-800 leading-tight truncate group-hover:text-[var(--brand-primary)] transition-colors">
						{lead?.name || 'Unknown Lead'}
					</h3>
					<div className="flex items-center gap-1 text-slate-400 text-[9.5px] mt-0.5 font-bold">
						<span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
							#{lead?.cid || 'N/A'}
						</span>
						<span className="w-0.5 h-0.5 rounded-full bg-slate-200" />
						<span className="truncate uppercase tracking-tighter">
							{lead?.source || 'Search'}
						</span>
					</div>
				</div>

				{/* TIME BADGE: INTEGRATED INTO IDENTITY ROW */}
				<div
					className={cn(
						'px-2.5 py-2 rounded-xl border flex flex-col items-end shrink-0',
						isOverdue
							? 'bg-red-50/50 border-red-100'
							: 'bg-orange-50/50 border-orange-100',
					)}
				>
					<div className="flex items-center gap-1 mb-0.5">
						<span className="text-[8.5px] font-black uppercase tracking-tighter opacity-40">
							{format(scheduledTime, 'MMM d')}
						</span>
						<span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
						<p className="text-[11.5px] font-black text-slate-800">
							{format(scheduledTime, 'h:mm a')}
						</p>
					</div>
					<p
						className={cn(
							'text-[8.5px] font-black uppercase tracking-widest',
							isOverdue ? 'text-red-600' : 'text-orange-600',
						)}
					>
						{isOverdue
							? 'Overdue'
							: formatDistanceToNow(scheduledTime, { addSuffix: true })}
					</p>
				</div>
			</div>

			{/* UNIFIED CONTEXT BOX: ADDRESS + COMMENT */}
			<div className="bg-slate-50/50 rounded-2xl border border-slate-50 p-3 mb-4 space-y-2.5">
				{addressStr && (
					<div className="flex items-start gap-1.5 min-w-0">
						<MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
						<p className="text-[10.5px] font-bold text-slate-500 leading-relaxed truncate">
							{addressStr}
						</p>
					</div>
				)}

				{lastComment && (
					<div className="border-t border-slate-100/50 pt-2.5">
						<div className="flex items-center justify-between mb-1.5">
							<div className="flex items-center gap-1.5 border-l-2 border-orange-200 pl-2">
								{/* <Quote className="w-3 h-3 text-orange-400 rotate-180" /> */}
								{lastComment.user && (
									<div className="flex items-center gap-1 px-2 py-0.5">
										<div className="w-4 h-4 rounded-md bg-[var(--brand-primary)] flex items-center justify-center text-[7px] font-black text-white uppercase overflow-hidden">
											{lastComment.user.profile_picture ? (
												<img
													src={lastComment.user.profile_picture}
													alt=""
													className="w-full h-full object-cover"
												/>
											) : (
												lastComment.user.name[0]
											)}
										</div>
										<span className="text-[8.5px] font-black text-slate-500 uppercase tracking-tighter truncate max-w-15">
											{lastComment.user.name}
										</span>
									</div>
								)}
							</div>

							{/* Commenter Badge */}
						</div>

						<p className="text-[11.5px] font-bold text-slate-600 line-clamp-2 leading-relaxed italic pl-3.5">
							&ldquo;{lastComment.comment}&rdquo;
						</p>
					</div>
				)}
			</div>

			{/* Action Bar (Compact) */}
			<div className="flex items-center gap-2 mt-auto">
				<div className="flex items-center gap-1.5">
					<button
						onClick={() => window.open(`tel:${phones[0]}`, '_self')}
						disabled={!phones[0]}
						className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white hover:border-[var(--brand-primary)] transition-all duration-300"
						title="Call Lead"
					>
						<Phone className="w-3 h-3" />
					</button>
					<button
						onClick={() =>
							window.open(
								`https://wa.me/${phones[0]?.replace(/\D/g, '')}`,
								'_blank',
							)
						}
						disabled={!phones[0]}
						className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-50/50 border border-green-100 text-green-600 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all duration-300"
						title="WhatsApp Lead"
					>
						<MessageSquare className="w-3 h-3" />
					</button>
				</div>

				<Button
					onClick={() => onProcess(reminder)}
					className={cn(
						'flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[10.5px] transition-all duration-300 shadow-sm gap-1.5',
						reminder.status === 'Complete' ||
							reminder.status === 'Late Complete'
							? 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200 shadow-none'
							: 'bg-[var(--brand-primary)] hover:bg-[#034d6b] text-white shadow-[var(--brand-primary)]/20',
					)}
				>
					{reminder.status === 'Complete' || reminder.status === 'Late Complete'
						? 'View Details'
						: 'Process'}
					<ChevronRight className="w-3.5 h-3.5" />
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="w-9 h-9 rounded-xl p-0 text-slate-400 hover:text-[var(--brand-primary)] hover:bg-slate-50 transition-colors"
						>
							<MoreHorizontal className="w-4 h-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="rounded-xl shadow-xl border-gray-100 p-1.5 z-50"
					>
						<DropdownMenuItem asChild>
							<Link
								href={`/leads/${reminder.lead_id}`}
								className="flex items-center gap-2 p-1.5 font-bold text-slate-600 text-[10px] cursor-pointer hover:bg-slate-50 rounded-lg uppercase tracking-wider"
							>
								Full Profile
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-2 p-1.5 font-bold text-red-600 text-[10px] cursor-pointer hover:bg-red-50 rounded-lg uppercase tracking-wider">
							Discard
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
