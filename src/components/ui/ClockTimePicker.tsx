"use client";

import React, { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClockTimePickerProps {
  value: string; // "HH:mm"
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ClockTimePicker({
  value,
  onChange,
  className,
  placeholder = "Select time",
  required,
  disabled
}: ClockTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const [editingHour, setEditingHour] = useState<string | null>(null);
  const [editingMinute, setEditingMinute] = useState<string | null>(null);
  const [isTypingHour, setIsTypingHour] = useState(false);
  const [isTypingMinute, setIsTypingMinute] = useState(false);
  const minuteInputRef = React.useRef<HTMLInputElement>(null);
  const hourInputRef = React.useRef<HTMLInputElement>(null);
  
  // Internal state for the picker
  const [internalHour, setInternalHour] = useState(12);
  const [internalMinute, setInternalMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Sync internal state with value prop when opening
  useEffect(() => {
    if (isOpen) {
      if (value) {
        const [hStr, mStr] = value.split(":");
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        
        if (!isNaN(h) && !isNaN(m)) {
          setPeriod(h >= 12 ? "PM" : "AM");
          if (h === 0) h = 12;
          else if (h > 12) h -= 12;
          
          setInternalHour(h);
          setInternalMinute(m);
        }
      } else {
        const now = new Date();
        let h = now.getHours();
        setPeriod(h >= 12 ? "PM" : "AM");
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        setInternalHour(h);
        setInternalMinute(Math.round(now.getMinutes() / 5) * 5 % 60); // Round to nearest 5
      }
      setMode("hour");
    }
  }, [isOpen, value]);

  const handleSave = () => {
    let h = internalHour;
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h < 12) h += 12;
    
    const hStr = h.toString().padStart(2, "0");
    const mStr = internalMinute.toString().padStart(2, "0");
    onChange(`${hStr}:${mStr}`);
    setIsOpen(false);
  };

  const getHourPosition = (h: number) => {
    const angle = ((h % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    const r = 95; // radius
    return {
      left: 128 + r * Math.cos(angle),
      top: 128 + r * Math.sin(angle)
    };
  };

  const getMinutePosition = (m: number) => {
    const angle = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const r = 95; // radius
    return {
      left: 128 + r * Math.cos(angle),
      top: 128 + r * Math.sin(angle)
    };
  };

  // Render trigger input
  const displayValue = value ? (() => {
    const [hStr, mStr] = value.split(":");
    let h = parseInt(hStr, 10);
    const p = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    return `${h.toString().padStart(2, "0")}:${mStr} ${p}`;
  })() : "";

  return (
    <>
      <div 
        className="relative cursor-pointer"
        onClick={() => !disabled && setIsOpen(true)}
      >
        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input 
          type="text"
          readOnly
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          className={cn(
            "block w-full rounded-lg border border-slate-200 py-2.5 pr-4 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-sm transition-all outline-none cursor-pointer",
            disabled && "bg-slate-50 cursor-not-allowed opacity-70",
            className
          )}
          style={{ paddingLeft: '2.75rem' }}
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-indigo-600 p-6 text-center relative">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-indigo-700/50 hover:bg-indigo-700 text-indigo-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3">Select Time</p>
              
              <div className="flex items-center justify-center gap-1 text-5xl font-light text-white tracking-tight mt-2">
                <input 
                  ref={hourInputRef}
                  type="text"
                  inputMode="numeric"
                  readOnly={!isTypingHour}
                  onClick={() => setMode("hour")}
                  onDoubleClick={(e) => {
                     setMode("hour");
                     setIsTypingHour(true);
                     setEditingHour(internalHour.toString().padStart(2, "0"));
                     setTimeout(() => {
                        const target = e.target as HTMLInputElement;
                        target.focus();
                        target.select();
                     }, 0);
                  }}
                  onBlur={() => {
                    setIsTypingHour(false);
                    if (editingHour !== null && editingHour !== "") {
                      let h = parseInt(editingHour, 10);
                      if (isNaN(h) || h < 1) h = 1;
                      if (h > 12) h = 12;
                      setInternalHour(h);
                    }
                    setEditingHour(null);
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setEditingHour(val);
                    if (val.length === 2) {
                      let h = parseInt(val, 10);
                      if (h > 12) h = 12;
                      if (h < 1) h = 1;
                      setInternalHour(h);
                      setEditingHour(null);
                      setIsTypingHour(false);
                      setMode("minute");
                      
                      setIsTypingMinute(true);
                      setEditingMinute(internalMinute.toString().padStart(2, "0"));
                      setTimeout(() => {
                         minuteInputRef.current?.focus();
                         minuteInputRef.current?.select();
                      }, 10);
                    }
                  }}
                  value={editingHour !== null ? editingHour : internalHour.toString().padStart(2, "0")}
                  className={cn(
                    "w-20 text-center bg-transparent border-2 outline-none transition-all rounded-xl cursor-pointer",
                    isTypingHour 
                      ? "text-white font-normal drop-shadow-sm border-white bg-indigo-700/50 shadow-md cursor-text" 
                      : mode === "hour"
                        ? "text-white font-normal drop-shadow-sm border-transparent"
                        : "text-indigo-300 hover:text-indigo-100 opacity-80 border-transparent hover:bg-indigo-700/20"
                  )}
                />
                <span className="text-indigo-300 mb-1.5 opacity-80">:</span>
                <input 
                  ref={minuteInputRef}
                  type="text"
                  inputMode="numeric"
                  readOnly={!isTypingMinute}
                  onClick={() => setMode("minute")}
                  onDoubleClick={(e) => {
                     setMode("minute");
                     setIsTypingMinute(true);
                     setEditingMinute(internalMinute.toString().padStart(2, "0"));
                     setTimeout(() => {
                        const target = e.target as HTMLInputElement;
                        target.focus();
                        target.select();
                     }, 0);
                  }}
                  onBlur={() => {
                    setIsTypingMinute(false);
                    if (editingMinute !== null && editingMinute !== "") {
                      let m = parseInt(editingMinute, 10);
                      if (isNaN(m) || m < 0) m = 0;
                      if (m > 59) m = 59;
                      setInternalMinute(m);
                    }
                    setEditingMinute(null);
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setEditingMinute(val);
                    if (val.length === 2) {
                      let m = parseInt(val, 10);
                      if (m > 59) m = 59;
                      setInternalMinute(m);
                      setEditingMinute(null);
                      setIsTypingMinute(false);
                      setTimeout(() => minuteInputRef.current?.blur(), 10);
                    }
                  }}
                  value={editingMinute !== null ? editingMinute : internalMinute.toString().padStart(2, "0")}
                  className={cn(
                    "w-20 text-center bg-transparent border-2 outline-none transition-all rounded-xl cursor-pointer",
                    isTypingMinute 
                      ? "text-white font-normal drop-shadow-sm border-white bg-indigo-700/50 shadow-md cursor-text" 
                      : mode === "minute"
                        ? "text-white font-normal drop-shadow-sm border-transparent"
                        : "text-indigo-300 hover:text-indigo-100 opacity-80 border-transparent hover:bg-indigo-700/20"
                  )}
                />

                <div className="flex flex-col ml-4 gap-1.5 justify-center">
                  <button 
                    type="button"
                    onClick={() => setPeriod("AM")}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all border border-transparent tracking-wide",
                      period === "AM" ? "bg-white text-indigo-700 shadow-sm" : "text-indigo-200 hover:text-white border-indigo-400/30"
                    )}
                  >
                    AM
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPeriod("PM")}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all border border-transparent tracking-wide",
                      period === "PM" ? "bg-white text-indigo-700 shadow-sm" : "text-indigo-200 hover:text-white border-indigo-400/30"
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Clock Face */}
            <div className="p-8 flex items-center justify-center bg-slate-50/80">
              <div className="relative w-64 h-64 rounded-full bg-white shadow-sm border border-slate-200/60 flex items-center justify-center">
                {/* Center dot */}
                <div className="w-2 h-2 rounded-full bg-indigo-600 absolute z-20" />
                
                {/* Hand line */}
                {(() => {
                  const angle = mode === "hour" 
                    ? ((internalHour % 12) / 12) * Math.PI * 2 - Math.PI / 2
                    : (internalMinute / 60) * Math.PI * 2 - Math.PI / 2;
                  
                  // The line length is exactly the radius up to the number (95 - 16 = 79)
                  const lineLength = 79;
                  
                  return (
                    <div 
                      className="absolute z-10 w-[2px] bg-indigo-500 origin-bottom rounded-full opacity-70"
                      style={{
                        height: `${lineLength}px`,
                        bottom: '128px',
                        left: '127px',
                        transform: `rotate(${angle + Math.PI / 2}rad)`
                      }}
                    />
                  );
                })()}

                {/* Numbers */}
                {mode === "hour" ? (
                  [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
                    const pos = getHourPosition(h);
                    const isActive = internalHour === h || (internalHour === 0 && h === 12);
                    return (
                      <button
                        key={`hour-${h}`}
                        type="button"
                        onClick={() => {
                          setInternalHour(h);
                          setTimeout(() => setMode("minute"), 300);
                        }}
                        className={cn(
                          "absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-sm font-medium z-20 transition-all",
                          isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-slate-100"
                        )}
                        style={{ left: pos.left, top: pos.top }}
                      >
                        {h}
                      </button>
                    );
                  })
                ) : (
                  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                    const pos = getMinutePosition(m);
                    const isActive = internalMinute === m;
                    return (
                      <button
                        key={`minute-${m}`}
                        type="button"
                        onClick={() => {
                          setInternalMinute(m);
                        }}
                        className={cn(
                          "absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-sm font-medium z-20 transition-all",
                          isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-slate-100"
                        )}
                        style={{ left: pos.left, top: pos.top }}
                      >
                        {m.toString().padStart(2, "0")}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <button 
                 type="button"
                 onClick={() => {
                   const now = new Date();
                   let h = now.getHours();
                   setPeriod(h >= 12 ? "PM" : "AM");
                   if (h === 0) h = 12;
                   else if (h > 12) h -= 12;
                   setInternalHour(h);
                   setInternalMinute(now.getMinutes());
                 }}
                 className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
               >
                 Now
               </button>
               <div className="flex gap-2">
                 <button 
                   type="button"
                   onClick={() => setIsOpen(false)}
                   className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   type="button"
                   onClick={handleSave}
                   className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95"
                 >
                   Save
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
