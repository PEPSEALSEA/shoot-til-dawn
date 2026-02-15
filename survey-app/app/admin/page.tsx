'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
    Users, FileText, Activity, TrendingUp, BarChart3, Clock,
    AlertCircle, Gamepad2, Brain, Heart, Zap, Award
} from 'lucide-react';
import { Stats } from '@/lib/types';
import { GAS_WEBAPP_URL, GasStatsResponse } from '@/lib/api-config';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${GAS_WEBAPP_URL}?action=getStats`)
            .then(res => res.json())
            .then((data: GasStatsResponse) => {
                if (!data.success) throw new Error("API error");

                const gs = data.statistics;
                // Transform GAS data for our charts
                const transformedStats = {
                    ...gs,
                    comparisonData: [
                        { subject: 'ความเครียด', pre: parseFloat(gs.averageScores.preGame?.stress || '0'), post: parseFloat(gs.averageScores.postGame?.stress || '0') },
                        { subject: 'ความสุข', pre: parseFloat(gs.averageScores.preGame?.happiness || '0'), post: parseFloat(gs.averageScores.postGame?.happiness || '0') },
                        { subject: 'พลังงาน', pre: parseFloat(gs.averageScores.preGame?.energy || '0'), post: parseFloat(gs.averageScores.postGame?.energy || '0') },
                    ],
                    experienceData: [
                        { subject: 'ความสนุก', value: parseFloat(gs.averageScores.postGame?.fun || '0') },
                        { subject: 'ความพึงพอใจ', value: parseFloat(gs.averageScores.postGame?.satisfaction || '0') },
                        { subject: 'ความท้าทาย', value: parseFloat(gs.averageScores.postGame?.difficulty || '0') },
                    ],
                    ageData: Object.keys(gs.demographics.ageGroups).map(key => ({
                        name: key,
                        value: gs.demographics.ageGroups[key]
                    })).filter(d => d.value > 0),
                    expPerfData: gs.experiencePerformance.map(d => ({
                        name: d.name,
                        score: parseInt(d.score)
                    })),
                    timelineData: gs.dailyTrends.map(d => ({
                        date: d.date.split('-').slice(1).join('/'), // View as MM/DD
                        score: parseInt(d.avgScore),
                        happy: parseFloat(d.avgHappiness)
                    }))
                };
                setStats(transformedStats);
                setLoading(false);
            })
            .catch(err => {
                setError("ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้");
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 rounded-full" />
                    <div className="absolute top-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-xl font-bold text-slate-800 animate-pulse">กำลังจัดเตรียมข้อมูลแผงควบคุม...</p>
                    <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-semibold text-pretty">Shoot till Dawn Analytics</p>
                </div>
            </div>
        </div>
    );

    if (error || !stats) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="bg-white p-12 rounded-[40px] shadow-2xl shadow-indigo-100 flex flex-col items-center text-center gap-6 border border-white">
                <div className="p-6 bg-red-50 rounded-full">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">เกิดข้อผิดพลาดในการเชื่อมต่อ</h2>
                    <p className="text-slate-500 max-w-xs mx-auto">{error || "ไม่พบข้อมูลที่ต้องการในขณะนี้"}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-200"
                >
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        </div>
    );

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981'];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-100 pb-20">
            {/* Top Navigation / Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                            <Gamepad2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">ADMIN DASHBOARD</h1>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">Shoot till Dawn • Analytics v2</p>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        label="ผู้เล่นทั้งหมด"
                        value={stats.totalPlayers}
                        subLabel="ลงทะเบียนแล้ว"
                        icon={<Users className="w-6 h-6" />}
                        trend="Real-time"
                        color="indigo"
                    />
                    <StatCard
                        label="การเข้าเล่น"
                        value={stats.totalSessions}
                        subLabel="Sessions ทั้งหมด"
                        icon={<Activity className="w-6 h-6" />}
                        trend="Total"
                        color="purple"
                    />
                    <StatCard
                        label="แบบสำรวจ"
                        value={stats.completedSurveys}
                        subLabel="Completed surveys"
                        icon={<FileText className="w-6 h-6" />}
                        trend="Latest"
                        color="rose"
                    />
                    <StatCard
                        label="คะแนนเฉลี่ย"
                        value={stats.averageScore || 0}
                        subLabel="จากทุก Session"
                        icon={<Award className="w-6 h-6" />}
                        trend="Global"
                        color="emerald"
                    />
                </div>

                {/* Charts Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Emotional Delta Comparison */}
                    <ChartContainer title="ระดับอารมณ์: ก่อน vs หลังเล่นเกม" subtitle="เปรียบเทียบค่าเฉลี่ยความรู้สึกในด้านต่างๆ" className="lg:col-span-8">
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="subject"
                                        stroke="#94a3b8"
                                        fontSize={13}
                                        fontWeight={600}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, 10]}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-50 min-w-[150px]">
                                                        <p className="font-bold text-slate-800 mb-2 border-b pb-2">{payload[0].payload.subject}</p>
                                                        {payload.map((entry: any, i) => (
                                                            <div key={i} className="flex items-center justify-between gap-4 mt-1">
                                                                <span className="text-xs font-bold text-slate-400 uppercase">{entry.name}:</span>
                                                                <span className="text-sm font-black" style={{ color: entry.fill }}>{entry.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '30px', fontWeight: 'bold', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="pre" name="ก่อนเล่น" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                                    <Bar dataKey="post" name="หลังเล่น" fill="#a855f7" radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartContainer>

                    {/* Radar Chart for Experience */}
                    <ChartContainer title="สถิติประสบการณ์" subtitle="ความรู้สึกหลังเล่นเกม" className="lg:col-span-4">
                        <div className="h-[350px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.experienceData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Level"
                                        dataKey="value"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="#6366f1"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartContainer>

                    {/* Age Demographics */}
                    <ChartContainer title="กลุ่มผู้เล่นตามช่วงอายุ" subtitle="จำนวนผู้เล่นแยกตามกลุ่มอายุ" className="lg:col-span-4">
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.ageData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.ageData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartContainer>

                    {/* Experience Performance */}
                    <ChartContainer title="คะแนนตามประสบการณ์" subtitle="คะแนนเฉลี่ยแยกตามระดับทักษะ" className="lg:col-span-8">
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={stats.expPerfData} margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="score" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartContainer>

                    {/* Timeline Analysis - Integrated with real data */}
                    <ChartContainer title="แนวโน้มความสุขและคะแนนสุทธิ" subtitle="ความสุขที่เปลี่ยนไปและคะแนนเฉลี่ยรายวัน" className="lg:col-span-8">
                        <div className="h-[350px] w-full mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.timelineData}>
                                    <defs>
                                        <linearGradient id="colorHappy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis yAxisId="left" stroke="#6366f1" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="happy"
                                        name="ความสุขเฉลี่ย (1-10)"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorHappy)"
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="score"
                                        name="คะแนนเฉลี่ย"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartContainer>

                    {/* Recent Feedback Feed */}
                    <ChartContainer title="ความคิดเห็นล่าสุด" subtitle="ฟีดข้อมูลจากผู้เล่น 5 อันดับล่าสุด" className="lg:col-span-4">
                        <div className="flex flex-col gap-4 mt-6 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.recentFeedback?.map((fb: any, i: number) => (
                                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-white transition-all hover:bg-white hover:shadow-md group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{fb.player}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{fb.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">"{fb.comment}"</p>
                                </div>
                            ))}
                            {(!stats.recentFeedback || stats.recentFeedback.length === 0) && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <Clock className="w-8 h-8 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">ยังไม่มีความคิดเห็น</p>
                                </div>
                            )}
                        </div>
                    </ChartContainer>

                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, subLabel, icon, trend, color }: any) {
    const colors: any = {
        indigo: 'bg-indigo-50 text-indigo-600',
        purple: 'bg-purple-50 text-purple-600',
        rose: 'bg-rose-50 text-rose-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
        <div className="bg-white p-7 rounded-[32px] border border-white shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-50/50 group overflow-hidden relative">
            <div className={`p-4 rounded-2xl w-fit mb-4 transition-colors ${colors[color]} group-hover:scale-110 duration-300`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline justify-between">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${color === 'rose' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {trend}
                    </span>
                </div>
                <p className="text-[11px] font-bold text-slate-300 uppercase mt-2">{subLabel}</p>
            </div>
            {/* Background pattern */}
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-slate-50 rounded-full opacity-50 pointer-events-none group-hover:scale-150 transition-transform" />
        </div>
    );
}

function ChartContainer({ title, subtitle, children, className = "" }: any) {
    return (
        <section className={`bg-white p-8 rounded-[40px] border border-white shadow-sm ${className}`}>
            <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}
