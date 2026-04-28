"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileText, Plus, Printer, Loader2, IndianRupee, CheckCircle2,
  Clock, MessageCircle, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type Quotation = {
  id: string;
  quotationNo: string;
  finalTotal: number;
  materialCost: number;
  labourCost: number;
  status: string;
  createdAt: string;
  lead: { customerName: string; serviceType: string; contactNumber: string };
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-sky-100 text-sky-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quotations")
      .then(res => res.json())
      .then(data => { setQuotations(data); setIsLoading(false); });
  }, []);

  const totalValue = quotations.reduce((s, q) => s + q.finalTotal, 0);
  const accepted = quotations.filter(q => q.status === "ACCEPTED").length;
  const pending = quotations.filter(q => q.status === "SENT").length;

  const sendWhatsApp = (q: Quotation) => {
    const msg = encodeURIComponent(
      `🪵 *PNP Furniture — Quotation ${q.quotationNo}*\n\n` +
      `Dear *${q.lead.customerName}*,\n\n` +
      `We're pleased to share your estimate for *${q.lead.serviceType.replace(/_/g, " ")}*.\n\n` +
      `💰 *Total Estimate: ₹${q.finalTotal.toLocaleString()}*\n` +
      `📋 Material: ₹${q.materialCost.toLocaleString()} | Labour: ₹${q.labourCost.toLocaleString()}\n\n` +
      `Please confirm your approval to proceed.\n\nThank you! 🙏`
    );
    window.open(`https://wa.me/${q.lead.contactNumber.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your service estimates and deal conversions.</p>
        </div>
        <Link
          href="/quotations/new"
          className="relative z-10 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-indigo-700 transition-all active:scale-95 border border-indigo-500/20"
        >
          <Plus className="h-4 w-4" /> Create New Quotation
        </Link>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Quote Value", val: `₹${totalValue.toLocaleString()}`, icon: IndianRupee, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Approved Quotes", val: accepted, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Sent Quotes", val: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors", card.bg, card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className="text-xl font-semibold text-slate-900 mt-0.5">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
             <span className="text-sm font-medium">Fetching Estimates...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote Info</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Type</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-4 text-right pr-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {quotations.map(q => (
                  <tr key={q.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-5 pl-8 pr-3">
                      <p className="text-xs font-bold text-primary tracking-wide">{q.quotationNo}</p>
                      <p className="text-sm text-slate-900 font-semibold mt-0.5">{q.lead.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">{format(new Date(q.createdAt), "dd MMM yyyy")}</p>
                    </td>
                    <td className="px-3 py-5">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-tight">{q.lead.serviceType.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-3 py-5">
                      <p className="text-base font-bold text-slate-900">₹{q.finalTotal.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">M: ₹{q.materialCost.toLocaleString()} | L: ₹{q.labourCost.toLocaleString()}</p>
                    </td>
                    <td className="px-3 py-5">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
                        q.status === "DRAFT" ? "bg-slate-50 text-slate-600 border-slate-200" :
                        q.status === "SENT" ? "bg-sky-50 text-sky-700 border-sky-200" :
                        q.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-rose-50 text-rose-700 border-rose-200"
                      )}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-3 py-5 pr-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => sendWhatsApp(q)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition-all border border-emerald-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </button>
                        <Link
                          href={`/quotations/${q.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold transition-all border border-slate-200"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Document
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {quotations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                       <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                       <h3 className="text-sm font-semibold text-slate-900">No quotations found</h3>
                       <p className="text-xs text-slate-500 mt-1">Generate your first estimate from the Lead pipeline.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
