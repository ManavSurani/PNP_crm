"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Search, User as UserIcon, LogOut, Loader2, MapPin, Phone, ArrowRight } from "lucide-react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

export default function Topbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <header 
      suppressHydrationWarning
      className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-white/8 bg-white dark:bg-[#0d131f] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-colors duration-150"
    >
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1" ref={dropdownRef}>
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            ) : (
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            )}
          </div>
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:ring-0 sm:text-sm outline-none"
            placeholder="Search leads, orders, or customers..."
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />

          {/* Search Results Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 w-full max-w-2xl mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[70vh] overflow-y-auto p-2 space-y-1">
                {results.length > 0 ? (
                  results.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => handleSelect(res.href)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors group text-left border border-transparent hover:border-slate-100 dark:hover:border-slate-700/60"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                          {res.title.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{res.title}</h4>
                            <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {res.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                              <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                              {res.phone}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                              <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                              {res.subtitle}
                            </div>
                          </div>
                          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-800/40">
                             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.1em]">Currently In:</span>
                             <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{res.location}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-500">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">No matching records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching by name, phone, or service</p>
                  </div>
                )}
              </div>
              {results.length > 0 && (
                <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                  Showing {results.length} results matching "{query}"
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-x-3 lg:gap-x-4">
          <ThemeToggle />
          <NotificationBell />

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-slate-800" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative flex items-center gap-x-4 group">
            <button className="-m-1.5 flex items-center p-1.5 cursor-pointer" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserIcon className="h-5 w-5" />
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-slate-900 dark:text-white" aria-hidden="true">
                  {status === "loading" ? "..." : (session?.user?.name || "User")}
                </span>
              </span>
            </button>
            <div 
              suppressHydrationWarning
              className="hidden group-hover:block absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-900 py-1 shadow-2xl border border-slate-100 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-[60]"
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {status === "loading" ? "..." : (session?.user?.name || "User")}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {status === "loading" ? "..." : (session?.user?.role?.toLowerCase() || "Role")}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
