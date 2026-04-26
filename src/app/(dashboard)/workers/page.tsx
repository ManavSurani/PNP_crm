"use client";

import { useState, useEffect } from "react";
import { HardHat, Plus, Loader2 } from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CARPENTER");
  const [dailyRate, setDailyRate] = useState("");

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workers");
      setWorkers(await res.json());
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, role, dailyRate })
      });
      setIsModalOpen(false);
      setName(""); setPhone(""); setDailyRate("");
      fetchWorkers();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Worker Directory</h1>
          <p className="text-sm text-slate-500">Manage carpenters, designers, and site workers along with their daily rates.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button onClick={() => setIsModalOpen(true)} className="block rounded-lg bg-orange-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Worker
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
           <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6 uppercase">Name & Contact</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Specialization</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Daily Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {workers.map(w => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                    <div className="font-semibold text-slate-900">{w.name}</div>
                    <div className="text-sm text-slate-500 mt-1">{w.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5">
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      {w.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5 font-semibold text-slate-700">
                    {w.dailyRate ? `₹${w.dailyRate.toLocaleString()} / Day` : "Not Set"}
                  </td>
                </tr>
              ))}
              {workers.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-slate-500">No workers tracked yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <HardHat className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-slate-900">Add New Worker</h3>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900">Full Name *</label>
                  <input required type="text" className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Phone Number *</label>
                  <input required type="text" className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Specialization</label>
                  <select className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="CARPENTER">Carpenter</option>
                    <option value="HELPER">Helper</option>
                    <option value="PAINTER">Painter</option>
                    <option value="ELECTRICIAN">Electrician</option>
                    <option value="DESIGNER">Designer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Daily Contract Rate (₹)</label>
                  <input type="number" className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500" value={dailyRate} onChange={e => setDailyRate(e.target.value)} />
                </div>
                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-semibold text-slate-700">Cancel</button>
                  <button type="submit" className="rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500">Save Worker</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
