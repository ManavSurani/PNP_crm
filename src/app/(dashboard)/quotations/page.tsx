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
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-indigo-600 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Quotations</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Client estimates & conversion pipeline</p>
        </div>
        <Link
          href="/quotations/new"
          className="relative z-10 bg-indigo-600 hover:bg-indigo-500 px-8 py-5 rounded-2xl text-white font-black flex items-center gap-3 text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-indigo-500/30"
        >
          <Plus className="h-5 w-5" /> Build Quotation
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Pipeline Value", val: `₹${totalValue.toLocaleString()}`, icon: IndianRupee, color: "text-indigo-600 bg-indigo-50" },
          { label: "Accepted / Won", val: accepted, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Awaiting Response", val: pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-center">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-50">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-5 pl-8 pr-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quotation</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimate</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-5 pl-8 pr-3">
                    <p className="font-black text-indigo-600 uppercase">{q.quotationNo}</p>
                    <p className="text-sm text-slate-900 font-bold mt-0.5">{q.lead.customerName}</p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{format(new Date(q.createdAt), "dd MMM yyyy")}</p>
                  </td>
                  <td className="px-3 py-5">
                    <p className="text-sm font-black text-slate-700 uppercase">{q.lead.serviceType.replace(/_/g, " ")}</p>
                  </td>
                  <td className="px-3 py-5">
                    <p className="text-xl font-black text-slate-900">₹{q.finalTotal.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">M: ₹{q.materialCost.toLocaleString()} | L: ₹{q.labourCost.toLocaleString()}</p>
                  </td>
                  <td className="px-3 py-5">
                    <span className={cn("px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest", STATUS_COLORS[q.status] || "bg-slate-100 text-slate-600")}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-3 py-5">
                    <div className="flex items-center gap-2">
                      {/* P4: WhatsApp Share Link */}
                      <button
                        onClick={() => sendWhatsApp(q)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                        title="Send via WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WA
                      </button>
                      <Link
                        href={`/quotations/${q.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        title="PDF View"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        PDF
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No quotations yet. Create one for a lead!</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
