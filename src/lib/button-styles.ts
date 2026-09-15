import { cn } from "@/lib/utils";

export const buttonBase = "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export const buttonVariants = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus-visible:ring-indigo-500",
  secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400",
  danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500",
  ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
  outline: "border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-500",
} as const;

export const buttonSizes = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2 rounded-xl gap-2",
  lg: "text-sm px-5 py-2.5 rounded-xl gap-2.5",
  icon: "h-9 w-9 rounded-lg p-0",
  iconSm: "h-7 w-7 rounded-md p-0",
} as const;

export function buttonStyle({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
} = {}) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}
