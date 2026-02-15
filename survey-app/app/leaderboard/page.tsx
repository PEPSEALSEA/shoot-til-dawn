'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Trophy, Medal, Star, Timer, Target, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { GAS_WEBAPP_URL, LeaderboardEntry, GasLeaderboardResponse } from '@/lib/api-config';

function LeaderboardContent() {
    const searchParams = useSearchParams();
    const highlightPlayerId = searchParams.get('playerId');

    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch(`${GAS_WEBAPP_URL}?action=getLeaderboard&limit=50`)
            .then(res => res.json())
            .then((data: GasLeaderboardResponse) => {
                if (data.success) {
                    setEntries(data.leaderboard);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredEntries = entries.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.playerId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto">
            {/* Search & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic">HALL OF FAME</h1>
                    <p className="text-indigo-300 font-bold uppercase tracking-widest text-sm">Top 50 Survivors • Shoot-Til-Dawn</p>
                </div>
                <div className="relative group max-w-xs w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search survivor..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-xl transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-indigo-200 font-bold animate-pulse">Syncing Scores...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEntries.map((entry, index) => (
                        <div
                            key={entry.playerId}
                            className={`group relative flex items-center gap-6 p-6 rounded-3xl transition-all hover:scale-[1.01] ${entry.playerId === highlightPlayerId
                                    ? 'bg-indigo-600/20 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {/* Rank */}
                            <div className="flex-shrink-0 w-12 text-center">
                                {index === 0 ? <Trophy className="w-10 h-10 text-yellow-400 mx-auto drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" /> :
                                    index === 1 ? <Medal className="w-10 h-10 text-slate-300 mx-auto" /> :
                                        index === 2 ? <Medal className="w-10 h-10 text-amber-600 mx-auto" /> :
                                            <span className="text-2xl font-black text-slate-500 group-hover:text-white transition-colors">#{index + 1}</span>}
                            </div>

                            {/* Player Info */}
                            <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-bold text-white capitalize">{entry.name}</h3>
                                    {index < 3 && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ID: {entry.playerId}</span>
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <Target className="w-3 h-3" />
                                        <span className="text-xs font-bold font-mono">LVL {entry.level}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Score */}
                            <div className="text-right">
                                <div className="text-3xl font-black text-indigo-400 group-hover:text-indigo-300 transition-colors font-mono tracking-tighter leading-none">
                                    {entry.score.toLocaleString()}
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Points Earned</p>
                            </div>

                            {/* Current Player Indicator */}
                            {entry.playerId === highlightPlayerId && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                    Your Best Score
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredEntries.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-slate-500 font-bold text-xl uppercase tracking-widest">No survivors found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white py-16 px-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[150px]" />
            </div>

            <div className="container mx-auto relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs mb-12 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Portal
                </Link>

                <Suspense fallback={<div>Loading Leaderboard...</div>}>
                    <LeaderboardContent />
                </Suspense>
            </div>
        </div>
    );
}
