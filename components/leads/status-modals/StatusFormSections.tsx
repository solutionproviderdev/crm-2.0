"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// --- Comment Section ---
export function CommentSection({ 
  value, 
  onChange, 
  required = false 
}: { 
  value: string; 
  onChange: (val: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="status-comment">Comment {required && "*"}</Label>
      <Textarea
        id="status-comment"
        placeholder="Add context to this status change..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        required={required}
      />
    </div>
  );
}

// --- Project Financials Section ---
export function ProjectFinancialsSection({
  projectValue,
  clientsBudget,
  onProjectValueChange,
  onClientsBudgetChange,
  required = false
}: {
  projectValue: string;
  clientsBudget: string;
  onProjectValueChange: (val: string) => void;
  onClientsBudgetChange: (val: string) => void;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="project-value">Project Value {required && "*"}</Label>
        <Input
          id="project-value"
          type="number"
          placeholder="0.00"
          value={projectValue}
          onChange={(e) => onProjectValueChange(e.target.value)}
          required={required}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clients-budget">Client&apos;s Budget</Label>
        <Input
          id="clients-budget"
          type="number"
          placeholder="0.00"
          value={clientsBudget}
          onChange={(e) => onClientsBudgetChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// --- Follow-up Section ---
export function FollowUpSection({
  value,
  onChange,
  required = false
}: {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="follow-up-time">Next Follow-up Time {required && "*"}</Label>
      <Input
        id="follow-up-time"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

// --- Payment Section (for Sold) ---
export function PaymentSection({
  data,
  onChange
}: {
  data: {
    soldAmount: string;
    soldDate: string;
    paymentAmount: string;
    paymentMethod: string;
    paymentNote: string;
  };
  onChange: (field: string, value: string) => void;
}) {
  const paymentMethodOptions = [
    'Cash', 'Cheque', 'Bank Transfer', 'Bkash', 'Nagad', 'Rocket', 'SSL E-Commerce'
  ];

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="text-sm font-semibold text-slate-900">Sale & Payment Details</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sold-amount">Sold Amount*</Label>
          <Input
            id="sold-amount"
            type="number"
            value={data.soldAmount}
            onChange={(e) => onChange("soldAmount", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sold-date">Sold Date*</Label>
          <Input
            id="sold-date"
            type="date"
            value={data.soldDate}
            onChange={(e) => onChange("soldDate", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment-amount">Payment Amount</Label>
          <Input
            id="payment-amount"
            type="number"
            value={data.paymentAmount}
            onChange={(e) => onChange("paymentAmount", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select 
            value={data.paymentMethod} 
            onValueChange={(val) => onChange("paymentMethod", val)}
          >
            <SelectTrigger id="payment-method">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethodOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-note">Payment Note</Label>
        <Input
          id="payment-note"
          placeholder="e.g. Transaction ID, Check number..."
          value={data.paymentNote}
          onChange={(e) => onChange("paymentNote", e.target.value)}
        />
      </div>
    </div>
  );
}

// --- Project Status Section (for Ongoing) ---
export function ProjectStatusSection({
  status,
  subStatus,
  onStatusChange,
  onSubStatusChange
}: {
  status: string;
  subStatus: string;
  onStatusChange: (val: string) => void;
  onSubStatusChange: (val: string) => void;
}) {
  const statusOptions = ['Ongoing', 'Ready', 'Renovation'];
  const subStatusOptions: Record<string, string[]> = {
    Ongoing: ['Roof Casting', 'Brick Wall', 'Plaster', 'Pudding', 'Two Coat Paint'],
    Ready: ['Tiles Complete', 'Final Paint Done', 'Handed Over', 'Staying in the Apartment'],
    Renovation: ['Interior Work Complete'],
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="project-status">Project Status*</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="project-status">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-sub-status">Sub Status*</Label>
        <Select 
          value={subStatus} 
          onValueChange={onSubStatusChange}
          disabled={!status}
        >
          <SelectTrigger id="project-sub-status">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(subStatusOptions[status] || []).map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
