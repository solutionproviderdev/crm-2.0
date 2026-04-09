"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import { updateLead, addLeadPhone } from "@/app/actions/leads";
import { toast } from "sonner";
import { 
  Plus, 
  X, 
  Check, 
  Loader2, 
  Phone,
  Edit2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface LeadPhoneNumbersProps {
  lead: Lead;
}

export function LeadPhoneNumbers({ lead }: LeadPhoneNumbersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const phones = lead.phones || [];

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await addLeadPhone(lead.id, newValue.trim());
      if (res.success) {
        toast.success("Phone number added");
        setNewValue("");
        setIsAdding(false);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to add phone number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    setIsLoading(true);
    const updated = phones.filter((_, i) => i !== index);
    
    try {
      const res = await updateLead(lead.id, { phones: updated });
      if (res.success) {
        toast.success("Phone number removed");
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to remove phone number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (index: number) => {
    if (!editValue.trim() || editValue === phones[index]) {
      setEditingIndex(null);
      return;
    }

    setIsLoading(true);
    const updated = [...phones];
    updated[index] = editValue.trim();

    try {
      const res = await updateLead(lead.id, { phones: updated });
      if (res.success) {
        toast.success("Phone number updated");
        setEditingIndex(null);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to update phone number");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Phone Numbers</span>
        </div>
        {!isAdding && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="h-7 px-2 text-[10px] font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 gap-1"
          >
            <Plus className="w-3 h-3" />
            Add New
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {phones.length === 0 && !isAdding && (
          <p className="text-xs text-slate-400 italic py-1">No phone numbers</p>
        )}

        {phones.map((phone, idx) => (
          <div key={idx} className="group relative">
            {editingIndex === idx ? (
              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                <Input
                  autoFocus
                  type="tel"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(idx);
                    if (e.key === "Escape") setEditingIndex(null);
                  }}
                  className="h-8 text-xs min-w-[150px] bg-white border-[var(--brand-primary)]/30"
                  disabled={isLoading}
                />
                <Button 
                  size="icon" 
                  onClick={() => handleUpdate(idx)}
                  className="h-8 w-8 bg-green-500 hover:bg-green-600 shrink-0"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </Button>
                <Button 
                  variant="ghost"
                  size="icon" 
                  onClick={() => setEditingIndex(null)}
                  className="h-8 w-8 text-slate-400 shrink-0"
                  disabled={isLoading}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Badge 
                variant="outline" 
                className={cn(
                  "bg-slate-50 hover:bg-white text-slate-700 font-bold py-1.5 pl-3 pr-2 flex items-center gap-2 border-slate-200 transition-all cursor-pointer group/badge",
                  isLoading && "opacity-50 pointer-events-none"
                )}
                onClick={() => {
                  setEditingIndex(idx);
                  setEditValue(phone);
                }}
              >
                <span className="text-sm">{phone}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover/badge:opacity-100 transition-opacity">
                  <span onClick={(e) => { e.stopPropagation(); setEditingIndex(idx); setEditValue(phone); }} className="p-0.5 rounded-md hover:bg-slate-200 transition-colors">
                    <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                  </span>
                  <span onClick={(e) => { e.stopPropagation(); handleDelete(idx); }} className="p-0.5 rounded-md hover:bg-red-50 transition-colors">
                    <X className="w-2.5 h-2.5 text-slate-400 hover:text-red-500" />
                  </span>
                </div>
              </Badge>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
            <Input
              autoFocus
              type="tel"
              placeholder="e.g. 01712345678"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setIsAdding(false);
              }}
              className="h-8 text-xs min-w-[180px] border-[var(--brand-primary)]/50 focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={handleAdd}
              className="h-8 w-8 bg-[var(--brand-primary)] text-white shrink-0"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </Button>
            <Button 
              variant="ghost"
              size="icon" 
              onClick={() => setIsAdding(false)}
              className="h-8 w-8 text-slate-400 shrink-0"
              disabled={isLoading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
