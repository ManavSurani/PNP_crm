"use client";

import { useState, useEffect } from "react";
import { Layers, Plus, Loader2, Pencil, Trash2, Check, X, Search, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
  _count?: { vendors: number; quotations: number };
  createdAt: string;
}

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isAdding, setIsAdding] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/fields?include_counts=true");
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newFieldName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFieldName.trim() }),
      });
      if (res.ok) {
        setNewFieldName("");
        setIsAdding(false);
        fetchFields();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/fields/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (res.ok) {
        setFields(fields.map((f) => (f.id === id ? { ...f, name: editingName.trim() } : f)));
        setEditingId(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (field: Field) => {
    if (!confirm(`Delete field "${field.name}"? This will also delete all vendors linked to this field.`)) return;
    try {
      const res = await fetch(`/api/fields/${field.id}`, { method: "DELETE" });
      if (res.ok) {
        setFields(fields.filter((f) => f.id !== field.id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = fields.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500 rounded-full blur-[100px] opacity-5 -mr-32 -mt-32" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Work Fields</h1>
          <p className="text-slate-500 text-sm">Manage reusable work categories (e.g. Electrical, Plumbing, Civil).</p>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => { setIsAdding(true); setNewFieldName(""); }}
            className="bg-violet-600 hover:bg-violet-700 px-5 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md"
          >
            <Plus className="h-4 w-4" /> Add New Field
          </button>
        </div>
      </div>

      {/* Add Field inline */}
      {isAdding && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <Wrench className="h-5 w-5 text-violet-500 shrink-0" />
          <input
            autoFocus
            placeholder="Field name (e.g. Electrical Work)"
            className="flex-1 bg-white border border-violet-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-violet-500 outline-none transition-all"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setIsAdding(false); }}
          />
          <button
            onClick={handleAdd}
            disabled={isSaving || !newFieldName.trim()}
            className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
          </button>
          <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-violet-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-violet-400" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-400/10 outline-none transition-all"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Fields</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{fields.length}</p>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-violet-400/60 uppercase tracking-widest">Showing</p>
          <p className="text-3xl font-black text-violet-600 mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Fields List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <Layers className="h-10 w-10 text-slate-200 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-900">No fields found</h3>
          <p className="text-xs text-slate-400 mt-1">Add your first work field using the button above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 pl-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Name</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Vendors</th>
                <th className="py-4 pr-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((field) => (
                <tr key={field.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 pl-6">
                    {editingId === field.id ? (
                      <input
                        autoFocus
                        className="border border-violet-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-violet-500 outline-none w-64"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEdit(field.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-violet-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{field.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                      {field._count?.vendors ?? "—"} vendor{(field._count?.vendors ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="py-4 pr-6 text-right">
                    {editingId === field.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(field.id)}
                          className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-100 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(field.id); setEditingName(field.name); }}
                          className="p-2 hover:bg-violet-50 text-slate-400 hover:text-violet-600 rounded-lg transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(field)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
