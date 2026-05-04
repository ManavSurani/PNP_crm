"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Plus, X, Loader2 } from "lucide-react";

interface MS { id:string; sequence:number; name:string; description:string|null; status:string; progress:number|null; delayDays:number|null; delayReason:string|null; startedOn:string|null; completedOn:string|null; }
interface Project { id:string; customerId:string; startedOn:string; isCompleted:boolean; completedOn:string|null; }

function fmt(d:string|null,short=false){ if(!d) return ""; return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",...(short?{}:{year:"numeric"}),timeZone:"Asia/Kolkata"}); }

const CARD_W=98,CARD_H=54,AXIS_Y=190,START_X=60,MIN_GAP=114;
const ROW_Y:Record<string,number>={done:55,in_progress:100,delay:100,pending:140};
const COL:Record<string,{fill:string;stroke:string;text:string;dot:string;sw:number}>={
  done:      {fill:"#D1FAE5",stroke:"#10B981",text:"#065F46",dot:"#10B981",sw:0.8},
  in_progress:{fill:"#EFF6FF",stroke:"#378ADD",text:"#1E40AF",dot:"#378ADD",sw:1.5},
  delay:     {fill:"#FEF3C7",stroke:"#F59E0B",text:"#92400E",dot:"#F59E0B",sw:1.2},
  pending:   {fill:"#F9FAFB",stroke:"#E5E7EB",text:"#9CA3AF",dot:"#D1D5DB",sw:0.8},
};
const STATUS_LBL:Record<string,string>={done:"Completed",in_progress:"In Progress",delay:"Delayed",pending:"Not started"};
const YEAR=new Date().getFullYear();
const AXIS_START=new Date(YEAR,4,1).getTime();
const AXIS_END=new Date(YEAR,11,31).getTime();
const MONTHS=[{l:"May",m:4},{l:"Jun",m:5},{l:"Jul",m:6},{l:"Aug",m:7},{l:"Sep",m:8},{l:"Oct",m:9},{l:"Nov",m:10},{l:"Dec",m:11}];
function dateToX(date:Date,sx:number,ex:number){ return sx+((date.getTime()-AXIS_START)/(AXIS_END-AXIS_START))*(ex-sx); }
function calcXs(n:number,sx:number,ex:number){ if(n===0) return []; if(n===1) return [(sx+ex)/2]; return Array.from({length:n},(_,i)=>sx+(ex-sx)/(n-1)*i); }

function GanttSVG({milestones,onComplete,onEdit,onDelete}:{milestones:MS[];onComplete:(m:MS)=>void;onEdit:(m:MS)=>void;onDelete:(m:MS)=>void;}){
  const [hovered,setHovered]=useState<string|null>(null);
  const n=milestones.length;
  const endX=Math.max(START_X+(n-1)*MIN_GAP,580);
  const svgW=endX+START_X;
  const xs=calcXs(n,START_X,endX);
  const todayX=dateToX(new Date(),START_X,endX);
  const PHASES=[{name:"Survey & Design",fill:"#FED7AA",text:"#92400E",m1:4,m2:5},{name:"Civil & Structural",fill:"#FDE68A",text:"#78350F",m1:5,m2:7},{name:"Elec & Plumbing",fill:"#C7D2FE",text:"#3730A3",m1:7,m2:9},{name:"Finishing",fill:"#BBF7D0",text:"#065F46",m1:9,m2:11}];

  return(
    <div style={{overflowX:"auto"}}>
    <svg viewBox={`0 0 ${svgW} 260`} width={Math.max(svgW,640)} style={{overflow:"visible",display:"block"}}>
      {/* Axis */}
      <line x1={START_X-10} y1={AXIS_Y} x2={endX+20} y2={AXIS_Y} stroke="#9CA3AF" strokeWidth={0.8}/>
      <polygon points={`${endX+22},${AXIS_Y-2} ${endX+28},${AXIS_Y} ${endX+22},${AXIS_Y+2}`} fill="#9CA3AF"/>
      {/* Month ticks */}
      {MONTHS.map(({l,m})=>{const mx=dateToX(new Date(YEAR,m,1),START_X,endX);return(<g key={l}><line x1={mx} y1={AXIS_Y-3} x2={mx} y2={AXIS_Y+3} stroke="#D1D5DB" strokeWidth={0.8}/><text x={mx} y={AXIS_Y+14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{l}</text></g>);})}
      {/* Today */}
      <line x1={todayX} y1={20} x2={todayX} y2={AXIS_Y} stroke="#EF4444" strokeWidth={0.8} strokeDasharray="3,2"/>
      <text x={todayX} y={16} textAnchor="middle" fontSize={8} fill="#EF4444">Today</text>
      {/* Phase bars */}
      {PHASES.map(p=>{const px1=dateToX(new Date(YEAR,p.m1,1),START_X,endX);const px2=dateToX(new Date(YEAR,p.m2,1),START_X,endX);return(<g key={p.name}><rect x={px1} y={210} width={px2-px1} height={16} rx={4} fill={p.fill}/><text x={(px1+px2)/2} y={222} textAnchor="middle" fontSize={8.5} fill={p.text}>{p.name}</text></g>);})}
      {/* Milestone cards */}
      {milestones.map((m,i)=>{
        const cx=xs[i]; const rx=cx-CARD_W/2;
        const cy=ROW_Y[m.status]??ROW_Y.pending;
        const col=COL[m.status]??COL.pending;
        const isHov=hovered===m.id;
        const isDone=m.status==="done";
        const words=m.name.split(" ");
        const mid=Math.ceil(words.length/2);
        const l1=words.slice(0,mid).join(" "); const l2=words.slice(mid).join(" ");
        const dateStr=m.status==="done"?fmt(m.completedOn,true):m.status==="in_progress"||m.status==="delay"?fmt(m.startedOn,true):"";
        return(
          <g key={m.id} style={{transition:"all 0.4s ease"}}>
            <line x1={cx} y1={cy+CARD_H} x2={cx} y2={AXIS_Y-4} stroke={col.dot} strokeWidth={0.8} strokeDasharray="3,2"/>
            <circle cx={cx} cy={AXIS_Y} r={m.status==="in_progress"||m.status==="delay"?5:4} fill={col.dot} stroke={m.status==="in_progress"?"white":"none"} strokeWidth={1.5}/>
            <rect x={rx} y={cy} width={CARD_W} height={CARD_H} rx={6} fill={col.fill} stroke={col.stroke} strokeWidth={col.sw}
              style={{cursor:m.status==="in_progress"?"pointer":"default"}}
              onClick={()=>m.status==="in_progress"&&onComplete(m)}
              onMouseEnter={()=>setHovered(m.id)} onMouseLeave={()=>setHovered(null)}/>
            {m.status==="in_progress"&&(<><rect x={rx+8} y={cy+CARD_H-8} width={CARD_W-16} height={5} rx={2} fill="#DBEAFE"/><rect x={rx+8} y={cy+CARD_H-8} width={(CARD_W-16)*(m.progress??50)/100} height={5} rx={2} fill="#378ADD"/></>)}
            {m.status==="delay"&&m.delayDays&&<text x={cx} y={cy+CARD_H-4} textAnchor="middle" fontSize={7} fill="#92400E">{m.delayDays}d delay</text>}
            <text x={cx} y={cy+16} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={col.text}>{l1}</text>
            {l2&&<text x={cx} y={cy+26} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={col.text}>{l2}</text>}
            <text x={cx} y={l2?cy+36:cy+30} textAnchor="middle" fontSize={8} fill={col.text}>{STATUS_LBL[m.status]}</text>
            {isHov&&dateStr&&<text x={cx} y={l2?cy+46:cy+40} textAnchor="middle" fontSize={7.5} fill={col.text}>{dateStr}</text>}
            {!isDone&&(
              <>
                <g onClick={e=>{e.stopPropagation();onEdit(m);}} style={{cursor:"pointer"}}>
                  <rect x={rx+2} y={cy+2} width={18} height={16} rx={3} fill="#F0FDF4" stroke="#10B981" strokeWidth={0.5}/>
                  <text x={rx+11} y={cy+13} textAnchor="middle" fontSize={9} fill="#065F46">✎</text>
                </g>
                <g onClick={e=>{e.stopPropagation();onDelete(m);}} style={{cursor:"pointer"}}>
                  <rect x={rx+CARD_W-20} y={cy+2} width={18} height={16} rx={3} fill="#FEF2F2" stroke="#FECACA" strokeWidth={0.5}/>
                  <text x={rx+CARD_W-11} y={cy+13} textAnchor="middle" fontSize={9} fill="#991B1B">×</text>
                </g>
              </>
            )}
          </g>
        );
      })}
    </svg>
    </div>
  );
}

function Modal({mode,init,projectId,onSave,onMarkDone,onClose}:{mode:"add"|"edit";init?:MS|null;projectId:string;onSave:(d:any)=>Promise<void>;onMarkDone:()=>Promise<void>;onClose:()=>void;}){
  const [name,setName]=useState(init?.name||"");
  const [desc,setDesc]=useState(init?.description||"");
  const [status,setStatus]=useState<string>(init?.status||"pending");
  const [prog,setProg]=useState<number>(init?.progress??50);
  const [ddays,setDdays]=useState<number>(init?.delayDays??1);
  const [dreason,setDreason]=useState(init?.delayReason||"");
  const [err,setErr]=useState(""); const [saving,setSaving]=useState(false);

  const save=async()=>{
    if(!name.trim()){setErr("Name is required.");return;}
    setSaving(true);
    await onSave({name:name.trim(),description:desc.trim(),status,progress:status==="in_progress"?prog:null,delayDays:status==="delay"?ddays:null,delayReason:status==="delay"?dreason:null});
    setSaving(false);
  };
  const markDone=async()=>{setSaving(true);await onMarkDone();setSaving(false);};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50}}>
      <div style={{background:"white",borderRadius:12,padding:20,width:360,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{fontSize:14,fontWeight:700,color:"#111827",margin:0}}>{mode==="add"?"Add milestone":"Edit milestone"}</p>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#6B7280"}}><X size={16}/></button>
        </div>
        {err&&<p style={{fontSize:12,color:"#EF4444",marginBottom:8}}>{err}</p>}
        <label style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Milestone Name *</label>
        <input value={name} onChange={e=>{setName(e.target.value);setErr("");}} placeholder="e.g. Furniture installation"
          style={{width:"100%",marginTop:4,marginBottom:12,border:"1px solid #E5E7EB",borderRadius:8,padding:"8px 10px",fontSize:13,boxSizing:"border-box",outline:"none"}}/>
        <label style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Description</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Short description"
          style={{width:"100%",marginTop:4,marginBottom:12,border:"1px solid #E5E7EB",borderRadius:8,padding:"8px 10px",fontSize:13,minHeight:56,boxSizing:"border-box",resize:"vertical",outline:"none"}}/>
        <label style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Phase / Status</label>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          style={{width:"100%",marginTop:4,marginBottom:12,border:"1px solid #E5E7EB",borderRadius:8,padding:"8px 10px",fontSize:13,background:"white",outline:"none",boxSizing:"border-box"}}>
          <option value="pending">Pending (Not started)</option>
          <option value="in_progress">Active (In Progress)</option>
          <option value="delay">Delayed</option>
          <option value="done">Done</option>
        </select>
        {status==="in_progress"&&(
          <><label style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Progress ({prog}%)</label>
          <input type="range" min={0} max={100} value={prog} onChange={e=>setProg(+e.target.value)}
            style={{width:"100%",marginTop:4,marginBottom:12,accentColor:"#378ADD"}}/></>
        )}
        {status==="delay"&&(<>
          <label style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Days Delayed</label>
          <input type="number" min={1} value={ddays} onChange={e=>setDdays(+e.target.value)}
            style={{width:"100%",marginTop:4,marginBottom:12,border:"1px solid #E5E7EB",borderRadius:8,padding:"8px 10px",fontSize:13,boxSizing:"border-box",outline:"none"}}/>
          <label style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Reason for Delay</label>
          <textarea value={dreason} onChange={e=>setDreason(e.target.value)} placeholder="e.g. Material not arrived"
            style={{width:"100%",marginTop:4,marginBottom:12,border:"1px solid #E5E7EB",borderRadius:8,padding:"8px 10px",fontSize:13,minHeight:56,boxSizing:"border-box",resize:"vertical",outline:"none"}}/>
        </>)}
        <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",marginTop:4}}>
          {mode==="add"&&<button onClick={markDone} disabled={saving}
            style={{background:"#6366F1",color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",opacity:saving?0.7:1}}>
            ✓ Mark Project Complete
          </button>}
          <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
            <button onClick={onClose} style={{border:"1px solid #D1D5DB",background:"white",borderRadius:8,padding:"7px 14px",fontSize:12,cursor:"pointer",color:"#374151"}}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{background:"#10B981",color:"white",border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer",opacity:saving?0.7:1,display:"flex",alignItems:"center",gap:6}}>
              {saving&&<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>} Save
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ProgressPage({params}:{params:Promise<{id:string}>}){
  const {id}=use(params);
  const [customer,setCustomer]=useState<any>(null);
  const [project,setProject]=useState<Project|null>(null);
  const [milestones,setMilestones]=useState<MS[]>([]);
  const [loading,setLoading]=useState(true);
  const [confirmDone,setConfirmDone]=useState<MS|null>(null);
  const [confirmDel,setConfirmDel]=useState<MS|null>(null);
  const [showModal,setShowModal]=useState(false);
  const [modalMode,setModalMode]=useState<"add"|"edit">("add");
  const [modalMs,setModalMs]=useState<MS|null>(null);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const [cr,pr]=await Promise.all([fetch(`/api/leads/${id}`),fetch(`/api/projects?customer_id=${id}`)]);
      if(cr.ok) setCustomer(await cr.json());
      if(pr.ok){const p=await pr.json();if(p){setProject(p);setMilestones(p.milestones||[]);}}
      setLoading(false);
    })();
  },[id]);

  const total=milestones.length;
  const done=milestones.filter(m=>m.status==="done").length;
  const pct=total===0?0:Math.round(done/total*100);
  const today=new Date();today.setHours(0,0,0,0);
  const daysActive=project?Math.max(0,Math.floor((today.getTime()-new Date(project.startedOn).getTime())/86400000)):0;
  const allDone=total>0&&done===total;

  const handleMarkDone=async()=>{
    if(!confirmDone) return;
    const r=await fetch(`/api/milestones/${confirmDone.id}/complete`,{method:"PATCH"});
    if(r.ok){const d=await r.json();setMilestones(d.milestones);}
    setConfirmDone(null);
  };
  const handleDelete=async()=>{
    if(!confirmDel) return;
    const r=await fetch(`/api/milestones/${confirmDel.id}`,{method:"DELETE"});
    if(r.ok){const d=await r.json();setMilestones(d.milestones);}
    setConfirmDel(null);
  };
  const handleSave=async(data:any)=>{
    if(!project) return;
    if(modalMode==="add"){
      const r=await fetch("/api/milestones",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({project_id:project.id,...data})});
      if(r.ok){const d=await r.json();setMilestones(d.milestones);}
    }else if(modalMs){
      const r=await fetch(`/api/milestones/${modalMs.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(r.ok){const d=await r.json();setMilestones(d.milestones);}
    }
    setShowModal(false);
  };
  const handleProjectComplete=async()=>{
    if(!project) return;
    const r=await fetch(`/api/projects/${project.id}/complete`,{method:"POST"});
    if(r.ok){const d=await r.json();setMilestones(d.milestones);setProject(p=>p?{...p,isCompleted:true}:p);}
    setShowModal(false);
  };

  if(loading) return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><Loader2 size={32} style={{color:"#10B981",animation:"spin 1s linear infinite"}}/><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style></div>);
  if(!project) return(<div style={{maxWidth:600,margin:"60px auto",textAlign:"center",color:"#6B7280"}}><div style={{fontSize:48,marginBottom:16}}>🏗️</div><h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:8}}>No Project Found</h2><p>A project is auto-created when a lead is converted to a customer.</p><Link href={`/customers/${id}`} style={{display:"inline-block",marginTop:20,padding:"8px 20px",background:"#10B981",color:"white",borderRadius:8,fontSize:13,fontWeight:600,textDecoration:"none"}}>← Back to Profile</Link></div>);

  return(
    <div style={{maxWidth:"100%",paddingBottom:60}}>
      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#9CA3AF",marginBottom:20,flexWrap:"wrap"}}>
        <Link href="/customers" style={{color:"#9CA3AF",textDecoration:"none"}}>Customer Directory</Link>
        <ChevronRight size={12}/>
        <Link href={`/customers/${id}`} style={{color:"#9CA3AF",textDecoration:"none"}}>{customer?.customerName||"Customer"}</Link>
        <ChevronRight size={12}/>
        <span style={{color:"#374151",fontWeight:600}}>Project Progress</span>
      </div>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <h1 style={{fontSize:22,fontWeight:800,color:"#111827",margin:0}}>Project Progress</h1>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"#E1F5EE",color:"#085041",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#10B981",display:"inline-block"}}/> Live
          </span>
        </div>
        <span style={{fontSize:12,color:"#9CA3AF"}}>{customer?.customerName} · Started {fmt(project.startedOn)}</span>
      </div>

      {/* 3 Stat Cards (Est. Completion removed) */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[
          {label:"Overall Progress",val:`${pct}%`,color:"#10B981"},
          {label:"Milestones Done",val:`${done} / ${total}`,color:"#111827"},
          {label:"Days Active",val:`${daysActive}`,color:"#111827"},
        ].map(c=>(
          <div key={c.label} style={{background:"#F9FAFB",borderRadius:8,padding:"8px 14px",border:"1px solid #E5E7EB",flex:1,minWidth:110}}>
            <p style={{fontSize:17,fontWeight:700,color:c.color,margin:"0 0 2px"}}>{c.val}</p>
            <p style={{fontSize:10,color:"#9CA3AF",margin:0,textTransform:"uppercase",letterSpacing:"0.04em"}}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontSize:11,color:allDone?"#10B981":"#9CA3AF",fontWeight:allDone?600:400}}>
          {allDone?"All milestones complete — project handed over! 🎉":"Click blue card to mark done · Hover card to see date · Edit/delete on non-done cards"}
        </span>
        <button onClick={()=>{setModalMode("add");setModalMs(null);setShowModal(true);}}
          style={{display:"flex",alignItems:"center",gap:6,background:"#10B981",color:"white",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          <Plus size={13}/> Add milestone
        </button>
      </div>

      {/* Confirm Done Bar */}
      {confirmDone&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,padding:"8px 14px",marginBottom:10}}>
          <span style={{fontSize:12,fontWeight:500,color:"#1E40AF"}}>Mark "{confirmDone.name}" as complete?</span>
          <div style={{display:"flex",gap:8}}>
            <button onClick={handleMarkDone} style={{background:"#10B981",color:"white",border:"none",borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Yes, mark done</button>
            <button onClick={()=>setConfirmDone(null)} style={{border:"1px solid #D1D5DB",background:"white",borderRadius:6,padding:"5px 12px",fontSize:12,cursor:"pointer",color:"#374151"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Confirm Delete Bar */}
      {confirmDel&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"8px 14px",marginBottom:10}}>
          <span style={{fontSize:12,fontWeight:500,color:"#991B1B"}}>Delete "{confirmDel.name}" milestone?</span>
          <div style={{display:"flex",gap:8}}>
            <button onClick={handleDelete} style={{background:"#EF4444",color:"white",border:"none",borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Yes, delete</button>
            <button onClick={()=>setConfirmDel(null)} style={{border:"1px solid #D1D5DB",background:"white",borderRadius:6,padding:"5px 12px",fontSize:12,cursor:"pointer",color:"#374151"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Timeline Card */}
      <div style={{background:"white",border:"1px solid #E5E7EB",borderRadius:12,padding:"20px 24px"}}>
        {milestones.length===0?(<p style={{textAlign:"center",color:"#9CA3AF",fontSize:13,padding:"40px 0"}}>No milestones yet. Click "+ Add milestone" to get started.</p>):(
          <GanttSVG milestones={milestones}
            onComplete={m=>{setConfirmDel(null);setConfirmDone(m);}}
            onEdit={m=>{setModalMode("edit");setModalMs(m);setShowModal(true);}}
            onDelete={m=>{setConfirmDone(null);setConfirmDel(m);}}/>
        )}
      </div>

      {showModal&&<Modal mode={modalMode} init={modalMs} projectId={project.id} onSave={handleSave} onMarkDone={handleProjectComplete} onClose={()=>setShowModal(false)}/>}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
