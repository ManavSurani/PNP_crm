"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save } from "lucide-react";

export default function QuotationBuilder() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [leadId, setLeadId] = useState("");
  const [materialCost, setMaterialCost] = useState(0);
  const [labourCost, setLabourCost] = useState(0);
  const [transportCost, setTransportCost] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(18); // Default 18% GST

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
    return materialCost + labourCost + transportCost + itemsTotal;
  };

  const subtotal = calculateSubtotal();
  const gstAmount = (subtotal * gstPercentage) / 100;
  const finalTotal = subtotal + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return alert("Select a Lead first");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId, materialCost, labourCost, transportCost, gstPercentage, items
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Build New Quotation</h1>
        <p className="text-slate-500 mt-1">Generate a structured estimate for a lead.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Details</h2>
          <div>
            <label className="block text-sm font-medium leading-6 text-slate-900">Select Existing Lead *</label>
            <select 
              required
              className="mt-1 block w-full rounded-md border-0 py-2 pl-3 pr-8 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={leadId}
              onChange={e => setLeadId(e.target.value)}
            >
              <option value="" disabled>-- Select a Lead --</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.customerName} - {lead.serviceType.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Product / Service Line Items</h2>
            <button type="button" onClick={handleAddItem} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex flex-center gap-1">
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-grow">
                  <label className="block text-xs font-medium text-slate-500">Description</label>
                  <input type="text" required placeholder="Custom Wardrobe 6x7" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 text-sm" 
                    value={item.description} onChange={e => {
                      const newItems = [...items]; newItems[index].description = e.target.value; setItems(newItems);
                    }}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-500">Quantity</label>
                  <input type="number" required min="1" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 text-sm focus:outline-none" 
                    value={item.quantity} onChange={e => {
                      const newItems = [...items]; newItems[index].quantity = parseInt(e.target.value) || 0; setItems(newItems);
                    }}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-500">Unit Price (₹)</label>
                  <input type="number" required min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 text-sm focus:outline-none" 
                    value={item.unitPrice} onChange={e => {
                      const newItems = [...items]; newItems[index].unitPrice = parseFloat(e.target.value) || 0; setItems(newItems);
                    }}
                  />
                </div>
                <div className="w-32 pt-5 select-none font-semibold text-slate-700 text-right">
                  ₹{(item.quantity * item.unitPrice).toLocaleString()}
                </div>
                <div className="pt-5">
                  <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Base Costs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Base Costs & Fees</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900">Material Cost (₹)</label>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={materialCost} onChange={e => setMaterialCost(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Labour Cost (₹)</label>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={labourCost} onChange={e => setLabourCost(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Transport & Handling (₹)</label>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={transportCost} onChange={e => setTransportCost(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* GST & Final Totals Widget */}
        <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-30 select-none pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="w-full md:w-1/3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-300">GST Registration (%)</label>
                <select className="mt-1 w-full rounded-md border-0 bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={gstPercentage} onChange={e => setGstPercentage(parseFloat(e.target.value))}>
                  <option value={0} className="text-slate-900">0% (GST Exempt / Not Added)</option>
                  <option value={12} className="text-slate-900">12% GST</option>
                  <option value={18} className="text-slate-900">18% GST</option>
                  <option value={28} className="text-slate-900">28% GST</option>
                </select>
              </div>
            </div>
            
            <div className="w-full md:w-2/3 flex flex-col items-end">
              <div className="flex w-full justify-between max-w-sm mb-1 text-slate-300">
                <span>Subtotal</span>
                <span className="font-medium text-white">₹{subtotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex w-full justify-between max-w-sm mb-3 pb-3 border-b border-slate-700 text-slate-300">
                <span>GST ({gstPercentage}%)</span>
                <span className="font-medium text-white">₹{gstAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex w-full justify-between max-w-sm">
                <span className="text-xl font-medium tracking-tight">Final Estimate Total</span>
                <span className="text-3xl font-bold tracking-tight text-emerald-400">₹{finalTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2 transform transition-all active:scale-95 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Generate Official Quotation
          </button>
        </div>
      </form>
    </div>
  );
}
