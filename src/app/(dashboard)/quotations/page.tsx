"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Plus, Search, Printer, Send, Loader2 } from "lucide-react";

type Quotation = {
  id: string;
  quotationNo: string;
  finalTotal: number;
  status: string;
  createdAt: string;
  lead: { customerName: string; serviceType: string };
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quotations")
      .then(res => res.json())
      .then(data => {
        setQuotations(data);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Quotations & Estimates</h1>
          <p className="text-sm text-slate-500">Manage all generated estimates and their current status.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/quotations/new"
            className="block rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Build New Quotation
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="ml-3 font-medium">Loading quotations...</span>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6 uppercase">ID & Customer</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Service</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Final Total</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                    <div className="font-semibold text-indigo-600">{q.quotationNo}</div>
                    <div className="text-sm font-medium text-slate-900">{q.lead.customerName}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-500">{q.lead.serviceType.replace("_", " ")}</td>
                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-500">{format(new Date(q.createdAt), "MMM d, yyyy")}</td>
                  <td className="whitespace-nowrap px-3 py-5 font-bold text-slate-900 border-l border-slate-100">
                    ₹{q.finalTotal.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-5">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {q.status}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                    <Link href={`/quotations/${q.id}`} className="text-slate-500 hover:text-indigo-600 transition-colors p-2 text-center inline-flex items-center gap-1 shadow-sm border border-slate-200 rounded-md">
                      <Printer className="h-4 w-4" /> PDF View
                    </Link>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">No quotations generated yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
