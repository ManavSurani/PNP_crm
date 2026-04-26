"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Wallet, Loader2 } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState("MATERIAL");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/expenses");
      setExpenses(await res.json());
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount, description, date })
      });
      setIsModalOpen(false);
      setAmount(""); setDescription("");
      fetchExpenses();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Company Expenses</h1>
          <p className="text-sm text-slate-500">Centralized ledger for tracking material, labor, and operational costs.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button onClick={() => setIsModalOpen(true)} className="block rounded-lg bg-rose-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-rose-500 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-rose-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6 uppercase">Category</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Date Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
                      {exp.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5 font-bold text-rose-600">₹{exp.amount.toLocaleString()}</td>
                  <td className="px-3 py-5 text-sm text-slate-700 max-w-sm truncate" title={exp.description}>{exp.description}</td>
                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-500">{format(new Date(exp.date), "MMM d, yyyy")}</td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-500">No expenses logged yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-rose-500" />
                <h3 className="text-lg font-semibold text-slate-900">Add Company Expense</h3>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900">Expense Category</label>
                  <select className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-rose-600 sm:text-sm"
                    value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="MATERIAL">Raw Material</option>
                    <option value="WORKER_WAGE">Worker Wage</option>
                    <option value="PETTY_CASH">Petty Cash</option>
                    <option value="SHOWROOM">Showroom Expense</option>
                    <option value="MARKETING">Marketing / Ads</option>
                    <option value="TRANSPORT">Transport / Diesel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Amount Spent (₹) *</label>
                  <input required type="number" className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-rose-600 sm:text-sm"
                    value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Description / Details *</label>
                  <textarea required rows={2} className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-rose-600 sm:text-sm"
                    value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Expense Date *</label>
                  <input required type="date" className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-rose-600 sm:text-sm"
                    value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="mt-6 flex items-center justify-end gap-x-4 border-t border-slate-100 pt-5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-semibold text-slate-900">Cancel</button>
                  <button type="submit" className="rounded-md bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500">Save Expense</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
