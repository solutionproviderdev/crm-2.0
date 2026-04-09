"use client";

import { Lead } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Coins, Receipt, ArrowUpCircle, Wallet } from "lucide-react";

interface LeadFinanceSidebarProps {
  lead: Lead;
}

export function LeadFinanceSidebar({ lead }: LeadFinanceSidebarProps) {
  const projectValue = lead.finance?.projectValue || 0;
  const totalPaid = lead.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalDue = projectValue - totalPaid;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Project Value</p>
              <p className="text-sm font-black text-slate-800 tracking-tight">৳{projectValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center justify-between p-3 rounded-xl bg-green-50/50 border border-green-100 shadow-sm">
            <div>
              <p className="text-[10px] font-black text-green-600/70 uppercase tracking-tighter">Paid</p>
              <p className="text-xs font-black text-green-700 tracking-tight">৳{totalPaid.toLocaleString()}</p>
            </div>
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
          </div>

          <div className="flex-1 flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100 shadow-sm">
            <div>
              <p className="text-[10px] font-black text-red-600/70 uppercase tracking-tighter">Due</p>
              <p className="text-xs font-black text-red-700 tracking-tight">৳{totalDue.toLocaleString()}</p>
            </div>
            <Wallet className="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Payments</label>
        {lead.payments && lead.payments.length > 0 ? (
          <div className="space-y-1.5">
            {lead.payments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-colors shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-800 tracking-tight">
                    {new Date(payment.payment_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{payment.payment_method}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-800">৳{payment.amount.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-green-600">SUCCESS</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <p className="text-[10px] font-bold text-slate-400 italic">No payments recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
