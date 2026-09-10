"use client";
import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Plus, X, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface MS {
  id: string; sequence: number; name: string; description: string | null;
  status: string; phase: string; progress: number | null; delayDays: number | null;
  delayReason: string | null; startedOn: string | null; completedOn: string | null;
}
interface ProjectStats {
  progressPct: number;
  doneCount: number;
  daysActive: number;
  estCompletion: string;
  estCompletionOverdue: boolean;
  currentMilestone: MS | null;
}
interface Project {
  id: string; 
  customerId: string; 
  name?: string | null;
  startedOn: string; 
  isCompleted: boolean; 
  completedOn: string | null;
  stats?: ProjectStats;
  milestones?: MS[];
}

function fmt(d: string | null | number, short = false) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", ...(short ? {} : { year: "numeric" }), timeZone: "Asia/Kolkata"
  });
}

const CARD_W = 120, CARD_H = 64, START_X = 60;

const PHASES: Record<string, { fill: string; stroke: string; text: string; dot: string; darkFill: string; darkStroke: string; darkText: string }> = {
  "Survey & Design": { fill: "#FFEDD5", stroke: "#F97316", text: "#9A3412", dot: "#F97316", darkFill: "rgba(249,115,22,0.18)", darkStroke: "#FB923C", darkText: "#FDBA74" }, // Orange
  "Civil & Structural": { fill: "#FEF08A", stroke: "#EAB308", text: "#854D0E", dot: "#EAB308", darkFill: "rgba(234,179,8,0.18)", darkStroke: "#FACC15", darkText: "#FDE047" }, // Yellow
  "Elec & Plumbing": { fill: "#DBEAFE", stroke: "#3B82F6", text: "#1E40AF", dot: "#3B82F6", darkFill: "rgba(59,130,246,0.18)", darkStroke: "#60A5FA", darkText: "#93C5FD" }, // Blue
  "Finishing": { fill: "#DCFCE7", stroke: "#22C55E", text: "#14532D", dot: "#22C55E", darkFill: "rgba(34,197,94,0.18)", darkStroke: "#4ADE80", darkText: "#86EFAC" }, // Green
  "General": { fill: "#F3F4F6", stroke: "#9CA3AF", text: "#374151", dot: "#9CA3AF", darkFill: "rgba(148,163,184,0.18)", darkStroke: "#94A3B8", darkText: "#CBD5E1" }, // Gray
};

const STATUS_LBL: Record<string, string> = { done: "Completed", in_progress: "Active", delay: "Delayed", pending: "Pending" };

