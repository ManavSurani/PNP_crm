"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import { Printer, MessageCircle, ArrowLeft, Loader2, Check, Layout, Box, Star, Zap, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function QuotationPDFPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quotation, setQuotation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotations/${id}`)
      .then(res => res.json())
      .then(data => {
        setQuotation(data);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!quotation) return <div>Quotation not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  const prepareWhatsAppMessage = () => {
    const text = `Hello ${quotation.lead.customerName},\n\nPlease find the project proposal and estimate (${quotation.quotationNo}) from PNP Interior Consultant.\nPackage: ${quotation.packageType?.replace("_", " ")}\nTotal Investment: ₹${quotation.finalTotal.toLocaleString()}\n\nLooking forward to working with you!\n\nBest Regards,\nPNP Interior Team`;
    const encoded = encodeURI(text);
    window.open(`https://wa.me/${quotation.lead.contactNumber}?text=${encoded}`, "_blank");
  };

  const pkgIcons: any = {
    DESIGN_ONLY: Layout,
    MATERIALS_ONLY: Box,
    FULL_COMBO: Star,
    CUSTOM: Zap
  };
  const PkgIcon = pkgIcons[quotation.packageType] || Star;

  return (
    <div className="max-w-5xl mx-auto pb-40 px-4 md:px-0">
      {/* Controls - Hidden during Print Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 print:hidden gap-6 bg-slate-100 p-6 rounded-3xl border border-slate-200">
        <Link href="/quotations" className="text-slate-900 border-2 border-white bg-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all">
          <ArrowLeft className="h-4 w-4" /> Pipeline
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={prepareWhatsAppMessage} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Send Proposal
          </button>
          <button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print / Export
          </button>
        </div>
      </div>

      {/* Official A4 Print Document */}
      <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0 min-h-[1100px] w-full text-slate-900">
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-[6px] border-slate-900 pb-12">
          <div>
            <h1 className="text-5xl font-bold tracking-tighter text-slate-900 uppercase leading-none mb-4">PROJECT PROPOSAL</h1>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest italic">Estimate Ref</div>
              <p className="font-bold text-slate-900 text-xl tracking-tight">{quotation.quotationNo}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="h-16 w-16 bg-slate-900 mb-4 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl font-bold">P</span>
             </div>
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">PNP Interior Consultant</p>
             <p className="text-slate-500 font-bold text-xs mt-1 italic">Generated: {format(new Date(quotation.createdAt), "MMMM dd, yyyy")}</p>
          </div>
        </div>

        {/* Client & Project Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 mb-20">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Prepared For</h3>
            <div>
              <p className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{quotation.lead.customerName}</p>
              <p className="text-slate-500 font-bold mt-1">Ph: {quotation.lead.contactNumber}</p>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-xs">{quotation.lead.fullAddress || "Direct Project Site Location"}</p>
            </div>
          </div>
          <div className="flex flex-col items-end text-right space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Engagement Model</h3>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100 ring-4 ring-slate-50">
               <div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">{quotation.packageType?.replace("_", " ")}</p>
                  <p className="text-[10px] text-slate-400 font-bold italic">{quotation.lead.serviceType.replace("_", " ")}</p>
               </div>
               <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                  <PkgIcon className="h-6 w-6 text-indigo-600" />
               </div>
            </div>
          </div>
        </div>

        {/* Financial Line Items */}
        <div className="space-y-8">
           <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full" /> Financial Breakdown
           </h3>
           <table className="w-full text-sm">
             <thead>
               <tr className="border-b-2 border-slate-900">
                 <th className="py-4 text-left font-bold uppercase text-[10px] tracking-widest text-slate-400">Specifications & Items</th>
                 <th className="py-4 text-center font-bold uppercase text-[10px] tracking-widest text-slate-400 w-24">Qty</th>
                 <th className="py-4 text-right font-bold uppercase text-[10px] tracking-widest text-slate-400 w-32">Unit Price</th>
                 <th className="py-4 text-right font-bold uppercase text-[10px] tracking-widest text-slate-900 w-32">Net Total</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {quotation.items.map((item: any) => (
                 <tr key={item.id}>
                   <td className="py-5 text-slate-900 font-bold">{item.description}</td>
                   <td className="py-5 text-center text-slate-500 font-bold">{item.quantity}</td>
                   <td className="py-5 text-right text-slate-500 font-bold">₹{item.unitPrice.toLocaleString()}</td>
                   <td className="py-5 text-right text-slate-900 font-bold">₹{item.totalPrice.toLocaleString()}</td>
                 </tr>
               ))}
               {quotation.items.length === 0 && (
                 <tr>
                   <td colSpan={4} className="py-5 text-slate-400 italic text-center font-bold">No line items recorded.</td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>

        {/* Professional Fees & Project Costs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-16 pb-16 border-b border-slate-100">
           <div className="space-y-10">
              {/* Work Scope */}
              {quotation.workScope && (
                <div className="space-y-3">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Work Scope Brief</h4>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap px-4 border-l-4 border-slate-100">
                      {quotation.workScope}
                   </p>
                </div>
              )}
              {/* Timeline */}
              {quotation.projectTimeline && (
                <div className="space-y-3">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Delivery Timeline</h4>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap px-4 border-l-4 border-slate-100">
                      {quotation.projectTimeline}
                   </p>
                </div>
              )}
           </div>

           <div className="bg-slate-50 rounded-[2.5rem] p-10 space-y-6">
              <div className="space-y-3">
                 <CostRow label="Itemized Scope Total" value={quotation.items.reduce((acc: number, item: any) => acc + item.totalPrice, 0)} />
                 {quotation.designCost > 0 && <CostRow label="Professional Design Fees" value={quotation.designCost} />}
                 {quotation.materialCost > 0 && <CostRow label="Base Material Supply" value={quotation.materialCost} />}
                 {quotation.labourCost > 0 && <CostRow label="Technical Labour" value={quotation.labourCost} />}
                 {quotation.supervisionCharges > 0 && <CostRow label="Supervision & Management" value={quotation.supervisionCharges} />}
                 {quotation.transportCost > 0 && <CostRow label="Logistics & Handling" value={quotation.transportCost} />}
                 {quotation.siteVisitCharges > 0 && <CostRow label="Direct Site Visits" value={quotation.siteVisitCharges} />}
              </div>

              <div className="pt-6 border-t border-slate-200 mt-6 space-y-4">
                 <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
                    <span>Gross Project Value</span>
                    <span className="text-slate-900">₹{(quotation.finalTotal - quotation.gstAmount + quotation.discount).toLocaleString()}</span>
                 </div>
                 {quotation.discount > 0 && (
                   <div className="flex justify-between items-center text-xs font-bold uppercase text-rose-500">
                      <span>Inaugural Discount</span>
                      <span>- ₹{quotation.discount.toLocaleString()}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
                    <span>Taxation (GST {quotation.gstPercentage}%)</span>
                    <span className="text-slate-900">₹{quotation.gstAmount.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center pt-6 mt-4 border-t-4 border-slate-900">
                    <span className="text-xl font-bold text-slate-900 uppercase italic">NET Total</span>
                    <span className="text-4xl font-bold text-indigo-700 tracking-tighter">₹{quotation.finalTotal.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-16">
           <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Payment Milestones</h4>
              <div className="p-8 bg-slate-900 text-white rounded-[2rem] text-xs leading-relaxed font-bold tracking-wide shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16" />
                 <p className="whitespace-pre-wrap relative z-10">{quotation.milestoneTerms || "Standard Terms: 50% Advance, 40% Completion, 10% Handover."}</p>
              </div>
           </div>
           <div className="flex flex-col justify-end items-end text-right">
              <div className="w-48 h-px bg-slate-900 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-900">Authorized Signatory</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic tracking-widest">Validation Code: {id.slice(0, 8).toUpperCase()}</p>
           </div>
        </div>

        <div className="mt-24 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-loose">
            PROPOSAL SUBJECT TO FINAL SITE MEASUREMENTS. GST REGISTERED ESTIMATE. <br/>
            VALID FOR 15 CALENDAR DAYS. ALL RIGHTS RESERVED - PNP INTERIOR CONSULTANT.
          </p>
        </div>
      </div>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
      <span className="uppercase tracking-widest opacity-80">{label}</span>
      <span className="font-bold text-slate-900">₹{value.toLocaleString()}</span>
    </div>
  );
}
