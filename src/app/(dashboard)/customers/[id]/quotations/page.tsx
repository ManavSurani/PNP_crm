"use client";

import { use, useState, useEffect, useCallback } from "react";
import { 
  Plus, Loader2, Lock, Unlock, ArrowLeft, 
  ChevronRight, Info, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AddQuotationModal from "@/components/quotations/AddQuotationModal";
import EditQuotationModal from "@/components/quotations/EditQuotationModal";
import QuotationTable from "@/components/quotations/QuotationTable";
import QuotationDetailDrawer from "@/components/quotations/QuotationDetailDrawer";

export default function CustomerQuotationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [custRes, quotRes] = await Promise.all([
        fetch(`/api/leads/${customerId}`),
        fetch(`/api/project-quotations?customer_id=${customerId}`)
      ]);
      
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomer(custData);
      }
      
      if (quotRes.ok) {
        const quotData = await quotRes.json();
        setQuotations(quotData);
        if (quotData.length > 0) {
          setIsLocked(quotData[0].isPriorityLocked);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReorder = async (orderedIds: string[]) => {
    // Optimistic update
    const newQuotations = [...quotations].sort((a, b) => 
      orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
    ).map((q, i) => ({ ...q, priority: i + 1 }));
    
    setQuotations(newQuotations);

    try {
      await fetch("/api/project-quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          type: "reorder",
          orderedIds
        })
      });
    } catch (error) {
      console.error("Error reordering:", error);
      fetchData(); // Revert on error
    }
  };

  const toggleLock = async () => {
    const nextLockedState = !isLocked;
    setIsLocked(nextLockedState);

    try {
      await fetch("/api/project-quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          type: "lock",
          locked: nextLockedState
        })
      });
    } catch (error) {
      console.error("Error toggling lock:", error);
      setIsLocked(!nextLockedState);
    }
  };

  const handleDelete = async (id: string) => {
    const quotation = quotations.find(q => q.id === id);
    if (!confirm(`Delete '${quotation?.field.name}' quotation? This will also remove all payment records.`)) return;

    try {
      const res = await fetch(`/api/project-quotations/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setQuotations(quotations.filter(q => q.id !== id));
      }
    } catch (error) {
      console.error("Error deleting quotation:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" strokeWidth={1.5} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Quotations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center justify-between px-2 pt-2 mb-4">
        <Link 
          href={`/customers/${customerId}`}
          className="group flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
        >
          <div className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors bg-white shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          BACK
        </Link>
        
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
          <Link href="/customers" className="text-slate-300 hover:text-slate-500 transition-colors">Customer Directory</Link>
          <ChevronRight className="h-3 w-3 text-slate-200" /> 
          <Link href={`/customers/${customerId}`} className="text-slate-300 hover:text-slate-500 transition-colors">{customer?.customerName?.toUpperCase() || "CUSTOMER"}</Link>
          <ChevronRight className="h-3 w-3 text-slate-200" /> 
          <span className="text-slate-900">QUOTATIONS</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-5 -mr-32 -mt-32" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-slate-500 text-sm font-medium">Manage project proposals, cost estimates & approvals for {customer?.project?.name || customer?.customerName}.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Plus className="h-4 w-4" /> Add New Field
        </button>
      </div>

      {/* Grand Total Summary */}
      {quotations.length > 0 && (() => {
        const grandTotal = quotations.reduce((s, q) => s + q.amount, 0);
        const grandPaid  = quotations.reduce((s, q) => s + q.payments.reduce((ps: number, p: any) => ps + p.amount, 0), 0);
        const grandPending = grandTotal - grandPaid;
        return (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Quoted", value: grandTotal, colorClass: "text-slate-900", borderClass: "border-slate-100", bgClass: "bg-white" },
              { label: "Total Paid", value: grandPaid, colorClass: "text-emerald-600", borderClass: "border-emerald-100", bgClass: "bg-emerald-50/50" },
              { label: "Outstanding", value: grandPending, colorClass: grandPending > 0 ? "text-amber-600" : "text-emerald-600", borderClass: grandPending > 0 ? "border-amber-100" : "border-emerald-100", bgClass: grandPending > 0 ? "bg-amber-50/50" : "bg-emerald-50/50" },
            ].map((card) => (
              <div key={card.label} className={`${card.bgClass} ${card.borderClass} border rounded-xl p-5 shadow-sm`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className={`text-2xl font-black mt-2 ${card.colorClass}`}>₹{card.value.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Table Section */}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Quotation Ledger</h3>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isLocked ? "Priority locked" : "Drag rows to set priority"}
                </span>
              </div>
           </div>

           <button 
             onClick={toggleLock}
             className={cn(
               "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
               isLocked 
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md" 
                : "bg-white border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600"
             )}
           >
             {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
             {isLocked ? "Priority Locked" : "Lock Priority"}
           </button>
        </div>

        <QuotationTable 
          quotations={quotations}
          isLocked={isLocked}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onEdit={(q) => {
            setSelectedQuotation(q);
            setIsEditModalOpen(true);
          }}
          onRowClick={(q) => {
            setSelectedQuotation(q);
            setIsDrawerOpen(true);
          }}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
         <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 text-slate-400">
           <Info className="h-5 w-5" />
         </div>
         <div>
            <p className="text-xs font-bold text-slate-900">Commercial Summary</p>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
              Total estimated project cost is calculated based on active field quotations. 
              Status updates automatically as payments are recorded against individual vendors.
            </p>
         </div>
      </div>

      <AddQuotationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customerId={customerId}
        onSuccess={fetchData}
      />

      <QuotationDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        quotation={selectedQuotation}
        onUpdate={fetchData}
      />

      <EditQuotationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        quotation={selectedQuotation}
        onSuccess={fetchData}
      />
    </div>
  );
}
