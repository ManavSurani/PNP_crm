"use client";

import { useMemo } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
}

interface Quotation {
  id: string;
  amount: number;
  priority: number;
  isPriorityLocked: boolean;
  field: { name: string };
  vendor: { name: string; phone: string };
  payments: Payment[];
}

interface Props {
  quotations: Quotation[];
  onReorder: (newOrder: string[]) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (id: string) => void;
  onRowClick: (quotation: Quotation) => void;
  isLocked: boolean;
}

function SortableRow({ quotation, isLocked, onEdit, onDelete, onRowClick }: { 
  quotation: Quotation; 
  isLocked: boolean;
  onEdit: (q: Quotation) => void;
  onDelete: (id: string) => void;
  onRowClick: (q: Quotation) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: quotation.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalPaid = quotation.payments.reduce((sum, p) => sum + p.amount, 0);
  const pending = Math.max(0, quotation.amount - totalPaid);
  
  // Status Logic: If pending == 0 → PAID, If paid > 0 && pending > 0 → PARTIAL, If paid == 0 → UNPAID
  const status = pending === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";
  
  const statusColors = {
    UNPAID: "bg-slate-100 text-slate-600 border-slate-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PARTIAL: "bg-amber-50 text-amber-700 border-amber-200"
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group hover:bg-slate-50 transition-colors cursor-pointer",
        isDragging && "bg-white shadow-xl"
      )}
      onClick={() => onRowClick(quotation)}
    >
      <td className="w-9 py-4 pl-4">
        {!isLocked && (
          <div 
            {...attributes} 
            {...listeners} 
            className="p-1 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-400 transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </td>
      <td className="w-9 py-4">
        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
          {quotation.priority}
        </div>
      </td>
      <td className="py-4 font-bold text-slate-900">{quotation.field.name}</td>
      <td className="py-4 font-black text-slate-900">₹{quotation.amount.toLocaleString("en-IN")}</td>
      <td className="py-4">
        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black">
          ₹{totalPaid.toLocaleString("en-IN")}
        </div>
      </td>
      <td className="py-4">
        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black">
          ₹{pending.toLocaleString("en-IN")}
        </div>
      </td>
      <td className="w-[180px] py-4">
        <p className="text-xs font-bold text-slate-900">{quotation.vendor.name}</p>
        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
          <Phone className="h-3 w-3" /> {quotation.vendor.phone}
        </p>
      </td>
      <td className="w-[100px] py-4">
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          statusColors[status]
        )}>
          {status}
        </span>
      </td>
      <td className="w-[100px] py-4 pr-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(quotation); }}
            className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(quotation.id); }}
            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function QuotationTable({ quotations, onReorder, onEdit, onDelete, onRowClick, isLocked }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = quotations.findIndex(q => q.id === active.id);
      const newIndex = quotations.findIndex(q => q.id === over.id);
      const newOrder = arrayMove(quotations, oldIndex, newIndex).map(q => q.id);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="w-9 py-4"></th>
                <th className="w-9 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Field</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</th>
                <th className="w-[180px] py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                <th className="w-[100px] py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="w-[100px] py-4 text-right pr-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <GripVertical className="h-6 w-6 text-slate-200" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">No quotations recorded</h3>
                    <p className="text-xs text-slate-400 mt-1">Click the "Add New Field" button to get started.</p>
                  </td>
                </tr>
              ) : (
                <SortableContext
                  items={quotations.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {quotations.map((q) => (
                    <SortableRow
                      key={q.id}
                      quotation={q}
                      isLocked={isLocked}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onRowClick={onRowClick}
                    />
                  ))}
                </SortableContext>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DndContext>
  );
}
