"use client";

import { useState } from "react";
import { Package, Check, Layout, Box, Star, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const PACKAGES = [
  {
    id: "DESIGN_ONLY",
    name: "Design Only",
    icon: Layout,
    color: "bg-sky-500",
    features: ["Space measurement", "Layout planning", "Furniture drawings", "Material recommendations", "Budget guide"],
    description: "No labour or material supply."
  },
  {
    id: "MATERIALS_ONLY",
    name: "Materials Only",
    icon: Box,
    color: "bg-amber-500",
    features: ["Plywood/MDF/Laminate", "Hardware fittings", "Hardware", "Delivery support"],
    description: "Client manages design + labour."
  },
  {
    id: "FULL_COMBO",
    name: "Full Combo",
    icon: Star,
    color: "bg-emerald-500",
    features: ["Design consultation", "Full materials", "Skilled workforce", "Site supervision", "Quality checks", "Handover"],
    description: "Highest priority / Full project execution."
  },
  {
    id: "CUSTOM",
    name: "Custom Hybrid",
    icon: Zap,
    color: "bg-indigo-500",
    features: ["Custom scope", "Flexible material/labour", "Personalized management"],
    description: "Tailored to specific client needs."
  }
];

export default function PackageSelection({ leadId, initialPackage, onSelect }: { leadId: string; initialPackage?: string | null; onSelect?: (p: string) => void }) {
  const [selected, setSelected] = useState(initialPackage || "FULL_COMBO");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (pkgId: string) => {
    setSelected(pkgId);
    setIsUpdating(true);
    try {
      // Update the Lead's preferred package or use it in the next quote
      // For now we persist it to the lead via a custom field or just keep it in state for the Quote builder
      await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementDetails: `Selected Package: ${pkgId}` }), // Temporary mapping if schema doesn't have package field on Lead
      });
      if (onSelect) onSelect(pkgId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-600/20">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <p className="text-slate-500 text-xs font-medium mt-2 tracking-wide">Select a service package to pre-load estimation headers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PACKAGES.map((pkg) => {
          const isActive = selected === pkg.id;
          return (
            <button
              key={pkg.id}
              onClick={() => handleSelect(pkg.id)}
              className={cn(
                "relative flex flex-col text-left p-8 rounded-xl border transition-all group overflow-hidden",
                isActive 
                  ? "bg-white border-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-indigo-600/20" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-600/30 hover:shadow-md"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center mb-8 transition-all border",
                isActive ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-400 border-slate-100 group-hover:text-indigo-600 group-hover:border-indigo-600/20 group-hover:bg-white"
              )}>
                <pkg.icon className="h-6 w-6" />
              </div>
              
              <div className="space-y-1.5 relative z-10">
                <h4 className={cn("text-base font-bold uppercase tracking-tight", isActive ? "text-slate-900" : "text-slate-800")}>{pkg.name}</h4>
                <p className={cn("text-[10px] font-semibold leading-tight", isActive ? "text-indigo-600" : "text-slate-500")}>
                  {pkg.description}
                </p>
              </div>

              <div className={cn("mt-8 pt-8 border-t space-y-4 flex-1 relative z-10", isActive ? "border-indigo-600/10" : "border-slate-100")}>
                {pkg.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-indigo-600" : "text-slate-300")} />
                    <span className={cn("text-[11px] font-bold leading-none tracking-wide", isActive ? "text-slate-700" : "text-slate-500")}>{f}</span>
                  </div>
                ))}
              </div>

              {isActive && (
                <div className="absolute top-0 right-0 p-4">
                   <div className="bg-indigo-600/10 border border-indigo-600/20 p-1.5 rounded-lg">
                      <Check className="h-4 w-4 text-indigo-600" />
                   </div>
                </div>
              )}
              {/* Subtle dynamic background for active card */}
              {isActive && (
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-[60px] -mr-16 -mb-16" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
        <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Pricing Intelligence</p>
          <p className="text-[11px] text-indigo-700 font-bold opacity-80 leading-relaxed mt-1">
            Selecting a package will automatically pre-load relevant cost headers in the Smart Quotation Builder (Priority 4). 
            You can still add custom items to any selected package.
          </p>
        </div>
      </div>
    </div>
  );
}
