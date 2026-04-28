import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, ArrowLeft, Pencil, Trash2, X, AlertTriangle, 
  Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Info, Calendar, CheckSquare
} from 'lucide-react';

// --- Default Data Generators ---
const generateId = () => Math.random().toString(36).substring(2, 9);
const today = () => new Date().toISOString().split('T')[0];

const INITIAL_CUSTOMERS = [
  {
    id: "c-1", name: "Ramesh Patel", phone: "9876543210", alternatePhone: "", email: "ramesh@example.com",
    address: "123, Shanti Nagar, Mumbai", landmark: "Near Metro", projectName: "Kitchen Furniture",
    projectType: "Furniture", totalProjectAmount: 120000, status: "Active", priority: "High",
    inquirySource: "Referral", notes: "Premium plywood requested", createdAt: "2024-03-01"
  },
  {
    id: "c-2", name: "Sunita Mehta", phone: "9876543211", alternatePhone: "", email: "sunita@example.com",
    address: "A-504, Park View, Pune", landmark: "", projectName: "Bedroom Interior",
    projectType: "Interior", totalProjectAmount: 85000, status: "Active", priority: "Medium",
    inquirySource: "Social Media", notes: "Likes modern minimal style", createdAt: "2024-03-10"
  },
  {
    id: "c-3", name: "Vikram Shah", phone: "9876543212", alternatePhone: "", email: "vikram@example.com",
    address: "Office 102, Tech Plaza, Delhi", landmark: "", projectName: "Office Renovation",
    projectType: "Renovation", totalProjectAmount: 250000, status: "Completed", priority: "Low",
    inquirySource: "Walk-in", notes: "Final handover done", createdAt: "2024-01-15"
  }
];

const INITIAL_TRANSACTIONS = [
  { id: "t-1", customerId: "c-1", type: "RECEIVED", amount: 50000, date: "2024-03-02", paidTo: "Ramesh", category: "Advance", paymentMode: "Bank Transfer", description: "Advance for kitchen", createdAt: "2024-03-02" },
  { id: "t-2", customerId: "c-1", type: "EXPENSE", amount: 20000, date: "2024-03-05", paidTo: "Raj Carpenter", category: "Carpenter", paymentMode: "Cash", description: "Plywood cutting work", createdAt: "2024-03-05" },
  { id: "t-3", customerId: "c-1", type: "RECEIVED", amount: 30000, date: "2024-03-15", paidTo: "Ramesh", category: "Partial Payment", paymentMode: "UPI", description: "Second installment", createdAt: "2024-03-15" },
  { id: "t-4", customerId: "c-2", type: "RECEIVED", amount: 40000, date: "2024-03-12", paidTo: "Sunita", category: "Advance", paymentMode: "Cheque", description: "First payment", createdAt: "2024-03-12" },
  { id: "t-5", customerId: "c-2", type: "EXPENSE", amount: 15000, date: "2024-03-14", paidTo: "National Hardware", category: "Material", paymentMode: "UPI", description: "Laminates and glue", createdAt: "2024-03-14" },
  { id: "t-6", customerId: "c-3", type: "RECEIVED", amount: 100000, date: "2024-01-16", paidTo: "Vikram", category: "Advance", paymentMode: "Bank Transfer", description: "Start of project", createdAt: "2024-01-16" },
  { id: "t-7", customerId: "c-3", type: "EXPENSE", amount: 80000, date: "2024-02-01", paidTo: "Multiple", category: "Miscellaneous", paymentMode: "Cash", description: "Carpenter and electrician", createdAt: "2024-02-01" },
  { id: "t-8", customerId: "c-3", type: "RECEIVED", amount: 150000, date: "2024-02-28", paidTo: "Vikram", category: "Final Payment", paymentMode: "Bank Transfer", description: "Full and final settlement", createdAt: "2024-02-28" }
];

const INITIAL_NOTES = [
  { id: "n-1", customerId: "c-1", content: "Measure kitchen wall on Monday", isCompleted: false, createdAt: "2024-03-01" },
  { id: "n-2", customerId: "c-1", content: "Order hinges from Rajesh Hardware", isCompleted: true, createdAt: "2024-03-02" },
  { id: "n-3", customerId: "c-2", content: "Confirm wood colour with customer", isCompleted: false, createdAt: "2024-03-11" },
  { id: "n-4", customerId: "c-3", content: "Send final invoice copy", isCompleted: true, createdAt: "2024-02-28" }
];

