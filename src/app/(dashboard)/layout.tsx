import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#090d16] transition-colors duration-150 relative overflow-hidden">
      {/* Ambient Mesh Lighting (Zero-interaction, pointer-events-none) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-100px] left-1/3 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/5 dark:bg-indigo-500/[0.07] blur-[140px]" />
        <div className="absolute bottom-[-50px] right-[-50px] h-[350px] w-[500px] rounded-full bg-purple-500/5 dark:bg-purple-500/[0.06] blur-[140px]" />
      </div>

      {/* SVG Grain Texture to eliminate color-banding in Dark Mode */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02] dark:opacity-[0.035] mix-blend-overlay"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <Topbar />
        
        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
