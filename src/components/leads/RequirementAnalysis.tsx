"use client";

import { useState, useEffect } from "react";
import { 
  Home, Maximize, BedDouble, ChefHat, Sofa, 
  Briefcase, Palette, Package, Clock, IndianRupee, Save, Loader2, Check 
} from "lucide-react";
import { cn } from "@/lib/utils";

type Requirement = {
  propertyType?: string;
  areaSize?: string;
  numRooms?: number;
  kitchenType?: string;
  wardrobeCount?: number;
  tvUnitReq: boolean;
  bedroomFurnitureReq: boolean;
  officeSetupReq: boolean;
  materialPref?: string;
  finishPref?: string;
  budgetRange?: string;
  timeline?: string;
  notes?: string;
};

export default function RequirementAnalysis({ leadId, initialData }: { leadId: string; initialData?: Requirement | null }) {
  const [data, setData] = useState<Requirement>(initialData || {
    tvUnitReq: false,
    bedroomFurnitureReq: false,
    officeSetupReq: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const saveRequirements = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/requirement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const propertyTypes = ["2BHK", "3BHK", "Villa", "Office", "Shop", "Apartment", "Other"];
  const finishes = ["High Gloss Laminate", "Matte Laminate", "Veneer", "PU Paint", "Acrylic", "Glass"];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="bg-slate-50 p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-[80px] opacity-5 -mr-16 -mt-16" />
        <div className="relative z-10">
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight leading-none">Requirement Analysis</h3>
          <p className="text-slate-500 text-xs font-medium mt-2 tracking-wide">Detailed project specifications and client needs.</p>
        </div>
        <button 
          onClick={saveRequirements}
          disabled={isSaving}
          className={cn(
            "relative z-10 flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 border border-indigo-500/20",
            showSuccess ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
          )}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : showSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {showSuccess ? "Requirements Saved" : "Save Requirements"}
        </button>
      </div>

      <div className="p-10 space-y-12">
        {/* Section 1: Property Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Home className="h-3 w-3" /> Property Type</label>
            <select 
              className={inputCls}
              value={data.propertyType || ""}
              onChange={(e) => setData({ ...data, propertyType: e.target.value })}
            >
              <option value="">Select Type</option>
              {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Maximize className="h-3 w-3" /> Area (sq.ft.)</label>
            <input 
              type="text" 
              className={inputCls} 
              placeholder="e.g. 1200"
              value={data.areaSize || ""}
              onChange={(e) => setData({ ...data, areaSize: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><BedDouble className="h-3 w-3" /> No. of Rooms</label>
            <input 
              type="number" 
              className={inputCls} 
              value={data.numRooms || ""}
              onChange={(e) => setData({ ...data, numRooms: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Section 2: Specific Requirements */}
        <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Core Scope Definition
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ToggleCard 
                active={data.tvUnitReq} 
                icon={<Sofa className="h-5 w-5" />} 
                label="TV Unit" 
                onClick={() => setData({ ...data, tvUnitReq: !data.tvUnitReq })} 
              />
              <ToggleCard 
                active={data.bedroomFurnitureReq} 
                icon={<BedDouble className="h-5 w-5" />} 
                label="Bed + Wardrobe" 
                onClick={() => setData({ ...data, bedroomFurnitureReq: !data.bedroomFurnitureReq })} 
              />
              <ToggleCard 
                active={data.officeSetupReq} 
                icon={<Briefcase className="h-5 w-5" />} 
                label="Office Setup" 
                onClick={() => setData({ ...data, officeSetupReq: !data.officeSetupReq })} 
              />
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">Kitchen Type</label>
                <input 
                  type="text" 
                  className={inputCls} 
                  placeholder="L-Shape, Island..."
                  value={data.kitchenType || ""}
                  onChange={(e) => setData({ ...data, kitchenType: e.target.value })}
                />
              </div>
           </div>
        </div>

        {/* Section 3: Material & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Package className="h-3 w-3" /> Material Preference</label>
                <input 
                  type="text" 
                  className={inputCls} 
                  placeholder="e.g. Marine Plywood, MDF"
                  value={data.materialPref || ""}
                  onChange={(e) => setData({ ...data, materialPref: e.target.value })}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Palette className="h-3 w-3" /> Finish Preference</label>
                <select 
                  className={inputCls}
                  value={data.finishPref || ""}
                  onChange={(e) => setData({ ...data, finishPref: e.target.value })}
                >
                  <option value="">Select Finish</option>
                  {finishes.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
             </div>
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><IndianRupee className="h-3 w-3 text-emerald-500" /> Budget Range</label>
                <input 
                  type="text" 
                  className={inputCls} 
                  placeholder="e.g. 10 - 15 Lakhs"
                  value={data.budgetRange || ""}
                  onChange={(e) => setData({ ...data, budgetRange: e.target.value })}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="h-3 w-3 text-amber-500" /> Timeline Expectation</label>
                <input 
                  type="text" 
                  className={inputCls} 
                  placeholder="e.g. 45 Days"
                  value={data.timeline || ""}
                  onChange={(e) => setData({ ...data, timeline: e.target.value })}
                />
             </div>
          </div>
        </div>

        <div className="space-y-2 pt-6 border-t border-slate-100">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Special Client Notes</label>
           <textarea 
             rows={4} 
             className={inputCls} 
             placeholder="Discussed specific colour schemes, needs space for a large piano..."
             value={data.notes || ""}
             onChange={(e) => setData({ ...data, notes: e.target.value })}
           />
        </div>
      </div>
    </div>
  );
}

function ToggleCard({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-6 rounded-xl border transition-all group",
        active 
          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
          : "bg-white border-slate-200 text-slate-400 hover:border-indigo-600/30 hover:bg-slate-50"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-lg transition-colors border",
        active ? "bg-white/10 border-white/20" : "bg-white border-slate-100 group-hover:text-indigo-600 group-hover:border-indigo-600/20"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{label}</span>
      {active && <div className="mt-2 h-1 w-4 bg-white rounded-full opacity-50" />}
    </button>
  );
}

const inputCls = "w-full rounded-2xl border-2 border-slate-100 bg-white py-4 px-5 text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm shadow-sm";