const formatCurrency = (val) => "₹" + Number(val).toLocaleString("en-IN");
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export default function ExpenseBook() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [notes, setNotes] = useState(INITIAL_NOTES);
  
  const [currentPage, setCurrentPage] = useState("LIST"); // LIST | DETAIL
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const [activeModal, setActiveModal] = useState(null);
  const [modalContext, setModalContext] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id }
  
  // Handlers
  const goToList = () => { setCurrentPage("LIST"); setSelectedCustomerId(null); };
  const goToDetail = (id) => { setSelectedCustomerId(id); setCurrentPage("DETAIL"); };
  const openModal = (type, context = null) => { setActiveModal(type); setModalContext(context); };
  const closeModal = () => { setActiveModal(null); setModalContext(null); };

  // Global Sub-components and Data Hooks
  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const customerTransactions = useMemo(() => transactions.filter(t => t.customerId === selectedCustomerId).sort((a,b) => new Date(b.date) - new Date(a.date)), [transactions, selectedCustomerId]);
  const customerNotes = useMemo(() => notes.filter(n => n.customerId === selectedCustomerId), [notes, selectedCustomerId]);

  // Aggregations
  const getFinancials = (custId) => {
    const cust = customers.find(c => c.id === custId);
    if (!cust) return { projectAmount: 0, received: 0, expenses: 0, pending: 0, profit: 0 };
    const trxs = transactions.filter(t => t.customerId === custId);
    const received = trxs.filter(t => t.type === "RECEIVED").reduce((a, b) => a + Number(b.amount), 0);
    const expenses = trxs.filter(t => t.type === "EXPENSE").reduce((a, b) => a + Number(b.amount), 0);
    return {
      projectAmount: cust.totalProjectAmount,
      received,
      expenses,
      pending: cust.totalProjectAmount - received,
      profit: cust.totalProjectAmount - expenses
    };
  };

  const CRUD = {
    saveCustomer: (data) => {
      if (data.id) {
        setCustomers(customers.map(c => c.id === data.id ? { ...c, ...data } : c));
      } else {
        setCustomers([{ ...data, id: "c-" + generateId(), createdAt: today() }, ...customers]);
      }
      closeModal();
    },
    saveTransaction: (data) => {
      if (data.id) {
        setTransactions(transactions.map(t => t.id === data.id ? { ...t, ...data } : t));
      } else {
        setTransactions([{ ...data, id: "t-" + generateId(), customerId: selectedCustomerId, createdAt: today() }, ...transactions]);
      }
      closeModal();
    },
    saveNote: (data) => {
      if (data.id) {
        setNotes(notes.map(n => n.id === data.id ? { ...n, ...data } : n));
      } else {
        setNotes([{ ...data, id: "n-" + generateId(), customerId: selectedCustomerId, isCompleted: false, createdAt: today() }, ...notes]);
      }
      closeModal();
    },
    executeDelete: () => {
      const { type, id } = deleteTarget;
      if (type === 'customer') {
        setCustomers(customers.filter(c => c.id !== id));
        setTransactions(transactions.filter(t => t.customerId !== id));
        setNotes(notes.filter(n => n.customerId !== id));
      } else if (type === 'transaction') {
        setTransactions(transactions.filter(t => t.id !== id));
      } else if (type === 'note') {
        setNotes(notes.filter(n => n.id !== id));
      }
      setDeleteTarget(null);
      closeModal();
    }
  };

  // -----------------------------------------------------
  // PAGE 1: CUSTOMER LIST (Home)
  // -----------------------------------------------------
  const CustomerListView = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All Types");

    const totalProjectsValue = customers.reduce((acc, c) => acc + Number(c.totalProjectAmount), 0);
    const globalPending = customers.reduce((acc, c) => acc + getFinancials(c.id).pending, 0);

    const filtered = customers.filter(c => {
      const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.projectName.toLowerCase().includes(search.toLowerCase());
      const fStatus = statusFilter === "All" || c.status === statusFilter;
      const fType = typeFilter === "All Types" || c.projectType === typeFilter;
      return ms && fStatus && fType;
    });

    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg"><Wallet className="h-6 w-6" /></div>
            <h1 className="text-2xl font-bold tracking-tight">ExpenseBook</h1>
          </div>
          <button onClick={() => openModal("ADD_CUSTOMER")} className="bg-emerald-600 hover:bg-emerald-500 transition px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm shadow-md">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Customers", val: customers.length },
            { label: "Active Projects", val: customers.filter(c => c.status === "Active").length },
            { label: "Total Project Value", val: formatCurrency(totalProjectsValue) },
            { label: "Total Pending Amount", val: formatCurrency(globalPending) }
          ].map((c, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{c.val}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search by name or project..." className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rounded-lg border border-slate-200 bg-white py-2.5 px-4 text-sm font-medium outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {["All", "Active", "Completed", "On Hold", "Cancelled"].map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
          <select className="rounded-lg border border-slate-200 bg-white py-2.5 px-4 text-sm font-medium outline-none" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {["All Types", "Furniture", "Interior", "Construction", "Renovation", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => {
            const fins = getFinancials(c.id);
            const progress = (fins.received / (fins.projectAmount || 1)) * 100;
            const progressColor = progress >= 80 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-rose-500";
            
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-700 uppercase border border-slate-200">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{c.name} <span className="text-slate-400 text-sm font-normal">— {c.phone}</span></h2>
                      <p className="text-sm font-semibold text-slate-600 mt-0.5">{c.projectName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                      c.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      c.status === "Completed" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                      c.status === "On Hold" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>{c.status}</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{c.projectType}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-4 gap-2 mb-4">
                   <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span><span className="text-sm font-bold text-slate-900">{formatCurrency(fins.projectAmount)}</span></div>
                   <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Received</span><span className="text-sm font-bold text-emerald-600">{formatCurrency(fins.received)}</span></div>
                   <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenses</span><span className="text-sm font-bold text-rose-600">{formatCurrency(fins.expenses)}</span></div>
                   <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span><span className="text-sm font-bold text-amber-600">{formatCurrency(fins.pending)}</span></div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Payment Progress</span><span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${progressColor}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                   <button onClick={() => goToDetail(c.id)} className="text-emerald-600 hover:text-emerald-700 transition font-bold text-sm bg-emerald-50 px-4 py-2 rounded-lg flex items-center gap-1.5">View Details <ArrowRight className="h-4 w-4"/></button>
                   <div className="flex gap-2">
                     <button onClick={() => openModal("EDIT_CUSTOMER", c)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"><Pencil className="h-4 w-4"/></button>
                     <button onClick={() => { setDeleteTarget({type: "customer", id: c.id}); setActiveModal("DELETE_CONFIRM"); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="h-4 w-4"/></button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -----------------------------------------------------
  // PAGE 2: CUSTOMER DETAIL
  // -----------------------------------------------------
  const CustomerDetailView = () => {
    if (!selectedCustomer) return null;
    const fins = getFinancials(selectedCustomer.id);

    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <button onClick={goToList} className="text-slate-500 hover:text-slate-900 font-bold text-sm flex items-center gap-2 mb-2 transition">
          <ArrowLeft className="h-4 w-4"/> Back to Customers
        </button>

        <div className="bg-slate-900 text-white rounded-xl shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden h-full">
           <div className="flex items-center gap-5 z-10 relative">
              <div className="h-16 w-16 bg-white/10 border border-white/20 text-2xl font-black flex items-center justify-center rounded-xl shadow-inner">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  {selectedCustomer.name}
                  <button onClick={() => openModal("EDIT_CUSTOMER", selectedCustomer)} className="ml-2 text-slate-400 hover:text-white transition"><Pencil className="h-4 w-4" /></button>
                </h1>
                <p className="text-emerald-400 font-semibold">{selectedCustomer.phone} {selectedCustomer.alternatePhone && `| ${selectedCustomer.alternatePhone}`}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300 bg-white/10 px-2 py-1 rounded">{selectedCustomer.projectName}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/20 ${selectedCustomer.status === "Active" ? "text-emerald-400" : "text-slate-400"}`}>{selectedCustomer.status}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/20 ${selectedCustomer.priority === "High" ? "text-rose-400" : "text-slate-400"}`}>{selectedCustomer.priority} Priority</span>
                </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Project Value", val: fins.projectAmount, color: "text-slate-900", icon: Wallet, bg: "bg-white" },
            { label: "Received", val: fins.received, color: "text-emerald-600", icon: ArrowDownCircle, bg: "bg-emerald-50" },
            { label: "Expenses Paid", val: fins.expenses, color: "text-rose-600", icon: ArrowUpCircle, bg: "bg-rose-50" },
            { label: "Pending From Customer", val: fins.pending, color: "text-amber-600", icon: Info, bg: "bg-amber-50" },
            { label: "Est. Profit", val: fins.profit, color: "text-indigo-600", icon: TrendingUp, bg: "bg-indigo-50" }
          ].map((card, i) => (
            <div key={i} className={`p-5 rounded-xl border border-slate-200 shadow-sm ${card.bg}`}>
               <div className="flex items-center gap-2 mb-3">
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</h3>
               </div>
               <p className={`text-xl font-black font-mono tracking-tight ${card.color}`}>{formatCurrency(card.val)}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 p-6 rounded-xl flex flex-wrap gap-4 items-center border border-slate-800 shadow-md">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2 w-full md:w-auto">Action Center</p>
           <button onClick={() => openModal("ADD_TRANSACTION", { type: "RECEIVED" })} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition active:scale-95"><Plus className="h-4 w-4"/> Payment Received</button>
           <button onClick={() => openModal("ADD_TRANSACTION", { type: "EXPENSE" })} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition active:scale-95"><Plus className="h-4 w-4"/> Add Expense</button>
           <button onClick={() => openModal("ADD_NOTE")} className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition active:scale-95"><Plus className="h-4 w-4"/> Add Note / Task</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 border-b border-slate-100">
             <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-slate-400" /> Transactions Ledger</h2>
           </div>
           {customerTransactions.length === 0 ? (
             <div className="p-16 text-center text-slate-500">No transactions recorded yet.</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                   <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Type</th>
                     <th className="px-6 py-4">Category</th>
                     <th className="px-6 py-4">Paid To / From</th>
                     <th className="px-6 py-4">Mode</th>
                     <th className="px-6 py-4">Description</th>
                     <th className="px-6 py-4 text-right">Amount</th>
                     <th className="px-6 py-4 text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {customerTransactions.map(t => (
                     <tr key={t.id} className={`${t.type === "RECEIVED" ? "bg-emerald-50/30" : "bg-rose-50/30"} hover:bg-slate-50 transition`}>
                       <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{formatDate(t.date)}</td>
                       <td className="px-6 py-4"><span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${t.type==="RECEIVED"?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700"}`}>{t.type}</span></td>
                       <td className="px-6 py-4 font-semibold text-slate-800">{t.category}</td>
                       <td className="px-6 py-4 font-semibold text-slate-800">{t.paidTo}</td>
                       <td className="px-6 py-4 text-xs font-medium text-slate-500">{t.paymentMode}</td>
                       <td className="px-6 py-4 text-xs text-slate-500">{t.description || "-"}</td>
                       <td className={`px-6 py-4 text-right font-black font-mono whitespace-nowrap ${t.type==="RECEIVED"?"text-emerald-600":"text-rose-600"}`}>
                         {t.type === "RECEIVED" ? "▲" : "▼"} {formatCurrency(t.amount)}
                       </td>
                       <td className="px-6 py-4 text-center whitespace-nowrap">
                         <button onClick={() => openModal("EDIT_TRANSACTION", t)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded mr-1"><Pencil className="h-4 w-4"/></button>
                         <button onClick={() => { setDeleteTarget({type: "transaction", id: t.id}); setActiveModal("DELETE_CONFIRM"); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded"><Trash2 className="h-4 w-4"/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><CheckSquare className="h-4 w-4 text-slate-400" /> Notes & Tasks</h2>
             <button onClick={() => openModal("ADD_NOTE")} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded flex items-center gap-1"><Plus className="h-3 w-3"/> Add Note</button>
           </div>
           {customerNotes.length === 0 ? (
             <div className="p-10 text-center text-slate-500">No notes or tasks.</div>
           ) : (
             <div className="divide-y divide-slate-100">
               {customerNotes.map(n => (
                 <div key={n.id} className={`p-4 flex items-start gap-4 transition ${n.isCompleted ? 'bg-slate-50' : 'bg-white'}`}>
                   <button onClick={() => CRUD.saveNote({ ...n, isCompleted: !n.isCompleted })} className={`mt-0.5 border-2 rounded w-5 h-5 flex items-center justify-center flex-shrink-0 transition ${n.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                     {n.isCompleted && <Check className="h-3 w-3" />}
                   </button>
                   <div className="flex-1">
                     <p className={`text-sm font-medium ${n.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{n.content}</p>
                     <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">{formatDate(n.createdAt)}</p>
                   </div>
                   <div className="flex gap-1">
                     <button onClick={() => openModal("EDIT_NOTE", n)} className="p-2 text-slate-400 hover:text-slate-900"><Pencil className="h-4 w-4"/></button>
                     <button onClick={() => { setDeleteTarget({type: "note", id: n.id}); setActiveModal("DELETE_CONFIRM"); }} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4"/></button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    );
  };

  // -----------------------------------------------------
  // MODALS
  // -----------------------------------------------------
  const ModalBase = ({ title, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto w-full">{children}</div>
      </div>
    </div>
  );

  const CustomerModal = () => {
    const isEdit = !!modalContext?.id;
    const [data, setData] = useState(modalContext || {
      name: "", phone: "", alternatePhone: "", email: "", address: "", landmark: "",
      projectName: "", projectType: "Furniture", totalProjectAmount: "",
      status: "Active", priority: "Medium", inquirySource: "Walk-in", notes: ""
    });

    return (
      <form onSubmit={e => { e.preventDefault(); CRUD.saveCustomer({ ...data, totalProjectAmount: Number(data.totalProjectAmount) }); }}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Customer Name*</label><input required className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.name} onChange={e=>setData({...data, name: e.target.value})}/></div>
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number*</label><input required className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.phone} onChange={e=>setData({...data, phone: e.target.value})}/></div>
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Alternate Phone</label><input className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.alternatePhone} onChange={e=>setData({...data, alternatePhone: e.target.value})}/></div>
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email ID</label><input type="email" className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.email} onChange={e=>setData({...data, email: e.target.value})}/></div>
          
          <div className="md:col-span-2"><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Project Name*</label><input required placeholder="e.g. 3BHK Complete Interior" className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.projectName} onChange={e=>setData({...data, projectName: e.target.value})}/></div>
          
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Project Type</label>
             <select className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.projectType} onChange={e=>setData({...data, projectType: e.target.value})}>
               {["Furniture", "Interior", "Construction", "Renovation", "Other"].map(o=><option key={o}>{o}</option>)}
             </select>
          </div>
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total Agreed Value (₹)*</label><input required type="number" className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.totalProjectAmount} onChange={e=>setData({...data, totalProjectAmount: e.target.value})}/></div>
          
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
             <select className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.priority} onChange={e=>setData({...data, priority: e.target.value})}>
               {["High", "Medium", "Low"].map(o=><option key={o}>{o}</option>)}
             </select>
          </div>
          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
             <select className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.status} onChange={e=>setData({...data, status: e.target.value})}>
               {["Active", "Completed", "On Hold", "Cancelled"].map(o=><option key={o}>{o}</option>)}
             </select>
          </div>

          <div className="md:col-span-2"><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Address</label><textarea rows={2} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.address} onChange={e=>setData({...data, address: e.target.value})}/></div>
          <div className="md:col-span-2"><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Notes</label><textarea rows={2} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.notes} onChange={e=>setData({...data, notes: e.target.value})}/></div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-900 font-bold px-4 py-2 text-sm">Cancel</button>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition">Save Customer</button>
        </div>
      </form>
    );
  };

  const TransactionModal = () => {
    const isEdit = !!modalContext?.id;
    const [data, setData] = useState(modalContext?.id ? modalContext : {
      type: modalContext?.type || "RECEIVED", amount: "", date: today(),
      category: modalContext?.type === "RECEIVED" ? "Advance" : "Material",
      paidTo: modalContext?.type === "RECEIVED" ? selectedCustomer?.name : "",
      paymentMode: "Cash", description: ""
    });

    const receivedCats = ["Advance", "Partial Payment", "Final Payment", "Miscellaneous"];
    const expenseCats = ["Labour", "Material", "Transport", "Carpenter", "Electrician", "Supplier", "Miscellaneous"];
    const catsList = data.type === "RECEIVED" ? receivedCats : expenseCats;

    return (
      <form onSubmit={e => { e.preventDefault(); CRUD.saveTransaction({ ...data, amount: Number(data.amount) }); }}>
        <div className="p-6 space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-1 mb-6">
             <button type="button" onClick={() => setData({...data, type: "RECEIVED", category: "Advance", paidTo: selectedCustomer.name})} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded transition ${data.type === 'RECEIVED' ? 'bg-white shadow border border-slate-200 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>Money Received</button>
             <button type="button" onClick={() => setData({...data, type: "EXPENSE", category: "Material", paidTo: ""})} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded transition ${data.type === 'EXPENSE' ? 'bg-white shadow border border-slate-200 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}>Expense Paid</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Amount (₹)*</label><input required type="number" min="1" className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm font-black" value={data.amount} onChange={e=>setData({...data, amount: e.target.value})}/></div>
            <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date*</label><input required type="date" className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.date} onChange={e=>setData({...data, date: e.target.value})}/></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1"><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{data.type === "RECEIVED" ? "Received From*" : "Paid To*"}</label><input required placeholder={data.type === "RECEIVED" ? "Client Name" : "Carpenter / Shop Name"} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.paidTo} onChange={e=>setData({...data, paidTo: e.target.value})}/></div>
            <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category*</label>
               <select className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.category} onChange={e=>setData({...data, category: e.target.value})}>
                 {catsList.map(o=><option key={o}>{o}</option>)}
               </select>
            </div>
            <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Payment Mode</label>
               <select className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.paymentMode} onChange={e=>setData({...data, paymentMode: e.target.value})}>
                 {["Cash", "UPI", "Bank Transfer", "Cheque"].map(o=><option key={o}>{o}</option>)}
               </select>
            </div>
          </div>

          <div><label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Notes / Description</label><textarea rows={2} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" value={data.description} onChange={e=>setData({...data, description: e.target.value})}/></div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-900 font-bold px-4 py-2 text-sm">Cancel</button>
          <button type="submit" className={`text-white font-bold py-2 px-6 rounded-lg text-sm transition ${data.type === "RECEIVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>Save Transaction</button>
        </div>
      </form>
    );
  };

  const NoteModal = () => {
    const [data, setData] = useState(modalContext || { content: "", isCompleted: false });
    return (
      <form onSubmit={e => { e.preventDefault(); CRUD.saveNote(data); }}>
        <div className="p-6">
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Task / Note Description*</label>
          <textarea required rows={4} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm mb-4" value={data.content} onChange={e=>setData({...data, content: e.target.value})} placeholder="What needs to be done..."/>
          <div className="flex items-center gap-2">
             <input type="checkbox" id="note-comp" checked={data.isCompleted} onChange={e => setData({...data, isCompleted: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 cursor-pointer" />
             <label htmlFor="note-comp" className="text-sm font-semibold text-slate-700 cursor-pointer">Mark as completed</label>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-900 font-bold px-4 py-2 text-sm">Cancel</button>
          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-lg text-sm transition">Save Note</button>
        </div>
      </form>
    );
  };

  const DeleteConfirmModal = () => (
    <div className="p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto mb-4 bg-rose-50 rounded-full p-3" />
      <h3 className="text-lg font-bold text-slate-900 mb-2">Are you absolutely sure?</h3>
      <p className="text-sm text-slate-500 mb-8">This action cannot be undone. This will permanently delete this {deleteTarget?.type} record from the system.</p>
      <div className="flex justify-center gap-3">
        <button onClick={closeModal} className="text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold px-6 py-2.5 rounded-lg text-sm transition">Cancel</button>
        <button onClick={CRUD.executeDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition shadow-md">Yes, Delete</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="p-4 md:p-8">
        {currentPage === "LIST" && <CustomerListView />}
        {currentPage === "DETAIL" && <CustomerDetailView />}
      </div>

      {activeModal === "ADD_CUSTOMER" && <ModalBase title="Add New Customer"><CustomerModal /></ModalBase>}
      {activeModal === "EDIT_CUSTOMER" && <ModalBase title="Edit Customer Details"><CustomerModal /></ModalBase>}
      {activeModal === "ADD_TRANSACTION" && <ModalBase title="Log New Transaction"><TransactionModal /></ModalBase>}
      {activeModal === "EDIT_TRANSACTION" && <ModalBase title="Edit Transaction"><TransactionModal /></ModalBase>}
      {activeModal === "ADD_NOTE" && <ModalBase title="Add Note / Task"><NoteModal /></ModalBase>}
      {activeModal === "EDIT_NOTE" && <ModalBase title="Edit Note"><NoteModal /></ModalBase>}
      {activeModal === "DELETE_CONFIRM" && <ModalBase title="Confirm Deletion"><DeleteConfirmModal /></ModalBase>}
    </div>
  );
}
