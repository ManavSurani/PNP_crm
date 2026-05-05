"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Plus, X, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

interface MS {
  id: string; sequence: number; name: string; description: string | null;
  status: string; phase: string; progress: number | null; delayDays: number | null;
  delayReason: string | null; startedOn: string | null; completedOn: string | null;
}
interface Project {
  id: string; customerId: string; startedOn: string; isCompleted: boolean; completedOn: string | null;
}

function fmt(d: string | null | number, short = false) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", ...(short ? {} : { year: "numeric" }), timeZone: "Asia/Kolkata"
  });
}

const CARD_W = 120, CARD_H = 64, START_X = 60;

const PHASES: Record<string, { fill: string; stroke: string; text: string; dot: string }> = {
  "Survey & Design": { fill: "#FFEDD5", stroke: "#F97316", text: "#9A3412", dot: "#F97316" }, // Orange
  "Civil & Structural": { fill: "#FEF08A", stroke: "#EAB308", text: "#854D0E", dot: "#EAB308" }, // Yellow
  "Elec & Plumbing": { fill: "#DBEAFE", stroke: "#3B82F6", text: "#1E40AF", dot: "#3B82F6" }, // Blue
  "Finishing": { fill: "#DCFCE7", stroke: "#22C55E", text: "#14532D", dot: "#22C55E" }, // Green
  "General": { fill: "#F3F4F6", stroke: "#9CA3AF", text: "#374151", dot: "#9CA3AF" }, // Gray
};

const STATUS_LBL: Record<string, string> = { done: "Completed", in_progress: "Active", delay: "Delayed", pending: "Pending" };