function GanttSVG({ milestones, onEdit }: { milestones: MS[]; onEdit: (m: MS) => void; }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [hovered, setHovered] = useState<string | null>(null);

  // Helper to get start of day in local time for consistent comparison
  const getStartOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res.getTime();
  };

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper to get local midnight for any date input (string or Date)
  const getLocalMidnight = (d: any) => {
    const date = new Date(d);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const todayTS = getLocalMidnight(now);

  const dates = milestones.map(m => {
    const d = m.status === "done" && m.completedOn ? m.completedOn : (m.startedOn ? m.startedOn : now);
    return getLocalMidnight(d);
  });
  dates.push(todayTS);

  const minD = Math.min(...dates);
  const maxD = Math.max(...dates);

  // Axis Start: 1st of the minimum month
  const minDate = new Date(minD);
  minDate.setDate(1);
  minDate.setHours(0, 0, 0, 0);

  // Axis End: End of the timeline buffer
  const maxDate = new Date(maxD);
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setDate(1);
  maxDate.setHours(0, 0, 0, 0);

  // Ensure at least 60 days visibility for better scale
  if (maxDate.getTime() - minDate.getTime() < 60 * 24 * 60 * 60 * 1000) {
    maxDate.setMonth(minDate.getMonth() + 2);
    maxDate.setDate(1);
  }

  const AXIS_START = minDate.getTime();
  const AXIS_END = maxDate.getTime();

  // Dynamic width based on milestone count, min 800px
  const endX = Math.max(START_X + Math.max(milestones.length, 4) * 140, 800);
  const svgW = endX + START_X;

  function dateToX(t: number) {
    if (AXIS_END === AXIS_START) return START_X;
    return START_X + ((t - AXIS_START) / (AXIS_END - AXIS_START)) * (endX - START_X);
  }

  const ticks = [];
  let curr = new Date(minDate);
  while (curr.getTime() < AXIS_END + 86400000) {
    ticks.push({
      l: curr.toLocaleDateString("en-US", { month: "short", year: curr.getFullYear() !== now.getFullYear() ? "2-digit" : undefined }),
      x: dateToX(curr.getTime())
    });
    curr.setMonth(curr.getMonth() + 1);
  }

  const todayX = dateToX(now.getTime());

  // Milestone layout with improved alignment
  const sorted = [...milestones].map(m => {
    const d = m.status === "done" && m.completedOn ? m.completedOn : (m.startedOn ? m.startedOn : now);
    const ts = new Date(d).getTime();
    const midnight = getLocalMidnight(d);
    
    // If it's today, align closer to current time, otherwise use midday for centering
    const isTodayMs = midnight === todayTS;
    const t = isTodayMs ? (midnight + (now.getHours() * 3600000) + (now.getMinutes() * 60000)) : (midnight + 12 * 60 * 60 * 1000);
    
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

  return (
    <div style={{ overflowX: "auto", paddingBottom: 10 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ overflow: "visible", display: "block" }}>
        {/* Axis */}
        <line x1={START_X - 10} y1={AXIS_Y} x2={endX + 20} y2={AXIS_Y} stroke={isDark ? "#475569" : "#9CA3AF"} strokeWidth={1} />
        <polygon points={`${endX + 22},${AXIS_Y - 3} ${endX + 30},${AXIS_Y} ${endX + 22},${AXIS_Y + 3}`} fill={isDark ? "#475569" : "#9CA3AF"} />

        {/* Month ticks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={t.x} y1={AXIS_Y - 4} x2={t.x} y2={AXIS_Y + 4} stroke={isDark ? "#334155" : "#D1D5DB"} strokeWidth={1} />
            <text x={t.x} y={AXIS_Y - 10} textAnchor="middle" fontSize={10} fontWeight={500} fill={isDark ? "#94a3b8" : "#6B7280"}>{t.l}</text>
          </g>
        ))}

        {/* Today Indicator */}
        <g>
          <line x1={todayX} y1={AXIS_Y - 10} x2={todayX} y2={svgH - 20} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,3" />
          <path d={`M${todayX - 5},${AXIS_Y - 12} L${todayX + 5},${AXIS_Y - 12} L${todayX},${AXIS_Y - 2} Z`} fill="#EF4444" />
          <rect x={todayX - 20} y={svgH - 20} width={40} height={16} rx={4} fill={isDark ? "#450a0a" : "#FEF2F2"} stroke="#EF4444" strokeWidth={1} />
          <text x={todayX} y={svgH - 9} textAnchor="middle" fontSize={9} fontWeight={600} fill="#EF4444">TODAY</text>
        </g>

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
                <rect x={rx} y={cy} width={CARD_W} height={CARD_H} rx={8} fill={isDark ? col.darkFill : col.fill} stroke={isDark ? col.darkStroke : col.stroke} strokeWidth={isDone ? 1 : 1.5}
                  style={{ filter: isHov ? (isDark ? "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" : "drop-shadow(0 4px 6px rgba(0,0,0,0.1))") : (isDark ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.05))") }} />

                {m.phase === "Project Completed" ? (
                  <text x={rx + 8} y={cy + 28} fontSize={10} fontWeight={700} fill={isDark ? col.darkText : col.text}>
                    Project Completed
                  </text>
                ) : (
                  <>
                    <text x={rx + 8} y={cy + 16} fontSize={10} fontWeight={700} fill={isDark ? col.darkText : col.text}>
                      {m.phase.length > 18 ? m.phase.substring(0, 18) + "..." : m.phase}
                    </text>
                    <text x={rx + 8} y={cy + 28} fontSize={9} fontWeight={500} fill={isDark ? col.darkText : col.text} opacity={0.8}>
                      {m.name.length > 20 ? m.name.substring(0, 20) + "..." : m.name}
                    </text>
                  </>
                )}

                {m.status === "in_progress" && (
                  <>
                    <rect x={rx + 8} y={cy + 36} width={CARD_W - 16} height={6} rx={3} fill={isDark ? "rgba(255,255,255,0.15)" : "#FFFFFF"} opacity={0.5} />
                    <rect x={rx + 8} y={cy + 36} width={(CARD_W - 16) * (m.progress ?? 0) / 100} height={6} rx={3} fill={isDark ? col.darkStroke : col.stroke} />
                    <text x={rx + CARD_W - 8} y={cy + 34} fontSize={8} fontWeight={700} fill={isDark ? col.darkText : col.text} textAnchor="end">{m.progress ?? 0}%</text>
                  </>
                )}

                {m.status === "delay" && (
                  <text x={rx + 8} y={cy + 42} fontSize={9} fontWeight={600} fill={isDark ? "#F87171" : "#DC2626"}>{m.delayDays} days delayed</text>
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
                    <rect x={0} y={0} width={CARD_W} height={18} rx={4} fill={isDark ? "#1E293B" : "#111827"} stroke={isDark ? "rgba(255,255,255,0.12)" : "none"} strokeWidth={1} />
                    <text x={CARD_W / 2} y={12} textAnchor="middle" fontSize={9} fontWeight={500} fill={isDark ? "#F1F5F9" : "white"}>{dateStr}</text>
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

function Modal({ mode, init, projectId, isProjectCompleted, existingMilestones = [], hasFinalPayment, onSave, onMarkProjectDone, onDelete, onClose }: {
  mode: "add" | "edit"; init?: MS | null; projectId: string;
  isProjectCompleted?: boolean;
  existingMilestones?: MS[];
  hasFinalPayment: boolean;
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
    "Glass Work": ["Quotation Given", "Work Finalize"],
    "Project Completed": ["Project Completed"]
  };

  const [phaseData, setPhaseData] = useState<Record<string, string[]>>(INITIAL_PHASE_DATA);

  const availablePhaseData = useMemo(() => {
    // We only filter in "add" mode to prevent duplicate creation
    // In "edit" mode, we show all so the current selection is visible
    if (mode === "edit") return phaseData;

    const result: Record<string, string[]> = {};
    Object.entries(phaseData).forEach(([p, subs]) => {
      const filteredSubs = subs.filter(s => {
        // Hide if this subcategory (s) already exists in this project under this phase (p)
        const alreadyExists = existingMilestones.some(m => m.phase === p && m.name === s);
        return !alreadyExists;
      });
      if (filteredSubs.length > 0) {
        result[p] = filteredSubs;
      }
    });
    return result;
  }, [phaseData, existingMilestones, mode]);

  const initPhase = init?.phase && availablePhaseData[init.phase] 
    ? init.phase 
    : Object.keys(availablePhaseData)[0];
  const [phase, setPhase] = useState<string>(initPhase);

  const initSub = init?.name || (availablePhaseData[initPhase]?.[0] || "");
  const [subcategory, setSubcategory] = useState<string>(initSub);

  const [sdate, setSdate] = useState(init?.startedOn ? new Date(init.startedOn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newSubcats, setNewSubcats] = useState<string[]>([""]);

  useEffect(() => {
    if (!isAddingPhase && availablePhaseData[phase]) {
      setSubcategory(availablePhaseData[phase][0] || "");
    }
  }, [phase, isAddingPhase, availablePhaseData]);

  const todayStr = new Date().toISOString().split('T')[0];

  const save = async () => {
    if (!subcategory.trim()) { setErr("Subcategory is required."); return; }
    if (sdate > todayStr) { setErr("Future dates are not allowed."); return; }

    // Validation: Block "Project Completed" if no Final Payment is found
    if (phase === "Project Completed" && !hasFinalPayment) {
      setErr("⚠️ Final Payment Required: Please record the final payment in the Financial section before marking the project as completed.");
      return;
    }

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

  const markProjectDone = async () => { 
    if (!hasFinalPayment) {
      setErr("⚠️ Final Payment Required: Please record the final payment in the Financial section before marking the project as completed.");
      return;
    }
    setSaving(true); 
    await onMarkProjectDone(); 
    setSaving(false); 
  };
  const del = async () => { if (init) { setSaving(true); await onDelete(init.id); setSaving(false); } };

  const handleAddNewPhase = () => {
    if (!newPhaseName.trim()) { setErr("Phase Name is required"); return; }
    const validSubs = newSubcats.filter(s => s.trim() !== "");
    if (validSubs.length === 0) { setErr("At least one subcategory is required"); return; }

    const updatedData = { ...phaseData, [newPhaseName.trim()]: validSubs };
    setPhaseData(updatedData);
    setPhase(newPhaseName.trim());
    setSubcategory(validSubs[0]);
    setIsAddingPhase(false);
    setNewPhaseName("");
    setNewSubcats([""]);
    setErr("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <p className="text-base font-bold text-slate-900 dark:text-white m-0">{mode === "add" ? "Add Milestone" : "Edit Milestone"}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"><X size={18} /></button>
        </div>

        {err && <p className="text-xs text-rose-500 mb-3 font-medium">{err}</p>}

        {isAddingPhase ? (
          <div className="bg-slate-50 dark:bg-[#161f32] p-4 rounded-xl mb-4 border border-slate-200 dark:border-white/8">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3 mt-0">Create New Phase</p>
            <div className="mb-3">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Phase Name</label>
              <input value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder="e.g. Landscaping"
                className="w-full mt-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Subcategories</label>
              {newSubcats.map((sub, i) => (
                <div key={i} className="flex gap-2 mt-1">
                  <input value={sub} onChange={e => {
                    const next = [...newSubcats];
                    next[i] = e.target.value;
                    setNewSubcats(next);
                  }} placeholder="Subcategory name" className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-500" />
                  {newSubcats.length > 1 && (
                    <button onClick={() => setNewSubcats(newSubcats.filter((_, idx) => idx !== i))} className="text-rose-500 p-0 cursor-pointer"><X size={16} /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setNewSubcats([...newSubcats, ""])} className="mt-2 text-blue-600 dark:text-indigo-400 text-xs font-semibold cursor-pointer hover:underline">+ Add another subcategory</button>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setIsAddingPhase(false)} className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleAddNewPhase} className="bg-blue-600 dark:bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 dark:hover:bg-indigo-500 cursor-pointer">Save Phase</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="flex justify-between">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phase</label>
                <button onClick={() => setIsAddingPhase(true)} className="text-blue-600 dark:text-indigo-400 text-[11px] font-semibold cursor-pointer">➕ Add New Phase</button>
              </div>
              <select value={phase} onChange={e => { setPhase(e.target.value); setErr(""); }}
                className="w-full mt-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161f32] text-slate-900 dark:text-white rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-500">
                {Object.keys(availablePhaseData).length === 0 ? (
                  <option disabled>All phases completed</option>
                ) : (
                  Object.keys(availablePhaseData).map(p => <option key={p} value={p}>{p}</option>)
                )}
              </select>
            </div>

            {phase !== "Project Completed" && (
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subcategory</label>
                  <select value={subcategory} onChange={e => { setSubcategory(e.target.value); setErr(""); }}
                    disabled={!phase || !availablePhaseData[phase]}
                    className="w-full mt-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161f32] disabled:bg-slate-100 dark:disabled:bg-slate-800/50 text-slate-900 dark:text-white rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-500">
                    {availablePhaseData[phase]?.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</label>
                <input type="date" value={sdate} max={todayStr}
                  onChange={e => {
                    const val = e.target.value;
                    setSdate(val);
                    if (val > todayStr) {
                      setErr("Future dates are not allowed.");
                    } else if (err === "Future dates are not allowed.") {
                      setErr("");
                    }
                  }}
                  className="w-full mt-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161f32] text-slate-900 dark:text-white rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
            </div>

            {mode === "add" && !isProjectCompleted && (
              <div className="mb-4 pt-2.5 border-t border-slate-200 dark:border-white/8">
                <button onClick={markProjectDone} disabled={saving}
                  className="w-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-2.5 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all cursor-pointer">
                  <CheckCircle2 size={16} /> Mark Entire Project as Completed
                </button>
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 justify-between items-center mt-4">
          {mode === "edit" ? (
            <button onClick={del} disabled={saving} className="text-rose-600 dark:text-rose-400 text-xs font-semibold px-2.5 py-1.5 hover:underline cursor-pointer">Delete</button>
          ) : <div></div>}

          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button onClick={save} disabled={saving || isAddingPhase || Object.keys(availablePhaseData).length === 0}
              className="bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-500 text-white rounded-lg px-5 py-2 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer">
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<MS[]>([]);
  const [hasFinalPayment, setHasFinalPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalMs, setModalMs] = useState<MS | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cr, pr, tr] = await Promise.all([
        fetch(`/api/leads/${id}`), 
        fetch(`/api/projects?customer_id=${id}`),
        fetch(`/api/transactions?leadId=${id}`)
      ]);
      if (cr.ok) setCustomer(await cr.json());
      if (pr.ok) { const p = await pr.json(); if (p) { setProject(p); setMilestones(p.milestones || []); } }
      if (tr.ok) {
        const trans = await tr.json();
        const finalFound = trans.some((t: any) => t.category === "Final Payment");
        setHasFinalPayment(finalFound);
      }
      setLoading(false);
    })();
  }, [id]);

  // --- START: Active Work Days Calculation ---
  const start = project ? new Date(project.startedOn) : new Date();

  // Normalize start to midnight for day-based counting
  const startMidnight = new Date(start);
  startMidnight.setHours(0, 0, 0, 0);

  let lastMilestoneDate = new Date();
  if (milestones.length > 0) {
    const dates = milestones.map(m => {
      const d = m.status === "done" && m.completedOn ? new Date(m.completedOn) : (m.startedOn ? new Date(m.startedOn) : new Date());
      const res = new Date(d);
      res.setHours(0, 0, 0, 0);
      return res.getTime();
    });
    lastMilestoneDate = new Date(Math.max(...dates));
  } else {
    lastMilestoneDate.setHours(0, 0, 0, 0);
  }

  // Calculate inclusive days: (End - Start) / 1 day + 1
  const totalDays = Math.max(1, Math.floor((lastMilestoneDate.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  // --- END: Active Work Days Calculation ---

  // --- START: Total Project Days Calculation (Start -> Today/Completion) ---
  const endPoint = (project?.isCompleted && project.completedOn) ? new Date(project.completedOn) : new Date();
  endPoint.setHours(0, 0, 0, 0);

  const totalProjectDays = Math.max(1, Math.floor((endPoint.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const totalProjectDaysDisplay = `${totalProjectDays} Total Day${totalProjectDays !== 1 ? "s" : ""}`;
  // --- END: Total Project Days Calculation ---

  const handleSave = async (data: any) => {
    if (!project) return;
    if (modalMode === "add") {
      const r = await fetch("/api/milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: project.id, ...data }) });
      if (r.ok) { 
        const d = await r.json(); 
        setMilestones(d.milestones);
        if (data.phase === "Project Completed") {
          setProject(p => p ? { ...p, isCompleted: true } : p);
        }
      }
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

  if (loading) return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="text-blue-600 dark:text-indigo-400 animate-spin" /></div>);
  if (!project) return (<div className="max-w-[600px] mx-auto my-[60px] text-center text-slate-500 dark:text-slate-400"><div className="text-5xl mb-4">🏗️</div><h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Project Found</h2><p>A project is auto-created when a lead is converted to a customer.</p><Link href={`/customers/${id}`} className="inline-block mt-5 px-5 py-2 bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">← Back to Profile</Link></div>);

  return (
    <div className="max-w-full pb-16">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between px-2 pt-2 mb-6">
        <Link
          href={`/customers/${id}`}
          className="group flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-[0.2em]"
        >
          <div className="h-7 w-7 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:border-slate-400 dark:group-hover:border-white/20 transition-colors bg-white dark:bg-slate-900 shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          BACK
        </Link>

        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
          <Link href="/customers" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Customer Directory</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <Link href={`/customers/${id}`} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{customer?.customerName?.toUpperCase() || "CUSTOMER"}</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-900 dark:text-white">PROGRESS</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white m-0">
            {customer?.project?.name ? `Project: ${customer.project.name}` : "Project Timeline"}
          </h1>
          {project.isCompleted ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-3 py-1 text-xs font-semibold">
              <CheckCircle2 size={14} /> Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-full px-3 py-1 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-indigo-400 inline-block animate-pulse" /> Active Project
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-white/8 flex-1 min-w-[200px] shadow-sm">
          <p className="text-2xl font-extrabold text-blue-600 dark:text-indigo-400 mb-1">{totalDays} Days</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0">Active Work Days</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-white/8 flex-1 min-w-[200px] shadow-sm">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{totalProjectDaysDisplay}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0">Project Duration</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Click any milestone to edit details or update status.
        </span>
        <button onClick={() => { setModalMode("add"); setModalMs(null); setShowModal(true); }}
          className="flex items-center gap-1.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer shadow-sm transition-all">
          <Plus size={16} /> Add Milestone
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/8 rounded-2xl py-6 shadow-sm">
        {milestones.length === 0 ? (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-15">Timeline is empty. Add a milestone to map the progress.</p>
        ) : (
          <GanttSVG milestones={milestones} onEdit={m => { setModalMode("edit"); setModalMs(m); setShowModal(true); }} />
        )}
      </div>

      {showModal && <Modal mode={modalMode} init={modalMs} projectId={project.id} existingMilestones={milestones} hasFinalPayment={hasFinalPayment} isProjectCompleted={project.isCompleted} onSave={handleSave} onMarkProjectDone={handleProjectComplete} onDelete={handleDelete} onClose={() => setShowModal(false)} />}
    </div>
  );
}

