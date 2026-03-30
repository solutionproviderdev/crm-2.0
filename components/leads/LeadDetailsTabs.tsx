"use client";

import { Lead } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  ListTodo, 
  AlarmClock, 
  Phone, 
  Coins 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LeadCommentsTab } from "./tabs/LeadCommentsTab";
import { LeadFollowUpTab } from "./tabs/LeadFollowUpTab";
import { LeadFinanceTab } from "./tabs/LeadFinanceTab";
import { LeadCallLogTab } from "./tabs/LeadCallLogTab";
import { LeadRemindersTab } from "./tabs/LeadRemindersTab";

interface LeadDetailsTabsProps {
  lead: Lead;
}

export function LeadDetailsTabs({ lead }: LeadDetailsTabsProps) {
  return (
    <Card className="border-none shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
      <Tabs defaultValue="comments" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 w-full bg-slate-100/50 rounded-none h-14 shrink-0">
          <TabsTrigger value="comments" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none h-full">
            <MessageCircle className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="followups" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none h-full">
            <ListTodo className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="reminders" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none h-full">
            <AlarmClock className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="calls" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none h-full">
            <Phone className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="finance" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none h-full">
            <Coins className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="comments" className="m-0 h-full">
            <LeadCommentsTab lead={lead} />
          </TabsContent>
          <TabsContent value="followups" className="m-0 h-full">
            <LeadFollowUpTab lead={lead} />
          </TabsContent>
          <TabsContent value="reminders" className="m-0 h-full">
            <LeadRemindersTab lead={lead} />
          </TabsContent>
          <TabsContent value="calls" className="m-0 h-full">
            <LeadCallLogTab lead={lead} />
          </TabsContent>
          <TabsContent value="finance" className="m-0 h-full">
            <LeadFinanceTab lead={lead} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