function GanttSVG({ milestones, onEdit }: { milestones: MS[]; onEdit: (m: MS) => void; }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const dates = milestones.map(m => m.status === "done" && m.completedOn ? new Date(m.completedOn).getTime() : (m.startedOn ? new Date(m.startedOn).getTime() : Date.now()));
  dates.push(Date.now());
  const minD = Math.min(...dates);
  const maxD = Math.max(...dates);

  const minDate = new Date(minD); minDate.setDate(1);
  const maxDate = new Date(maxD); maxDate.setMonth(maxDate.getMonth() + 1); maxDate.setDate(0);
  const AXIS_START = minDate.getTime();
  const AXIS_END = maxDate.getTime();

  const endX = Math.max(START_X + milestones.length * 140, 800);
  const svgW = endX + START_X;

  function dateToX(t: number) {
    if (AXIS_END === AXIS_START) return START_X;
    return START_X + ((t - AXIS_START) / (AXIS_END - AXIS_START)) * (endX - START_X);
  }

  const ticks = [];
  let curr = new Date(minDate);
  while (curr.getTime() <= maxDate.getTime() + 86400000) {
    ticks.push({ l: curr.toLocaleDateString("en-US", { month: "short", year: curr.getFullYear() !== new Date().getFullYear() ? "2-digit" : undefined }), x: dateToX(curr.getTime()) });
    curr.setMonth(curr.getMonth() + 1);
  }

  // Auto layout (no overlap)
  const sorted = [...milestones].map(m => {
    const t = m.status === "done" && m.completedOn ? new Date(m.completedOn).getTime() : (m.startedOn ? new Date(m.startedOn).getTime() : Date.now());
    return { m, t, x: dateToX(t) };
  }).sort((a, b) => a.t - b.t);

  const levels: number[] = [];
  const positions = sorted.map(item => {
    let level = 0;
    while (levels[level] !== undefined && levels[level] > item.x - CARD_W - 20) {
      level++;
    }
    levels[level] = item.x;
    return { ...item, level };
  });

  const maxLevel = Math.max(0, ...positions.map(p => p.level));
  const AXIS_Y = 40;
  const svgH = AXIS_Y + 40 + (maxLevel + 1) * (CARD_H + 20) + 20;
  const todayX = dateToX(Date.now());

  return (
    <div style={{ overflowX: "auto", paddingBottom: 10 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ overflow: "visible", display: "block" }}>
        {/* Axis */}
        <line x1={START_X - 10} y1={AXIS_Y} x2={endX + 20} y2={AXIS_Y} stroke="#9CA3AF" strokeWidth={1} />
        <polygon points={`${endX + 22},${AXIS_Y - 3} ${endX + 30},${AXIS_Y} ${endX + 22},${AXIS_Y + 3}`} fill="#9CA3AF" />

        {/* Month ticks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={t.x} y1={AXIS_Y - 4} x2={t.x} y2={AXIS_Y + 4} stroke="#D1D5DB" strokeWidth={1} />
            <text x={t.x} y={AXIS_Y - 10} textAnchor="middle" fontSize={10} fontWeight={500} fill="#6B7280">{t.l}</text>
          </g>
        ))}

        {/* Today Line */}
        <line x1={todayX} y1={AXIS_Y - 10} x2={todayX} y2={svgH - 20} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,3" />
        <rect x={todayX - 20} y={svgH - 20} width={40} height={16} rx={4} fill="#FEF2F2" stroke="#EF4444" strokeWidth={1} />
        <text x={todayX} y={svgH - 9} textAnchor="middle" fontSize={9} fontWeight={600} fill="#EF4444">TODAY</text>

        {/* Milestones */}
        {positions.map(({ m, x, level }) => {
          const rx = x - CARD_W / 2;
          const cy = AXIS_Y + 30 + level * (CARD_H + 20);
          const col = PHASES[m.phase] ?? PHASES["General"];
          const isHov = hovered === m.id;
          const isDone = m.status === "done";
          const dateStr = isDone ? fmt(m.completedOn) : fmt(m.startedOn);

          return (
            <g key={m.id} style={{ transition: "all 0.3s ease" }}>
              <line x1={x} y1={AXIS_Y} x2={x} y2={cy} stroke={col.dot} strokeWidth={1} strokeDasharray="3,3" />
              <circle cx={x} cy={AXIS_Y} r={4} fill={col.dot} />

              <g style={{ cursor: "pointer" }}
                onClick={() => onEdit(m)}
                onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}>
                <rect x={rx} y={cy} width={CARD_W} height={CARD_H} rx={8} fill={col.fill} stroke={col.stroke} strokeWidth={isDone ? 1 : 1.5}
                  style={{ filter: isHov ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.05))" }} />

                <text x={rx + 8} y={cy + 16} fontSize={10} fontWeight={700} fill={col.text}>
                  {m.name.length > 18 ? m.name.substring(0, 18) + "..." : m.name}
                </text>

                <text x={rx + 8} y={cy + 28} fontSize={9} fontWeight={600} fill={col.text} opacity={0.8}>{STATUS_LBL[m.status]}</text>

                {m.status === "in_progress" && (
                  <>
                    <rect x={rx + 8} y={cy + 36} width={CARD_W - 16} height={6} rx={3} fill="#FFFFFF" opacity={0.5} />
                    <rect x={rx + 8} y={cy + 36} width={(CARD_W - 16) * (m.progress ?? 0) / 100} height={6} rx={3} fill={col.stroke} />
                    <text x={rx + CARD_W - 8} y={cy + 34} fontSize={8} fontWeight={700} fill={col.text} textAnchor="end">{m.progress ?? 0}%</text>
                  </>
                )}

                {m.status === "delay" && (
                  <text x={rx + 8} y={cy + 42} fontSize={9} fontWeight={600} fill="#DC2626">{m.delayDays} days delayed</text>
                )}

                {isDone && (
                  <g transform={`translate(${rx + CARD_W - 20}, ${cy + 6})`}>
                    <circle cx={6} cy={6} r={6} fill="#10B981" />
                    <path d="M3.5 6L5 7.5L8.5 4" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}

                {/* Tooltip on hover */}
                {isHov && (
                  <g transform={`translate(${rx}, ${cy - 24})`}>
                    <rect x={0} y={0} width={CARD_W} height={18} rx={4} fill="#111827" />
                    <text x={CARD_W / 2} y={12} textAnchor="middle" fontSize={9} fontWeight={500} fill="white">{dateStr}</text>
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Modal({ mode, init, projectId, onSave, onMarkProjectDone, onDelete, onClose }: {
  mode: "add" | "edit"; init?: MS | null; projectId: string;
  onSave: (d: any) => Promise<void>; onMarkProjectDone: () => Promise<void>;
  onDelete: (id: string) => Promise<void>; onClose: () => void;
}) {
  const INITIAL_PHASE_DATA: Record<string, string[]> = {
    "Designing": ["Project Onboard", "Plan Layout Final", "Ceiling Layout Final", "3D Layout Final", "3D Renders Given"],
    "AC Piping": ["Quotation Given", "Piping & Plumbing Done"],
    "Ceiling": ["Quotation Given", "Framing Done", "Ceiling Finalize"],
    "Civil / Flooring": ["Quotation Given", "Work Started", "Selection Done", "Flooring/Civil Work Done"],
    "Electric Work": ["Quotation Given", "Board Relocated", "Initial Wiring Done", "Final Work Done"],
    "Furniture Work": ["Quotation Given", "Work Started", "Basic Work Done", "Laminate Work Started", "Final Work Done"],
    "Colour Work": ["Quotation Given", "Color Work Started", "Final Work & Cleaning Done"],
    "Sofa / Curtain / Mattress": ["Selection Started", "Quotation Given", "All Delivered"],
    "Glass Work": ["Quotation Given", "Work Finalize"]
  };

  const [phaseData, setPhaseData] = useState<Record<string, string[]>>(INITIAL_PHASE_DATA);
  
  const initPhase = init?.phase && phaseData[init.phase] ? init.phase : Object.keys(phaseData)[0];
  const [phase, setPhase] = useState<string>(initPhase);
  
  const initSub = init?.name || (phaseData[initPhase]?.[0] || "");
  const [subcategory, setSubcategory] = useState<string>(initSub);
  
  const [sdate, setSdate] = useState(init?.startedOn ? new Date(init.startedOn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newSubcats, setNewSubcats] = useState<string[]>([""]);

  useEffect(() => {
    if (!isAddingPhase && phaseData[phase]) {
      setSubcategory(phaseData[phase][0] || "");
    }
  }, [phase, isAddingPhase, phaseData]);

  const save = async () => {
    if (!subcategory.trim()) { setErr("Subcategory is required."); return; }
    setSaving(true);
    await onSave({
      name: subcategory.trim(),
      description: null,
      status: "done",
      phase: phase,
      progress: null,
      delayDays: null,
      delayReason: null,
      startedOn: sdate,
      completedOn: sdate
    });
    setSaving(false);
  };

  const markProjectDone = async () => { setSaving(true); await onMarkProjectDone(); setSaving(false); };
  const del = async () => { if (init) { setSaving(true); await onDelete(init.id); setSaving(false); } };

  const handleAddNewPhase = () => {
    if (!newPhaseName.trim()) { setErr("Phase Name is required"); return; }
    const validSubs = newSubcats.filter(s => s.trim() !== "");
    if (validSubs.length === 0) { setErr("At least one subcategory is required"); return; }
    
    setPhaseData(prev => ({ ...prev, [newPhaseName.trim()]: validSubs }));
    setPhase(newPhaseName.trim());
    setSubcategory(validSubs[0]);
    setIsAddingPhase(false);
    setNewPhaseName("");
    setNewSubcats([""]);
    setErr("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{mode === "add" ? "Add Milestone" : "Edit Milestone"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}><X size={18} /></button>
        </div>

        {err && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 12, fontWeight: 500 }}>{err}</p>}

        {isAddingPhase ? (
          <div style={{ background: "#F9FAFB", padding: 16, borderRadius: 8, marginBottom: 16, border: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12, marginTop: 0 }}>Create New Phase</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Phase Name</label>
              <input value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder="e.g. Landscaping"
                style={{ width: "100%", marginTop: 4, border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Subcategories</label>
              {newSubcats.map((sub, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input value={sub} onChange={e => {
                    const next = [...newSubcats];
                    next[i] = e.target.value;
                    setNewSubcats(next);
                  }} placeholder="Subcategory name" style={{ flex: 1, border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  {newSubcats.length > 1 && (
                    <button onClick={() => setNewSubcats(newSubcats.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 0 }}><X size={16} /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setNewSubcats([...newSubcats, ""])} style={{ marginTop: 8, background: "none", border: "none", color: "#2563EB", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>+ Add another subcategory</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setIsAddingPhase(false)} style={{ background: "white", border: "1px solid #D1D5DB", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddNewPhase} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Save Phase</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Phase</label>
                <button onClick={() => setIsAddingPhase(true)} style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>➕ Add New Phase</button>
              </div>
              <select value={phase} onChange={e => { setPhase(e.target.value); setErr(""); }}
                style={{ width: "100%", marginTop: 4, border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                {Object.keys(phaseData).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subcategory</label>
                <select value={subcategory} onChange={e => { setSubcategory(e.target.value); setErr(""); }}
                  disabled={!phase || !phaseData[phase]}
                  style={{ width: "100%", marginTop: 4, border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: (!phase || !phaseData[phase]) ? "#F3F4F6" : "white" }}>
                  {phaseData[phase]?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</label>
                <input type="date" value={sdate} onChange={e => setSdate(e.target.value)}
                  style={{ width: "100%", marginTop: 4, border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 10px", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            {mode === "add" && (
              <div style={{ marginBottom: 16, paddingTop: 10, borderTop: "1px solid #E5E7EB" }}>
                <button onClick={markProjectDone} disabled={saving}
                  style={{ width: "100%", background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                  <CheckCircle2 size={16} /> Mark Entire Project as Completed
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          {mode === "edit" ? (
            <button onClick={del} disabled={saving} style={{ color: "#EF4444", background: "none", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 10px" }}>Delete</button>
          ) : <div></div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ border: "1px solid #D1D5DB", background: "white", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151" }}>Close</button>
            <button onClick={save} disabled={saving || isAddingPhase}
              style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (saving || isAddingPhase) ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />} Save
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<MS[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalMs, setModalMs] = useState<MS | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cr, pr] = await Promise.all([fetch(`/api/leads/${id}`), fetch(`/api/projects?customer_id=${id}`)]);
      if (cr.ok) setCustomer(await cr.json());
      if (pr.ok) { const p = await pr.json(); if (p) { setProject(p); setMilestones(p.milestones || []); } }
      setLoading(false);
    })();
  }, [id]);

  const startDate = project ? new Date(project.startedOn) : new Date();
  
  let lastMilestoneDate = new Date();
  if (milestones.length > 0) {
    const dates = milestones.filter(m => m.startedOn).map(m => new Date(m.startedOn!).getTime());
    if (dates.length > 0) {
      lastMilestoneDate = new Date(Math.max(...dates));
    }
  }

  const totalDays = Math.max(1, Math.ceil((lastMilestoneDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  let months = (lastMilestoneDate.getFullYear() - startDate.getFullYear()) * 12 + (lastMilestoneDate.getMonth() - startDate.getMonth());
  let tempDate = new Date(startDate);
  tempDate.setMonth(tempDate.getMonth() + months);
  let days = Math.ceil((lastMilestoneDate.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    months -= 1;
    tempDate.setMonth(tempDate.getMonth() - 1);
    days = Math.ceil((lastMilestoneDate.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  let durationDisplay;
  if (months <= 0) {
    durationDisplay = "Less than 1 Month";
  } else if (days === 0) {
    durationDisplay = `${months} Month${months !== 1 ? "s" : ""}`;
  } else {
    durationDisplay = `${months} Month${months !== 1 ? "s" : ""} ${days} Day${days !== 1 ? "s" : ""}`;
  }

  const handleSave = async (data: any) => {
    if (!project) return;
    if (modalMode === "add") {
      const r = await fetch("/api/milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: project.id, ...data }) });
      if (r.ok) { const d = await r.json(); setMilestones(d.milestones); }
    } else if (modalMs) {
      const r = await fetch(`/api/milestones/${modalMs.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (r.ok) { const d = await r.json(); setMilestones(d.milestones); }
    }
    setShowModal(false);
  };

  const handleProjectComplete = async () => {
    if (!project) return;
    const r = await fetch(`/api/projects/${project.id}/complete`, { method: "POST" });
    if (r.ok) {
      const d = await r.json();
      setMilestones(d.milestones);
      setProject(p => p ? { ...p, isCompleted: true } : p);
    }
    setShowModal(false);
  };

  const handleDelete = async (msId: string) => {
    const r = await fetch(`/api/milestones/${msId}`, { method: "DELETE" });
    if (r.ok) { const d = await r.json(); setMilestones(d.milestones); }
    setShowModal(false);
  };

  if (loading) return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><Loader2 size={32} style={{ color: "#3B82F6", animation: "spin 1s linear infinite" }} /></div>);
  if (!project) return (<div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center", color: "#6B7280" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div><h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>No Project Found</h2><p>A project is auto-created when a lead is converted to a customer.</p><Link href={`/customers/${id}`} style={{ display: "inline-block", marginTop: 20, padding: "8px 20px", background: "#3B82F6", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Back to Profile</Link></div>);

  return (
    <div style={{ maxWidth: "100%", paddingBottom: 60 }}>
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between px-2 pt-2 mb-6">
        <Link 
          href={`/customers/${id}`}
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
          <Link href={`/customers/${id}`} className="text-slate-300 hover:text-slate-500 transition-colors">{customer?.customerName?.toUpperCase() || "CUSTOMER"}</Link>
          <ChevronRight className="h-3 w-3 text-slate-200" /> 
          <span className="text-slate-900">PROGRESS</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>
            {customer?.project?.name ? `Project: ${customer.project.name}` : "Project Timeline"}
          </h1>
          {project.isCompleted ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Completed
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EFF6FF", color: "#1E40AF", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} /> Active Project
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", border: "1px solid #E5E7EB", flex: 1, minWidth: 200, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#2563EB", margin: "0 0 4px" }}>{totalDays} Days</p>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, fontWeight: 500 }}>Active Work Days</p>
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", border: "1px solid #E5E7EB", flex: 1, minWidth: 200, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>{durationDisplay}</p>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, fontWeight: 500 }}>Project Duration</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
          Click any milestone to edit details or update status.
        </span>
        {!project.isCompleted && (
          <button onClick={() => { setModalMode("add"); setModalMs(null); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
            <Plus size={16} /> Add Milestone
          </button>
        )}
      </div>

      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "24px 0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        {milestones.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14, padding: "60px 0" }}>Timeline is empty. Add a milestone to map the progress.</p>
        ) : (
          <GanttSVG milestones={milestones} onEdit={m => { setModalMode("edit"); setModalMs(m); setShowModal(true); }} />
        )}
      </div>

      {showModal && <Modal mode={modalMode} init={modalMs} projectId={project.id} onSave={handleSave} onMarkProjectDone={handleProjectComplete} onDelete={handleDelete} onClose={() => setShowModal(false)} />}
    </div>
  );
}

