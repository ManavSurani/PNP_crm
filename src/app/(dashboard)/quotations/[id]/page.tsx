"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Printer, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function QuotationPDFPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotations/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setQuotation(data);
        setIsLoading(false);
      });
  }, [params.id]);

  if (isLoading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!quotation) return <div>Quotation not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  const prepareWhatsAppMessage = () => {
    const text = `Hello ${quotation.lead.customerName},\n\nPlease find the details for your estimate (${quotation.quotationNo}) below:\nTotal Amount: ₹${quotation.finalTotal.toLocaleString()}\n\nLooking forward to working with you. Let us know if you have any questions!\n\nBest Regards,\nPNP Interior Consultants`;
    const encoded = encodeURI(text);
    window.open(`https://wa.me/${quotation.lead.contactNumber}?text=${encoded}`, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Controls - Hidden during Print Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 print:hidden gap-4">
        <Link href="/quotations" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Quotations
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={prepareWhatsAppMessage} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Send via WhatsApp
          </button>
          <button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
            <Printer className="h-4 w-4" /> Export PDF / Print
          </button>
        </div>
      </div>

      {/* Official A4 Print Document */}
      <div className="bg-white rounded-lg p-8 sm:p-12 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 min-h-[1056px] w-full">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">OFFICIAL ESTIMATE</h1>
            <p className="text-slate-500 tracking-widest uppercase text-sm font-semibold mt-2">PNP Interior Consultant</p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-semibold text-slate-900 text-lg">Quotation #: {quotation.quotationNo}</p>
            <p className="text-slate-500">Date: {format(new Date(quotation.createdAt), "MMMM d, yyyy")}</p>
            {quotation.expiryDate && <p className="text-slate-500">Valid Until: {format(new Date(quotation.expiryDate), "MMM d, yyyy")}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8 mb-12">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estimate For</h3>
            <p className="text-xl font-bold text-slate-900">{quotation.lead.customerName}</p>
            <p className="text-slate-600 mt-1 flex items-center gap-2 mt-2">Ph: {quotation.lead.contactNumber}</p>
            <p className="text-slate-600 break-words mt-1">{quotation.lead.fullAddress || "No address provided."}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Context</h3>
            <p className="text-slate-900 font-medium">{quotation.lead.serviceType.replace("_", " ")}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">
              {quotation.status}
            </span>
          </div>
        </div>

        <table className="w-full mt-10 mb-8">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item Description</th>
              <th className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-24">QTY</th>
              <th className="py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Unit Price</th>
              <th className="py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotation.items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-4 text-slate-900 font-medium">{item.description}</td>
                <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                <td className="py-4 text-right text-slate-600">₹{item.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="py-4 text-right text-slate-900 font-semibold">₹{item.totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Base Cost Sections */}
        <div className="flex justify-end pt-6 mb-8 w-full">
          <div className="w-full sm:w-1/2 space-y-4">
            <div className="flex justify-between items-center text-slate-600">
              <span>Items Total</span>
              <span className="font-medium">₹{quotation.items.reduce((acc: number, item: any) => acc + item.totalPrice, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            
            {(quotation.materialCost > 0 || quotation.labourCost > 0 || quotation.transportCost > 0) && (
              <div className="py-3 border-y border-slate-100 space-y-3">
                {quotation.materialCost > 0 && (
                  <div className="flex justify-between items-center text-sm text-slate-500">
                    <span>Base Material Cost</span>
                    <span>₹{quotation.materialCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                {quotation.labourCost > 0 && (
                  <div className="flex justify-between items-center text-sm text-slate-500">
                    <span>Base Labour Cost</span>
                    <span>₹{quotation.labourCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                {quotation.transportCost > 0 && (
                  <div className="flex justify-between items-center text-sm text-slate-500">
                    <span>Transport / Handling</span>
                    <span>₹{quotation.transportCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-600">Subtotal Before GST</span>
              <span className="font-semibold text-slate-900">
                ₹{(quotation.finalTotal - quotation.gstAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>

            {quotation.gstPercentage > 0 && (
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <span className="text-slate-600">Tax / GST ({quotation.gstPercentage}%)</span>
                <span className="font-semibold text-slate-900">
                  ₹{quotation.gstAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 pb-6 border-b-2 border-slate-900">
              <span className="text-xl font-bold tracking-tight text-slate-900">Final Total</span>
              <span className="text-2xl font-black text-indigo-700">₹{quotation.finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        <div className="text-slate-400 text-sm italic mt-20 text-center">
          Note: This is an auto-generated estimate by PNP Interior Consultant. Quotation validity is subject to material price fluctuations.
        </div>
      </div>
    </div>
  );
}
