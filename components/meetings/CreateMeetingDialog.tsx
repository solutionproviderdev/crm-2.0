"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  UserPlus, 
  Check,
  Loader2,
  Plus,
  X
} from "lucide-react";
import { 
  bookNewMeeting, 
  getMeetingSlots, 
  getSalesTeamMembers,
  getMeetingsByDate,
  getAllActiveUsers
} from "@/app/actions/leads";
import { MeetingSlot, User, LeadSource, LeadMeeting } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { UserSelect } from "@/components/leads/UserSelect";
import { MeetingSlotGrid } from "./MeetingSlotGrid";

interface CreateMeetingDialogProps {
  trigger?: React.ReactNode;
}

export function CreateMeetingDialog({ trigger }: CreateMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Data for selects
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [salesTeams, setSalesTeams] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [existingMeetings, setExistingMeetings] = useState<LeadMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Address
    division: "",
    district: "",
    area: "",
    address: "",

    // Schedule
    date: format(new Date(), "yyyy-MM-dd"),
    slot: "",
    sales_executive_id: "",

    // Lead Details
    name: "",
    phone: "",
    source: "Phone" as LeadSource,
    cre_id: "",
    project_status: "Prospective",
    project_sub_status: "Initial Contact",
    project_location: "Inside" as "Inside" | "Outside",
    visit_charge: 0,
    initial_comment: "",
    requirements: [] as string[]
  });

  const [reqInput, setReqInput] = useState("");

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [slotsRes, salesRes, usersRes] = await Promise.all([
          getMeetingSlots(),
          getSalesTeamMembers(),
          getAllActiveUsers()
        ]);
        if (slotsRes.success) setSlots(slotsRes.data);
        if (salesRes.success) setSalesTeams(salesRes.data);
        if (usersRes.success) setAllUsers(usersRes.data);
      };
      fetchData();
    }
  }, [open]);

  const fetchExistingMeetings = useCallback(async () => {
    if (!open || !formData.date) return;
    setLoadingMeetings(true);
    const res = await getMeetingsByDate(formData.date);
    if (res.success) setExistingMeetings(res.data);
    setLoadingMeetings(false);
  }, [open, formData.date]);

  useEffect(() => {
    fetchExistingMeetings();
  }, [fetchExistingMeetings]);

  useEffect(() => {
    if (!open || !formData.date) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`dialog_meetings_${formData.date}`)
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
  }, [open, formData.date, fetchExistingMeetings]);

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
    if (step === 2) {
      return !!formData.name && !!formData.phone && !!formData.cre_id;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await bookNewMeeting({
        leadData: {
          name: formData.name,
          phones: [formData.phone],
          source: formData.source,
          cre_id: formData.cre_id,
          address: {
            division: formData.division,
            district: formData.district,
            area: formData.area,
            address: formData.address
          },
          project_status: {
            status: formData.project_status,
            subStatus: formData.project_sub_status
          },
          requirements: formData.requirements
        },
        meetingData: {
          date: formData.date,
          slot: formData.slot,
          sales_executive_id: formData.sales_executive_id,
          visit_charge: formData.visit_charge,
          project_location: formData.project_location,
          status: "Fixed"
        },
        initialComment: formData.initial_comment
      });

      if (result.success) {
        toast.success("Meeting booked successfully!");
        setOpen(false);
        setStep(0);
        // Reset form or revalidate
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to book meeting");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 2));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[var(--brand-primary)] hover:bg-[#035170] shadow-lg shadow-[var(--brand-primary)]/20 gap-2 h-10 px-5 rounded-xl font-bold transition-all">
            <Plus className="h-4 w-4" />
            Book Meeting
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-250 border-none shadow-2xl rounded-2xl p-0 overflow-hidden bg-slate-50/95 backdrop-blur-xl">
        <DialogHeader className="bg-[var(--brand-primary)] p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              {step === 0 && <MapPin className="w-5 h-5 text-white" />}
              {step === 1 && <Calendar className="w-5 h-5 text-white" />}
              {step === 2 && <UserPlus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">
                {step === 0 && "Location Details"}
                {step === 1 && "Schedule Appointment"}
                {step === 2 && "Lead Information"}
              </DialogTitle>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest mt-0.5">
                Step {step + 1} of 3 • {step === 0 ? "Address" : step === 1 ? "Time & Team" : "Final Details"}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Division</Label>
                  <Input 
                    placeholder="e.g. Dhaka"
                    className="h-11 rounded-xl bg-white border-slate-200"
                    value={formData.division}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, division: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">District</Label>
                  <Input 
                    placeholder="e.g. Dhaka"
                    className="h-11 rounded-xl bg-white border-slate-200"
                    value={formData.district}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, district: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Area</Label>
                <Input 
                  placeholder="e.g. Uttara Sector 4"
                  className="h-11 rounded-xl bg-white border-slate-200"
                  value={formData.area}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, area: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Specific Address</Label>
                <Textarea 
                  placeholder="House, Road, Apartment details..."
                  className="min-h-24 rounded-xl bg-white border-slate-200 resize-none"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Meeting Date</Label>
                  <div className="relative">
                    <Input 
                      type="date"
                      className="h-9 rounded-lg bg-white border-slate-200 pl-9 text-xs"
                      value={formData.date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, date: e.target.value})}
                    />
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[var(--brand-primary)] uppercase">Selected Slot</p>
                  <p className="text-xs font-bold text-slate-700">
                    {formData.sales_executive_id && formData.slot 
                      ? `${salesTeams.find(u => u.id === formData.sales_executive_id)?.name} @ ${formData.slot}`
                      : "Tap a slot to book"}
                  </p>
                </div>
              </div>

              <MeetingSlotGrid 
                slots={slots}
                salesTeams={salesTeams}
                existingMeetings={existingMeetings}
                loading={loadingMeetings}
                selectedSalesId={formData.sales_executive_id}
                selectedSlotText={formData.slot}
                onSelect={(personId, slotText) => setFormData({...formData, sales_executive_id: personId, slot: slotText})}
                excludeUserId={formData.cre_id}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 max-h-120 overflow-y-auto px-1 animate-in fade-in slide-in-from-right-4 duration-300 scrollbar-hide">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Client Name</Label>
                  <Input 
                    placeholder="Full Name"
                    className="h-10 rounded-xl bg-white border-slate-200 shadow-sm"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Phone Number</Label>
                  <Input 
                    placeholder="+880..."
                    className="h-10 rounded-xl bg-white border-slate-200 shadow-sm"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Source</Label>
                  <Select onValueChange={v => setFormData({...formData, source: v as LeadSource})} value={formData.source}>
                    <SelectTrigger className="h-10 rounded-xl bg-white shadow-sm">
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Web">Website</SelectItem>
                      <SelectItem value="Phone">Phone / Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">CRE Responsible</Label>
                  <UserSelect 
                    users={allUsers}
                    value={formData.cre_id}
                    onSelect={(v) => setFormData({...formData, cre_id: v})}
                    placeholder="Select CRE"
                    excludeIds={formData.sales_executive_id ? [formData.sales_executive_id] : []}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Status</Label>
                  <Select onValueChange={v => setFormData({...formData, project_status: v})} value={formData.project_status}>
                    <SelectTrigger className="h-10 rounded-xl bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospective">Prospective</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Visit Charge</Label>
                  <Input 
                    type="number"
                    className="h-10 rounded-xl bg-white border-slate-200 shadow-sm"
                    value={formData.visit_charge}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, visit_charge: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Project Location</Label>
                <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, project_location: "Inside"})}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all",
                      formData.project_location === "Inside" ? "bg-white shadow-sm text-[var(--brand-primary)]" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    INSIDE DHAKA
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, project_location: "Outside"})}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all",
                      formData.project_location === "Outside" ? "bg-white shadow-sm text-[var(--brand-primary)]" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    OUTSIDE DHAKA
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Requirements / Tags</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a requirement..."
                    className="h-10 rounded-xl bg-white border-slate-200 flex-1 shadow-sm"
                    value={reqInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReqInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement} variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.requirements.map(r => (
                    <Badge key={r} variant="secondary" className="pl-2 pr-1 py-1 rounded-lg bg-slate-200/50 hover:bg-slate-200 border-none group transition-all">
                      <span className="text-[10px] font-bold text-slate-700">{r}</span>
                      <button 
                        type="button" 
                        onClick={() => removeRequirement(r)}
                        className="ml-1 p-0.5 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Initial Note / Comment</Label>
                <Textarea 
                  placeholder="Any specific notes for the meeting..."
                  className="min-h-20 rounded-xl bg-white border-slate-200 resize-none shadow-sm"
                  value={formData.initial_comment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, initial_comment: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer with explicit flex positioning */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={step === 0 || loading}
            className="h-11 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-50 group transition-all"
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {step < 2 ? (
              <Button 
                onClick={nextStep} 
                disabled={!validateStep()}
                className={cn(
                  "h-11 px-8 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[#035170] shadow-lg shadow-[var(--brand-primary)]/20 group font-bold transition-all",
                  !validateStep() && "opacity-50 grayscale cursor-not-allowed shadow-none"
                )}
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!validateStep() || loading}
                className="h-11 px-10 rounded-xl bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20 font-bold min-w-40 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Confirm Booking
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
