"use client";

import { Users, PhoneCall, CalendarCheck, TrendingUp } from "lucide-react";

const stats = [
  { name: "Total Inquiries", stat: "148", icon: Users, change: "12%", changeType: "increase" },
  { name: "Pending Follow-ups", stat: "24", icon: PhoneCall, change: "2", changeType: "decrease" },
  { name: "Meetings Today", stat: "5", icon: CalendarCheck, change: "0", changeType: "neutral" },
  { name: "Conversion Rate", stat: "24.5%", icon: TrendingUp, change: "4.2%", changeType: "increase" },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold leading-6 text-slate-900 mb-8">
        Today's Overview
      </h1>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-slate-100"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-slate-900">{item.stat}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold
                  ${item.changeType === "increase" ? "text-emerald-600" : ""}
                  ${item.changeType === "decrease" ? "text-rose-600" : ""}
                  ${item.changeType === "neutral" ? "text-slate-500" : ""}
                `}
              >
                {item.changeType === "increase" ? (
                  <svg className="h-5 w-5 flex-shrink-0 self-center text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                ) : item.changeType === "decrease" ? (
                  <svg className="h-5 w-5 flex-shrink-0 self-center text-rose-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  </svg>
                ) : null}
                <span className="sr-only"> {item.changeType === "increase" ? "Increased" : item.changeType === "decrease" ? "Decreased" : ""} by </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Placeholder for Recent Activity */}
        <div className="bg-white rounded-xl shadow border border-slate-100 p-6 min-h-[400px]">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Recent Activity</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            Activity Timeline Component will go here
          </div>
        </div>

        {/* Placeholder for Follow-ups Schedule */}
        <div className="bg-white rounded-xl shadow border border-slate-100 p-6 min-h-[400px]">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Urgent Follow-ups</h2>
          <div className="flex items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            Follow-up List Component will go here
          </div>
        </div>
      </div>
    </div>
  );
}
