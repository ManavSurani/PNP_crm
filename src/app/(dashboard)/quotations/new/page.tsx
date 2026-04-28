"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Trash2, Loader2, Save, FileText, 
  IndianRupee, Percent, Calendar, Briefcase, 
  ChevronRight, Layout, Box, Star, Zap, Info, ArrowLeft,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const PACKAGES = [
  { id: "DESIGN_ONLY", name: "Design Only", icon: Layout, color: "text-sky-500", bg: "bg-sky-50" },
  { id: "MATERIALS_ONLY", name: "Materials Only", icon: Box, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "FULL_COMBO", name: "Full Combo", icon: Star, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "CUSTOM", name: "Custom Hybrid", icon: Zap, color: "text-indigo-500", bg: "bg-indigo-50" }
];

export default function QuotationBuilder() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [leadId, setLeadId] = useState("");
  const [packageType, setPackageType] = useState("FULL_COMBO");
  const [designCost, setDesignCost] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [labourCost, setLabourCost] = useState(0);
  const [transportCost, setTransportCost] = useState(0);
  const [supervisionCharges, setSupervisionCharges] = useState(0);
  const [siteVisitCharges, setSiteVisitCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(18);
  
  const [workScope, setWorkScope] = useState("");
  const [milestoneTerms, setMilestoneTerms] = useState("");
  const [projectTimeline, setProjectTimeline] = useState("");

  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    fetch("/api/leads")
      .then(res => res.json())
      .then(data => setLeads(data));
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    const itemsTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    return (
      designCost + 
      materialCost + 
      labourCost + 
      transportCost + 
      supervisionCharges + 
      siteVisitCharges + 
      itemsTotal
    );
  };

  const subtotal = calculateSubtotal();
  const amountAfterDiscount = subtotal - discount;
  const gstAmount = (amountAfterDiscount * gstPercentage) / 100;
  const finalTotal = amountAfterDiscount + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return alert("Select a Lead first");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId, 
          packageType,
          designCost,
          materialCost, 
          labourCost, 
          transportCost, 
          supervisionCharges,
          siteVisitCharges,
          discount,
          gstPercentage, 
          items,
          workScope,
          milestoneTerms,
          projectTimeline
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/quotations/${data.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-32 font-sans">
      {/* Dynamic Header Hub */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10 space-y-4">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold uppercase text-[10px] tracking-widest transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" /> Pipeline Inventory
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Strategy & Estimation Hub</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Construct high-fidelity project proposals with integrated fiscal intelligence.</p>
          </div>
        </div>
        <div className="relative z-10">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex items-center gap-8 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Net Value</p>
              <p className="text-3xl font-bold text-primary tracking-tight">₹{finalTotal.toLocaleString()}</p>
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <button
               onClick={handleSubmit}
               disabled={isSubmitting}
               className="bg-primary hover:bg-primary/95 px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
            >
               {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Publish Final
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Config */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-primary"><FileText className="h-5 w-5" /></div>
               <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Identity Configuration</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Qualified Candidate *</label>
                  <select 
                    required
                    className={inputCls}
                    value={leadId}
                    onChange={e => setLeadId(e.target.value)}
                  >
                    <option value="" disabled>-- Select Enterprise Lead --</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>{lead.customerName} ― {lead.serviceType.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Execution Package *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PACKAGES.map(pkg => (
                      <button 
                        key={pkg.id}
                        type="button"
                        onClick={() => setPackageType(pkg.id)}
                        className={cn(
                          "px-4 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border",
                          packageType === pkg.id 
                            ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {pkg.name}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </section>

          {/* Line Items */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><Briefcase className="h-5 w-5" /></div>
                 <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Project Component Inventory</h3>
               </div>
               <button 
                type="button" 
                onClick={handleAddItem}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md active:scale-95"
               >
                 <Plus className="h-4 w-4" /> Add Asset
               </button>
             </div>

             <div className="space-y-4">
                {items.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl text-slate-400 font-medium italic text-xs">
                    No discrete assets defined. Deployment expansion required.
                  </div>
                )}
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100 transition-all group/item hover:border-primary/20">
                    <div className="flex-grow space-y-1.5">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Scope description</label>
                       <input 
                        type="text" 
                        required 
                        placeholder="e.g. Master Suite Carpentry & Veneer Work" 
                        className={cn(inputCls, "py-2.5 px-4 h-auto")} 
                        value={item.description} 
                        onChange={e => {
                          const newItems = [...items]; newItems[index].description = e.target.value; setItems(newItems);
                        }}
                      />
                    </div>
                    <div className="w-20 space-y-1.5 text-center">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Qty</label>
                       <input 
                        type="number" 
                        required 
                        className={cn(inputCls, "py-2.5 px-0 h-auto text-center")} 
                        value={item.quantity} 
                        onChange={e => {
                          const newItems = [...items]; newItems[index].quantity = parseInt(e.target.value) || 0; setItems(newItems);
                        }}
                      />
                    </div>
                    <div className="w-32 space-y-1.5 text-right">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Unit Valuation</label>
                       <input 
                        type="number" 
                        required 
                        className={cn(inputCls, "py-2.5 px-4 h-auto text-right")} 
                        value={item.unitPrice} 
                        onChange={e => {
                          const newItems = [...items]; newItems[index].unitPrice = parseFloat(e.target.value) || 0; setItems(newItems);
                        }}
                      />
                    </div>
                    <div className="pt-5">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)}
                        className="p-2.5 bg-white text-rose-500 rounded-lg hover:bg-rose-50 border border-slate-200 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Project Details */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Info className="h-5 w-5" /></div>
               <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Scope & Protocols</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Engagement Brief</label>
                   <textarea rows={4} className={cn(inputCls, "h-auto py-3")} placeholder="Outline project inclusions, specialized tasks, and site constraints..." value={workScope} onChange={e => setWorkScope(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Capital Milestones</label>
                      <textarea rows={4} className={cn(inputCls, "h-auto py-3")} placeholder="Standard: 50% Inception, 40% Construction, 10% Handover..." value={milestoneTerms} onChange={e => setMilestoneTerms(e.target.value)} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Deployment Timeline</label>
                      <textarea rows={4} className={cn(inputCls, "h-auto py-3")} placeholder="Expectation: 45 Working Days from site clearance..." value={projectTimeline} onChange={e => setProjectTimeline(e.target.value)} />
                   </div>
                </div>
             </div>
          </section>
        </div>

        {/* Dynamic Fiscal Sidebar */}
        <div className="space-y-6">
           <section className="bg-slate-950 p-8 rounded-2xl shadow-xl text-white border-t-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-[60px] opacity-10 -mr-16 -mt-16" />
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 mb-8 relative z-10">
                 <IndianRupee className="h-4 w-4 text-primary" /> Integrated Valuation
              </h3>
              
              <div className="space-y-5 relative z-10">
                 <CostInput label="Creative Architecture" value={designCost} onChange={setDesignCost} />
                 <CostInput label="Material Logistics" value={materialCost} onChange={setMaterialCost} />
                 <CostInput label="Technical Workforce" value={labourCost} onChange={setLabourCost} />
                 <CostInput label="Tactical Transport" value={transportCost} onChange={setTransportCost} />
                 <CostInput label="Project Governance" value={supervisionCharges} onChange={setSupervisionCharges} />
                 <CostInput label="Site Audit Credits" value={siteVisitCharges} onChange={setSiteVisitCharges} />
                 
                 <div className="pt-6 border-t border-white/5 space-y-5">
                    <div className="flex items-center justify-between">
                       <label className="text-[9px] font-bold text-rose-400 uppercase tracking-[0.2em]">Strategic Incentive (₹)</label>
                       <input 
                        type="number" 
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-right w-24 font-bold text-white outline-none focus:border-rose-400 transition-all text-xs" 
                        value={discount} 
                        onChange={e => setDiscount(parseFloat(e.target.value) || 0)} 
                       />
                    </div>
                    <div className="flex items-center justify-between">
                       <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Fiscal Tier (GST %)</label>
                       <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-right w-24 font-bold text-white outline-none focus:border-indigo-400 transition-all uppercase text-[9px]" value={gstPercentage} onChange={e => setGstPercentage(parseFloat(e.target.value))}>
                          <option value={0} className="text-slate-900">0%</option>
                          <option value={12} className="text-slate-900">12%</option>
                          <option value={18} className="text-slate-900">18%</option>
                          <option value={28} className="text-slate-900">28%</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="mt-10 pt-8 border-t-2 border-dashed border-white/5 space-y-3 relative z-10">
                 <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <span>Base Aggregation</span>
                    <span className="text-white">₹{subtotal.toLocaleString()}</span>
                 </div>
                 {discount > 0 && (
                   <div className="flex items-center justify-between text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                      <span>Incentive Deducted</span>
                      <span>− ₹{discount.toLocaleString()}</span>
                   </div>
                 )}
                 <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <span>Levy Calculated ({gstPercentage}%)</span>
                    <span className="text-white">₹{gstAmount.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between pt-6">
                    <span className="text-sm font-bold uppercase tracking-widest text-indigo-200">Final Investment</span>
                    <span className="text-2xl font-bold text-white tracking-tighter">₹{finalTotal.toLocaleString()}</span>
                 </div>
              </div>
           </section>

           <div className="p-6 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-3 text-center">
              <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                 <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                 Estimate valid for 15 fiscal cycles. Project execution subject to corporate policy and site clearance.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

function CostInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between group">
       <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">{label} (₹)</label>
       <input 
        type="number" 
        className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-right w-24 font-bold text-white outline-none focus:border-primary transition-all text-xs" 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value) || 0)} 
      />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm shadow-sm";
