"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Check,
  Loader2,
  Plus,
  X
} from "lucide-react";
import { 
  getMeetingSlots, 
  getSalesTeamMembers,
  getMeetingsByDate,
  fixMeetingForLead,
  getAllActiveUsers
} from "@/app/actions/leads";
import { MeetingSlot, User, LeadMeeting, Lead } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";

interface MeetingFixedWizardProps {
  lead: Lead;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MeetingFixedWizard({ lead, onSuccess, onCancel }: MeetingFixedWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Data for selects
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [salesTeams, setSalesTeams] = useState<User[]>([]);
  const [existingMeetings, setExistingMeetings] = useState<LeadMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Address
    division: lead.address?.division || "",
    district: lead.address?.district || "",
    area: lead.address?.area || "",
    address: lead.address?.address || "",

    // Schedule
    date: format(new Date(), "yyyy-MM-dd"),
    slot: "",
    sales_executive_id: "",

    // Lead Details
    project_status: lead.project_status?.status || "Prospective",
    project_sub_status: lead.project_status?.subStatus || "Initial Contact",
    project_location: lead.meetings?.[0]?.project_location || "Inside",
    visit_charge: 0,
    comment: "",
    requirements: lead.requirements || []
  });

  const [reqInput, setReqInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [slotsRes, usersRes] = await Promise.all([
        getMeetingSlots(),
        getAllActiveUsers()
      ]);
      if (slotsRes.success) setSlots(slotsRes.data);
      if (usersRes.success) {
        // Exclude current CRE from Sales selection for this meeting
        const filteredUsers = (usersRes.data as User[]).filter((u: User) => u.id !== lead.cre_id);
        setSalesTeams(filteredUsers);
      }
    };
    fetchData();
  }, [lead.cre_id]);

  const fetchExistingMeetings = useCallback(async () => {
    if (!formData.date) return;
    setLoadingMeetings(true);
    const res = await getMeetingsByDate(formData.date);
    if (res.success) setExistingMeetings(res.data);
    setLoadingMeetings(false);
  }, [formData.date]);

  useEffect(() => {
    fetchExistingMeetings();
  }, [fetchExistingMeetings]);

  useEffect(() => {
    if (!formData.date) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`wizard_meetings_${formData.date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_meetings"
        },
        () => {
          fetchExistingMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formData.date, fetchExistingMeetings]);

  const addRequirement = () => {
    if (reqInput.trim() && !formData.requirements.includes(reqInput.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, reqInput.trim()]
      }));
      setReqInput("");
    }
  };

  const removeRequirement = (req: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== req)
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      return !!formData.division && !!formData.district && !!formData.area && !!formData.address;
    }
    if (step === 1) {
      return !!formData.date && !!formData.slot && !!formData.sales_executive_id;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await fixMeetingForLead({
        leadId: lead.id,
        address: {
          division: formData.division,
          district: formData.district,
          area: formData.area,
          address: formData.address
        },
        meetingData: {
          date: formData.date,
          slot: formData.slot,
          sales_executive_id: formData.sales_executive_id,
          visit_charge: formData.visit_charge,
          project_location: formData.project_location as "Inside" | "Outside"
        },
        projectStatus: {
          status: formData.project_status,
          subStatus: formData.project_sub_status
        },
        requirements: formData.requirements,
        comment: formData.comment
      });

      if (result.success) {
        toast.success("Meeting fixed successfully!");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to fix meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Step Indicator */}
      <div className="bg-[var(--brand-primary)] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
            {step === 0 && <MapPin className="w-4 h-4 text-white" />}
            {step === 1 && <Calendar className="w-4 h-4 text-white" />}
            {step === 2 && <Check className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {step === 0 && "Update Location"}
              {step === 1 && "Schedule Meeting"}
              {step === 2 && "Finalize Details"}
            </h3>
            <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
              Step {step + 1} of 3
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-125">
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Division</Label>
                <Input 
                  placeholder="e.g. Dhaka"
                  className="h-10 rounded-xl"
                  value={formData.division}
                  onChange={(e) => setFormData({...formData, division: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">District</Label>
                <Input 
                  placeholder="e.g. Dhaka"
                  className="h-10 rounded-xl"
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Area</Label>
              <Input 
                placeholder="e.g. Uttara Sector 4"
                className="h-10 rounded-xl"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Physical Address</Label>
              <Textarea 
                placeholder="Specific house/road info..."
                className="min-h-20 rounded-xl resize-none"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Date</Label>
                <Input 
                  type="date"
                  className="h-9 rounded-lg"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[var(--brand-primary)] uppercase">Selected Slot</p>
                <p className="text-xs font-bold text-slate-700">
                  {formData.sales_executive_id && formData.slot 
                    ? `${salesTeams.find(u => u.id === formData.sales_executive_id)?.name} @ ${formData.slot}`
                    : "Tap a slot"}
                </p>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-max">
                  <div className="flex bg-slate-50 border-b">
                    <div className="w-20 shrink-0 p-2 text-[10px] font-black text-slate-400 text-center border-r">TEAM</div>
                    {slots.map(s => (
                      <div key={s.id} className="w-16 shrink-0 p-2 text-[10px] font-black text-slate-500 text-center border-r">{s.slot_text}</div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    {loadingMeetings ? (
                      <div className="h-40 flex items-center justify-center bg-slate-50/50"><Loader2 className="w-5 h-5 animate-spin text-[var(--brand-primary)]" /></div>
                    ) : (
                      salesTeams.map((person) => (
                        <div key={person.id} className="flex border-b last:border-b-0 hover:bg-slate-50/30">
                          <div className="w-20 shrink-0 p-2 bg-slate-50/50 border-r flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold text-slate-600 truncate w-full">{person.nickname || person.name.split(' ')[0]}</span>
                          </div>
                          {slots.map((slot) => {
                            const meeting = existingMeetings.find(m => m.sales_executive_id === person.id && m.slot === slot.slot_text);
                            const isSelected = formData.sales_executive_id === person.id && formData.slot === slot.slot_text;
                            if (meeting) return <div key={slot.id} className="w-16 shrink-0 h-10 bg-red-50 flex items-center justify-center border-r">
                              <Badge className="text-[7px] bg-red-100 text-red-600 border-none px-1 h-3">BUSY</Badge>
                            </div>;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, sales_executive_id: person.id, slot: slot.slot_text })}
                                className={cn("w-16 shrink-0 h-10 border-r transition-all flex items-center justify-center", isSelected ? "bg-[var(--brand-primary)]" : "bg-white hover:bg-slate-50")}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Charge</Label>
                <Input 
                  type="number"
                  className="h-10 rounded-xl"
                  value={formData.visit_charge}
                  onChange={(e) => setFormData({...formData, visit_charge: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Location</Label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, project_location: "Inside"})} 
                    className={cn("flex-1 py-1 rounded-md text-[9px] font-bold", formData.project_location === "Inside" ? "bg-white shadow text-[var(--brand-primary)]" : "text-slate-500")}
                  >INSIDE</button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, project_location: "Outside"})} 
                    className={cn("flex-1 py-1 rounded-md text-[9px] font-bold", formData.project_location === "Outside" ? "bg-white shadow text-[var(--brand-primary)]" : "text-slate-500")}
                  >OUTSIDE</button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Requirements</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add requirement..." 
                  className="h-10 rounded-xl"
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button variant="outline" size="icon" onClick={addRequirement} className="rounded-xl h-10 w-10 shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.requirements.map(r => (
                  <Badge key={r} variant="secondary" className="px-2 py-0.5 rounded-lg text-[9px] bg-slate-100 flex items-center gap-1">
                    {r}
                    <button onClick={() => removeRequirement(r)}><X className="w-2.5 h-2.5" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Closing Comment</Label>
              <Textarea 
                placeholder="Special notes for salesperson..."
                className="min-h-20 rounded-xl resize-none"
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
        <Button variant="ghost" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)} className="font-bold text-slate-500">
          {step === 0 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>}
        </Button>
        <div className="flex gap-2">
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!validateStep()} className="bg-[var(--brand-primary)] hover:bg-[#035170] font-bold rounded-xl px-6">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 font-bold rounded-xl px-8">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirm Meeting
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
