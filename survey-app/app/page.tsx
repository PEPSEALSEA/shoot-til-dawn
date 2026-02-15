import Link from 'next/link';
import { LayoutDashboard, ClipboardList, Gamepad2, ArrowRight, Trophy } from 'lucide-react';

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
          มากกว่าแค่ <br />คะแนนบนบอร์ด
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mb-12 font-medium">
          ระบบติดตามความรู้สึกผู้เล่นและประสิทธิภาพของเกมอย่างเป็นทางการ
          รวบรวมข้อมูลทางอารมณ์และแสดงผลเส้นทางการเล่นแบบ Real-time
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          <Link href="/survey" className="group">
            <div className="h-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10 hover:border-indigo-500/50 hover:scale-[1.02] text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ClipboardList className="w-32 h-32" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">แบบสอบถามผู้เล่น</h3>
              <p className="text-slate-400 mb-6">เข้าถึงแบบฟอร์มแสดงความคิดเห็นทั้งก่อนและหลังการเล่นเกม</p>
              <div className="flex items-center gap-2 text-indigo-400 font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                เปิดระบบแบบสอบถาม <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/leaderboard" className="group">
            <div className="h-full p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-3xl transition-all hover:bg-white/20 hover:border-yellow-500/50 hover:scale-[1.05] text-left relative overflow-hidden shadow-2xl shadow-yellow-500/10">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-32 h-32" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-yellow-500 flex items-center justify-center mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">ตารางคะแนน</h3>
              <p className="text-slate-400 mb-6">ตรวจสอบคะแนนสูงสุดและอันดับของคุณในหมู่ผู้รอดชีวิต</p>
              <div className="flex items-center gap-2 text-yellow-500 font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                ดูอันดับทั้งหมด <ArrowRight className="w-4 h-4" />
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
              <h3 className="text-2xl font-bold mb-3">ข้อมูลสำหรับผู้ดูแล</h3>
              <p className="text-slate-400 mb-6">ดูบทวิเคราะห์เชิงลึก แนวโน้มทางอารมณ์ และบทสรุปความคิดเห็น</p>
              <div className="flex items-center gap-2 text-purple-400 font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                เปิดแผงควบคุม <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        <footer className="mt-24 text-slate-600 font-bold uppercase tracking-[0.2em] text-xs">
          พัฒนาโดย Next.js & Recharts • v1.0.0
        </footer>
      </div>
    </main>
  );
}
