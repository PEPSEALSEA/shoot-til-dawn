import Link from 'next/link';
import { LayoutDashboard, ClipboardList, Gamepad2, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="container mx-auto px-6 py-24 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
          <Gamepad2 className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold tracking-widest uppercase text-indigo-200">Shoot-Til-Dawn Analytics</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent">
          BEYOND THE <br />SCOREBOARD
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mb-12 font-medium">
          The official player sentiment and game performance tracking system.
          Capture emotional data and visualize player journeys in real-time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <Link href="/survey" className="group">
            <div className="h-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10 hover:border-indigo-500/50 hover:scale-[1.02] text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ClipboardList className="w-32 h-32" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Player Survey</h3>
              <p className="text-slate-400 mb-6">Access the pre-game and post-game feedback forms used by players in-game.</p>
              <div className="flex items-center gap-2 text-indigo-400 font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                Open Portal <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="h-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10 hover:border-purple-500/50 hover:scale-[1.02] text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <LayoutDashboard className="w-32 h-32" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mb-6">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Admin Insight</h3>
              <p className="text-slate-400 mb-6">View comprehensive analytics, player emotional trends, and feedback summaries.</p>
              <div className="flex items-center gap-2 text-purple-400 font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                Launch Dashboard <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        <footer className="mt-24 text-slate-600 font-bold uppercase tracking-[0.2em] text-xs">
          Powered by Next.js & Recharts • v1.0.0
        </footer>
      </div>
    </main>
  );
}
