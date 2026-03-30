"use client";

import { Lead, LeadPayment } from "@/lib/types";
import { useState, useTransition } from "react";
import { addPayment } from "@/app/actions/leads";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Coins, TrendingUp, Wallet, Receipt } from "lucide-react";

interface LeadFinanceTabProps {
  lead: Lead;
}

export function LeadFinanceTab({ lead }: LeadFinanceTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Stats calculation
  const projectValue = lead.finance?.projectValue || 0;
  const totalPaid = lead.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalDue = projectValue - totalPaid;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await addPayment({
        lead_id: lead.id,
        amount: Number(formData.get("amount")),
        payment_method: formData.get("method") as string,
        payment_date: new Date(formData.get("date") as string).toISOString(),
        payment_status: "Paid",
        payment_note: formData.get("note") as string,
      });

      if (result.success) {
        toast.success("Payment recorded");
        setIsOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Stats */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Coins className="w-4 h-4 text-[var(--brand-primary)]" />
            Financial Overview
          </h3>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] h-8 gap-1.5 font-bold text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (৳)</Label>
                    <Input id="amount" name="amount" type="number" required placeholder="0.00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select name="method" defaultValue="Cash">
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Bkash">Bkash</SelectItem>
                        <SelectItem value="Nagad">Nagad</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Payment Date</Label>
                    <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Input id="note" name="note" placeholder="Reference or remark" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending} className="bg-[var(--brand-primary)] w-full font-bold">
                    {isPending ? "Recording..." : "Save Payment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Project Value</p>
            <p className="text-sm font-black text-slate-800">৳{projectValue.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50/50 border border-green-100">
            <p className="text-[10px] font-bold text-green-600/70 uppercase">Total Paid</p>
            <p className="text-sm font-black text-green-700">৳{totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
            <p className="text-[10px] font-bold text-red-600/70 uppercase">Balance Due</p>
            <p className="text-sm font-black text-red-700">৳{totalDue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Payment History List */}
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase py-2">Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2">Method</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lead.payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-slate-400 text-xs italic">
                  No payments recorded
                </TableCell>
              </TableRow>
            ) : (
              lead.payments?.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-slate-50/50 group">
                  <TableCell className="py-3">
                    <p className="text-xs font-bold text-slate-700">{new Date(payment.payment_date).toLocaleDateString()}</p>
                    {payment.payment_note && <p className="text-[10px] text-slate-400 line-clamp-1">{payment.payment_note}</p>}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 py-0">
                      {payment.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-xs font-black text-slate-800">৳{payment.amount.toLocaleString()}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
