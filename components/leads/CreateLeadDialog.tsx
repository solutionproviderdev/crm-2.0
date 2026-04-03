"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
import { createLead } from "@/app/actions/leads";
import { User, LeadSource } from "@/lib/types";
import { toast } from "sonner";
import { UserSelect } from "./UserSelect";
import { useWatch } from "react-hook-form";

interface CreateLeadForm {
  name: string;
  source: LeadSource;
  status: string;
  phone: string;
  cre_id: string;
  sales_executive_id: string;
}

interface CreateLeadDialogProps {
  users: User[];
}

export function CreateLeadDialog({ users }: CreateLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, control } = useForm<CreateLeadForm>({
    defaultValues: {
      name: "",
      source: "Facebook" as LeadSource,
      status: "New",
      phone: "",
      cre_id: "",
      sales_executive_id: "",
    }
  });

  const selectedCre = useWatch({ control, name: "cre_id" });
  const selectedSales = useWatch({ control, name: "sales_executive_id" });

  const onSubmit = async (data: CreateLeadForm) => {
    setLoading(true);
    try {
      const result = await createLead({
        name: data.name,
        source: data.source,
        status: data.status,
        phones: data.phone ? [data.phone] : [],
        cre_id: data.cre_id || undefined,
        sales_executive_id: data.sales_executive_id || undefined,
        address: {},
        project_status: { status: null, subStatus: null },
        finance: {}
      });

      if (result.success) {
        toast.success("Lead created successfully!");
        setOpen(false);
        reset();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-(--brand-primary) hover:bg-[#035170] shadow-lg shadow-(--brand-primary)/20 gap-2 h-10 px-5 rounded-xl font-bold transition-all">
          <Plus className="h-4 w-4" />
          Create Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125 border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-(--brand-primary) p-6 text-white">
          <DialogTitle className="text-xl font-bold">New Prospect Lead</DialogTitle>
          <p className="text-white/70 text-xs mt-1">
            Fill in the details to add a new lead to the CRM
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold text-gray-700 uppercase tracking-tight">Full Name</Label>
              <Input 
                id="name" 
                {...register("name", { required: true })} 
                placeholder="Client Name"
                className="h-11 rounded-lg border-gray-200 focus:ring-(--brand-primary)/20 focus:border-(--brand-primary)/50" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-xs font-bold text-gray-700 uppercase tracking-tight">Phone Number</Label>
                <Input 
                  id="phone" 
                  {...register("phone")} 
                  placeholder="e.g. +880..."
                  className="h-11 rounded-lg border-gray-200 focus:ring-(--brand-primary)/20 focus:border-(--brand-primary)/50"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-tight">Source</Label>
                <Select onValueChange={(v) => setValue("source", v as LeadSource)} defaultValue="Facebook">
                  <SelectTrigger className="h-11 rounded-lg border-gray-200">
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Phone">Phone / Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-tight">Assigned CRE</Label>
              <UserSelect 
                users={users}
                value={selectedCre}
                onSelect={(v) => setValue("cre_id", v)}
                placeholder="Select CRE"
                excludeIds={selectedSales ? [selectedSales] : []}
                className="h-11"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-tight">Sales Executive</Label>
              <UserSelect 
                users={users}
                value={selectedSales}
                onSelect={(v) => setValue("sales_executive_id", v)}
                placeholder="Select Executive"
                excludeIds={selectedCre ? [selectedCre] : []}
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 rounded-xl bg-(--brand-primary) hover:bg-[#035170] min-w-30"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
