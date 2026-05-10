"use client";

import type { Lead, LifecycleStatusGroup, LifecycleTransitionRule, User } from "@/lib/types";
import { LifecycleActionPanel } from "./LifecycleActionPanel";

interface LeadStatusControlProps {
  lead: Lead;
  lifecycleStatusGroups?: LifecycleStatusGroup[];
  lifecycleTransitionRules?: LifecycleTransitionRule[];
  users?: User[];
  variant?: "panel" | "compact";
}

export function LeadStatusControl({
  lead,
  lifecycleStatusGroups,
  lifecycleTransitionRules,
  users,
  variant,
}: LeadStatusControlProps) {
  return (
    <LifecycleActionPanel
      lead={lead}
      lifecycleStatusGroups={lifecycleStatusGroups}
      lifecycleTransitionRules={lifecycleTransitionRules}
      users={users}
      variant={variant}
    />
  );
}
