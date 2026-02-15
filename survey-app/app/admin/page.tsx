'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, FileText, Activity, TrendingUp, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { Stats } from '@/lib/types';
import { GAS_WEBAPP_URL, GasStatsResponse } from '@/lib/api-config';

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${GAS_WEBAPP_URL}?action=getStats`)
            .then(res => res.json())
            .then((data: GasStatsResponse) => {
                if (!data.success) throw new Error("API error");

                const gs = data.statistics;
                // Transform GAS data to our Stats interface
                const transformedStats: Stats = {
                    totalPlayers: gs.totalPlayers,
                    totalSurveys: gs.completedSurveys,
                    averageStress: {
                        pre: parseFloat(gs.averageScores.preGame?.stress || '0'),
                        post: parseFloat(gs.averageScores.postGame?.stress || '0')
                    },
                    averageHappiness: {
                        pre: parseFloat(gs.averageScores.preGame?.happiness || '0'),
                        post: parseFloat(gs.averageScores.postGame?.happiness || '0')
                    },
                    averageEnergy: {
                        pre: parseFloat(gs.averageScores.preGame?.energy || '0'),
                        post: 0 // GAS doesn't have post-game energy in its stats function yet
                    },
                    surveysByType: [
                        { name: 'Completed', value: gs.completedSurveys },
                        { name: 'Sessions', value: gs.totalSessions },
                    ],
                    timeline: [
                        { date: new Date().toISOString().split('T')[0], pre: gs.completedSurveys, post: gs.totalSessions }
                    ],
                };
                setStats(transformedStats);
                setLoading(false);
            })
            .catch(err => {
                setError("Failed to load statistics from Google Sheets");
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">Initializing Dashboard...</p>
            </div>
        </div>
    );

    if (error || !stats) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 border border-red-100">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-slate-800">Connection Error</h2>
                <p className="text-slate-500">{error || "No data available"}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl">Retry</button>
            </div>
        </div>
    );

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

    const radarData = [
        { subject: 'Stress', pre: stats.averageStress.pre, post: stats.averageStress.post },
        { subject: 'Happiness', pre: stats.averageHappiness.pre, post: stats.averageHappiness.post },
        { subject: 'Energy', pre: stats.averageEnergy.pre, post: stats.averageEnergy.post },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Game Insights</h1>
                </div>
                <p className="text-slate-500 font-medium">Real-time player sentiment and gameplay analysis</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Total Players" value={stats.totalPlayers} icon={<Users />} color="blue" />
                <StatCard title="Total Surveys" value={stats.totalSurveys} icon={<FileText />} color="purple" />
                <StatCard title="Avg. Stress" value={stats.averageStress.post.toFixed(1)} icon={<Activity />} color="rose" />
                <StatCard title="Avg. Fun" value={stats.averageHappiness.post.toFixed(1)} icon={<TrendingUp />} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timeline Chart */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-800">Feedback Velocity</h2>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.timeline}>
                                <defs>
                                    <linearGradient id="colorPre" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="pre" name="Pre-Game" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPre)" />
                                <Area type="monotone" dataKey="post" name="Post-Game" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorPost)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Comparison Radar/Bar */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <h2 className="text-xl font-bold text-slate-800">Pre vs Post Comparison</h2>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={radarData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="pre" name="Before Playing" fill="#6366f1" radius={[10, 10, 0, 0]} />
                                <Bar dataKey="post" name="After Playing" fill="#a855f7" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Survey Mix */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-xl font-bold text-slate-800">Data Distribution</h2>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.surveysByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stats.surveysByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-black text-slate-800">{stats.totalSurveys}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        rose: 'bg-rose-50 text-rose-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 transition-transform hover:scale-[1.02]">
            <div className={`p-4 rounded-2xl ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-black text-slate-800">{value}</p>
            </div>
        </div>
    );
}
