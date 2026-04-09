"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import { updateLead } from "@/app/actions/leads";
import { toast } from "sonner";
import { 
  MapPin, 
  Check, 
  X, 
  Loader2,
  Edit2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface LeadAddressEditorProps {
  lead: Lead;
}

export function LeadAddressEditor({ lead }: LeadAddressEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    division: lead.address?.division || "",
    district: lead.address?.district || "",
    area: lead.address?.area || "",
    address: lead.address?.address || ""
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await updateLead(lead.id, { address: formData });
      if (res.success) {
        toast.success("Address updated");
        setIsEditing(false);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to update address");
    } finally {
      setIsLoading(false);
    }
  };

  const fullAddress = [
    formData.address,
    formData.area,
    formData.district,
    formData.division
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Office/Home Address</span>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="h-7 px-2 text-[10px] font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-[var(--brand-primary)]/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 px-1">Division</label>
              <Input 
                value={formData.division}
                onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                placeholder="Division"
                className="h-8 text-xs bg-white"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 px-1">District</label>
              <Input 
                value={formData.district}
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                placeholder="District"
                className="h-8 text-xs bg-white"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 px-1">Area / Police Station</label>
            <Input 
              value={formData.area}
              onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              placeholder="e.g. Uttara, Sector 4"
              className="h-8 text-xs bg-white"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 px-1">House, Road, Apartment Details</label>
            <Input 
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g. House 12, Road 4A"
              className="h-8 text-xs bg-white"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2 pt-1">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="flex-1 bg-[var(--brand-primary)] text-white font-bold h-8 text-xs gap-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save Address
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => {
                setFormData({
                  division: lead.address?.division || "",
                  district: lead.address?.district || "",
                  area: lead.address?.area || "",
                  address: lead.address?.address || ""
                });
                setIsEditing(false);
              }}
              className="px-3 border-slate-200 text-slate-500 h-8 text-xs font-bold"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="p-3 rounded-lg bg-slate-100/50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
        >
          {fullAddress ? (
            <p className="text-sm font-semibold text-slate-700 leading-relaxed uppercase tracking-tight">
              {fullAddress}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">No address provided. Click to add.</p>
          )}
        </div>
      )}
    </div>
  );
}
