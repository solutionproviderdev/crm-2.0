/**
 * Pipeline Stage Configuration
 *
 * Centralized stage groupings for the Client (Sales) and Project (Implementation)
 * pipeline pages. Matches the same status strings used by LeadStatusControl.tsx.
 *
 * Usage:
 *   import { SALES_STAGES, IMPLEMENTATION_STAGES, STAGE_CONFIG } from '@/lib/pipeline-stages';
 */

import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Handshake,
  TrendingDown,
  Ruler,
  Package,
  PackageCheck,
  Hammer,
  CheckCircle,
  Truck,
  MapPin,
  MessageSquare,
  PhoneCall,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const LEAD_STAGES = [
  "New",
  "Message Rescheduled",
  "Number Collected",
  "Call Rescheduled",
  "Ongoing",
  "Need Support",
  "Meeting Fixed",
] as const;

export const SALES_STAGES = [
  "Meeting Fixed",
  "Meeting Complete",
  "Quotation Sent",
  "Prospect",
  "Sold",
  "Lost",
  "Closed",
  "Measurement Scheduled",
  "Measurement Done",
] as const;

export const IMPLEMENTATION_STAGES = [
  "Material Ordered",
  "Material Received",
  "Making",
  "Ready for Installation",
  "Out for Installation",
  "Installation Completed",
  "Handed Over",
  "Closed",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];
export type SalesStage = (typeof SALES_STAGES)[number];
export type ImplementationStage = (typeof IMPLEMENTATION_STAGES)[number];
export type PipelineStage = LeadStage | SalesStage | ImplementationStage;

export interface StageConfig {
  icon: LucideIcon;
  color: string;        // text color class
  bg: string;           // background color class
  border: string;       // border color class
  headerBg: string;     // column header background
}

export const STAGE_CONFIG: Record<string, StageConfig> = {
  New: {
    icon: FileText,
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    headerBg: "bg-slate-100",
  },
  "Message Rescheduled": {
    icon: MessageSquare,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    headerBg: "bg-sky-100",
  },
  "Number Collected": {
    icon: PhoneCall,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    headerBg: "bg-emerald-100",
  },
  "Call Rescheduled": {
    icon: Calendar,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    headerBg: "bg-amber-100",
  },
  Ongoing: {
    icon: Hammer,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    headerBg: "bg-orange-100",
  },
  "Need Support": {
    icon: HelpCircle,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    headerBg: "bg-rose-100",
  },
  "Meeting Fixed": {
    icon: Calendar,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    headerBg: "bg-indigo-100",
  },
  "Meeting Complete": {
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    headerBg: "bg-green-100",
  },
  "Quotation Sent": {
    icon: FileText,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    headerBg: "bg-blue-100",
  },
  Prospect: {
    icon: Eye,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    headerBg: "bg-violet-100",
  },
  Sold: {
    icon: Handshake,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    headerBg: "bg-emerald-100",
  },
  Lost: {
    icon: TrendingDown,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    headerBg: "bg-red-100",
  },
  "Measurement Scheduled": {
    icon: Clock,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    headerBg: "bg-sky-100",
  },
  "Measurement Done": {
    icon: Ruler,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    headerBg: "bg-teal-100",
  },
  Closed: {
    icon: Archive,
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    headerBg: "bg-slate-100",
  },
  "Material Ordered": {
    icon: Package,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    headerBg: "bg-orange-100",
  },
  "Material Received": {
    icon: PackageCheck,
    color: "text-lime-700",
    bg: "bg-lime-50",
    border: "border-lime-200",
    headerBg: "bg-lime-100",
  },
  Making: {
    icon: Hammer,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    headerBg: "bg-yellow-100",
  },
  "Ready for Installation": {
    icon: CheckCircle,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    headerBg: "bg-cyan-100",
  },
  "Out for Installation": {
    icon: Truck,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    headerBg: "bg-sky-100",
  },
  "Installation Completed": {
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    headerBg: "bg-green-100",
  },
  "Handed Over": {
    icon: MapPin,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    headerBg: "bg-emerald-100",
  },
};

/** Fallback config for unknown stages */
export const DEFAULT_STAGE_CONFIG: StageConfig = {
  icon: FileText,
  color: "text-gray-600",
  bg: "bg-gray-50",
  border: "border-gray-200",
  headerBg: "bg-gray-100",
};

export function getStageConfig(stage: string): StageConfig {
  return STAGE_CONFIG[stage] ?? DEFAULT_STAGE_CONFIG;
}
