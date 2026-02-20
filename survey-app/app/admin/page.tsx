'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis,
    ReferenceLine
} from 'recharts';
import { GAS_WEBAPP_URL, GasStatsResponse, GasSurveyChangesResponse, SurveyChange } from '@/lib/api-config';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
    indigo: '#6366f1', purple: '#a855f7', rose: '#f43f5e',
    amber: '#f59e0b', emerald: '#10b981', sky: '#0ea5e9',
    slate: '#64748b', red: '#ef4444',
};
const PIE_COLORS = [C.indigo, C.purple, C.rose, C.amber, C.emerald];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (v: number, max = 10) => ((v / max) * 100).toFixed(1);
const delta = (post: number, pre: number) => post - pre;
const deltaPct = (post: number, pre: number) =>
    pre === 0 ? 0 : (((post - pre) / pre) * 100);
const sign = (n: number) => (n > 0 ? '+' : '');
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

function avg(arr: number[]): number {
    if (!arr.length) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashData {
    stats: any;
    changes: SurveyChange[];
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [data, setData] = useState<DashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'overview' | 'comparison' | 'players' | 'trends'>('overview');
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, changesRes] = await Promise.all([
                fetch(`${GAS_WEBAPP_URL}?action=getStats`),
                fetch(`${GAS_WEBAPP_URL}?action=getSurveyChanges`),
            ]);
            const statsJson: GasStatsResponse = await statsRes.json();
            const changesJson: GasSurveyChangesResponse = await changesRes.json();
            if (!statsJson.success) throw new Error('Stats API failed');
            setData({ stats: statsJson.statistics, changes: changesJson.changes || [] });
            setLastRefresh(new Date());
        } catch (e: any) {
            setError(e.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Derived data ──────────────────────────────────────────────────────────
    const derived = useMemo(() => {
        if (!data) return null;
        const { stats, changes } = data;
        const gs = stats;

        // Pre/Post averages
        const preAvg = gs.averageScores?.preGame ?? {};
        const postAvg = gs.averageScores?.postGame ?? {};

        // Comparison bars (before vs after averaged)
        const comparisonData = [
            { metric: 'ความเครียด', pre: +preAvg.stress || 0, post: +postAvg.stress || 0, lower_is_better: true },
            { metric: 'ความสุข', pre: +preAvg.happiness || 0, post: +postAvg.happiness || 0, lower_is_better: false },
            { metric: 'ความตื่นตัว', pre: +preAvg.energy || 0, post: +postAvg.energy || 0, lower_is_better: false },
        ].map(d => ({
            ...d,
            delta: delta(d.post, d.pre),
            deltaPct: deltaPct(d.post, d.pre),
            prePct: +pct(d.pre),
            postPct: +pct(d.post),
        }));

        // Post-game experience radar
        const experienceData = [
            { subject: 'ความสนุก', value: +postAvg.fun || 0 },
            { subject: 'ความพึงพอใจ', value: +postAvg.satisfaction || 0 },
            { subject: 'ความท้าทาย', value: +postAvg.difficulty || 0 },
            { subject: 'ความสุข', value: +postAvg.happiness || 0 },
            { subject: 'ความตื่นตัว', value: +postAvg.energy || 0 },
        ];

        // Per-player delta table from getSurveyChanges
        const playerRows = changes.map(c => ({
            id: c.sessionId,
            pid: c.playerId,
            pre_stress: c.pre.stress, post_stress: c.post.stress,
            pre_happy: c.pre.happiness, post_happy: c.post.happiness,
            pre_energy: c.pre.energy, post_energy: c.post.energy,
            d_stress: c.delta.stress,
            d_happy: c.delta.happiness,
            d_energy: c.delta.energy,
            fun: c.post.fun, satisfaction: c.post.satisfaction, difficulty: c.post.difficulty,
        }));

        // Delta distribution for scatter/bar
        const deltaDistStress = changes.map(c => c.delta.stress);
        const deltaDistHappy = changes.map(c => c.delta.happiness);
        const deltaDistEnergy = changes.map(c => c.delta.energy);

        // Summary stats
        const n = changes.length;
        const hasMatchedData = n > 0;

        // If no matched pairs, derive delta from averaged pre/post scores as fallback
        const avgDeltaStress = hasMatchedData ? avg(deltaDistStress) : delta(+postAvg.stress || 0, +preAvg.stress || 0);
        const avgDeltaHappy = hasMatchedData ? avg(deltaDistHappy) : delta(+postAvg.happiness || 0, +preAvg.happiness || 0);
        const avgDeltaEnergy = hasMatchedData ? avg(deltaDistEnergy) : delta(+postAvg.energy || 0, +preAvg.energy || 0);
        const improvedHappy = hasMatchedData ? changes.filter(c => c.delta.happiness > 0).length : -1;
        const reducedStress = hasMatchedData ? changes.filter(c => c.delta.stress < 0).length : -1;
        const improvedEnergy = hasMatchedData ? changes.filter(c => c.delta.energy > 0).length : -1;

        // Histogram bins for delta stress (-5 to +5)
        const bins = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        const stressBins = bins.map(b => ({
            bin: `${sign(b)}${b}`, count: deltaDistStress.filter(v => Math.round(v) === b).length
        }));
        const happyBins = bins.map(b => ({
            bin: `${sign(b)}${b}`, count: deltaDistHappy.filter(v => Math.round(v) === b).length
        }));
        const hasHistogramData = hasMatchedData;

        // Age pie
        const ageData = Object.entries(gs.demographics?.ageGroups ?? {})
            .map(([name, value]) => ({ name, value: value as number }))
            .filter(d => (d.value as number) > 0);

        // Gender pie
        const genderData = Object.entries(gs.demographics?.gender ?? {})
            .map(([name, value]) => ({ name, value: value as number }))
            .filter(d => (d.value as number) > 0);

        // Timeline
        const timelineData = (gs.dailyTrends ?? []).map((d: any) => ({
            date: d.date.split('-').slice(1).join('/'),
            score: parseInt(d.avgScore),
            happy: parseFloat(d.avgHappiness),
            sessions: d.sessions,
        }));

        // Exp perf
        const expPerfData = (gs.experiencePerformance ?? []).map((d: any) => ({
            name: d.name, score: parseInt(d.score)
        }));

        // Recent emotional (post 20)
        const recentEmotional = gs.recentEmotionalComparison ?? [];

        return {
            comparisonData, experienceData, playerRows,
            avgDeltaStress, avgDeltaHappy, avgDeltaEnergy,
            improvedHappy, reducedStress, improvedEnergy, n,
            stressBins, happyBins, hasHistogramData, hasMatchedData,
            ageData, genderData, timelineData, expPerfData, recentEmotional,
            preAvg, postAvg,
        };
    }, [data]);

    // ── Render states ──────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
            <div style={{ width: 64, height: 64, border: '4px solid #6366f133', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#a5b4fc', fontWeight: 700, letterSpacing: 4, fontSize: 13, textTransform: 'uppercase' }}>กำลังโหลดข้อมูลวิจัย...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (error || !data || !derived) return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: '#f87171', fontSize: 18, fontWeight: 700 }}>⚠ {error || 'ไม่พบข้อมูล'}</p>
            <button onClick={load} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 28px', fontWeight: 700, cursor: 'pointer' }}>ลองใหม่</button>
        </div>
    );

    const d = derived;
    const tabs = [
        { id: 'overview', label: '📊 ภาพรวม' },
        { id: 'comparison', label: '⚖️ ก่อน/หลัง' },
        { id: 'players', label: '👥 รายบุคคล' },
        { id: 'trends', label: '📈 แนวโน้ม' },
    ] as const;

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#f1f5f9', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <style>{`
                * { box-sizing: border-box; }
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .card { background: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 20px; padding: 24px; animation: fadeUp 0.4s ease both; }
                .chip-pos { background:#10b98120; color:#34d399; border:1px solid #10b98140; border-radius:8px; padding:2px 8px; font-size:11px; font-weight:800; }
                .chip-neg { background:#ef444420; color:#f87171; border:1px solid #ef444440; border-radius:8px; padding:2px 8px; font-size:11px; font-weight:800; }
                .chip-neu { background:#6366f120; color:#a5b4fc; border:1px solid #6366f140; border-radius:8px; padding:2px 8px; font-size:11px; font-weight:800; }
                .tab-btn { border:none; background:transparent; color:#64748b; font-weight:700; font-size:13px; padding:10px 20px; cursor:pointer; border-radius:12px; transition:all 0.2s; }
                .tab-btn.active { background:#6366f1; color:#fff; }
                .tab-btn:hover:not(.active) { background:#1e1e3a; color:#a5b4fc; }
                .scrolltable { overflow-x:auto; }
                table { width:100%; border-collapse:collapse; font-size:12px; }
                th { background:#16162a; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:10px 12px; text-align:left; }
                td { padding:9px 12px; border-bottom:1px solid #1e1e3a; font-weight:500; }
                tr:hover td { background:#1e1e3a; }
                .metric-bar-bg { background:#1e1e3a; border-radius:999px; height:8px; margin-top:4px; overflow:hidden; }
                .metric-bar-fill { height:100%; border-radius:999px; }
                @media(max-width:768px){.grid-2{grid-template-columns:1fr!important;}.grid-4{grid-template-columns:1fr 1fr!important;}}
            `}</style>

            {/* ── NAV ── */}
            <nav style={{ background: '#0a0a15', borderBottom: '1px solid #1e1e3a', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', borderRadius: 12, padding: '8px 12px', fontSize: 20 }}>🎮</div>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Research Dashboard</div>
                            <div style={{ color: '#6366f1', fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Shoot Till Dawn • Analytics v3</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {tabs.map(t => (
                            <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id as any)}>{t.label}</button>
                        ))}
                        <button onClick={load} style={{ background: '#1e1e3a', border: '1px solid #2d2d4e', color: '#a5b4fc', borderRadius: 12, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>⟳ Refresh</button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 80px' }}>

                {/* ══════════════════════════════════════════════════════ OVERVIEW */}
                {tab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* KPI row */}
                        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                            {[
                                { label: 'ผู้เล่นทั้งหมด', value: data.stats.totalPlayers, icon: '👤', color: C.indigo, sub: 'ลงทะเบียน' },
                                { label: 'Session', value: data.stats.totalSessions, icon: '🎮', color: C.purple, sub: 'ทั้งหมด' },
                                { label: 'แบบสำรวจครบ', value: data.stats.completedSurveys, icon: '📋', color: C.emerald, sub: 'Pre+Post' },
                                { label: 'คะแนนเฉลี่ย', value: data.stats.averageScore || 0, icon: '⭐', color: C.amber, sub: 'ทุก Session' },
                            ].map((k, i) => (
                                <div key={i} className="card" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>{k.label}</div>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: k.color, lineHeight: 1.1, margin: '6px 0 4px' }}>{k.value}</div>
                                    <div style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{k.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Research Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="grid-2">
                            <ResearchCard
                                title="ผลการวิจัย: ความเครียด"
                                icon="🧠" color={C.red}
                                avgDelta={d.avgDeltaStress}
                                improved={d.reducedStress} total={d.n}
                                label="ลดลง"
                                pre={+d.preAvg.stress || 0} post={+d.postAvg.stress || 0}
                                lowerBetter
                            />
                            <ResearchCard
                                title="ผลการวิจัย: ความสุข"
                                icon="😊" color={C.indigo}
                                avgDelta={d.avgDeltaHappy}
                                improved={d.improvedHappy} total={d.n}
                                label="เพิ่มขึ้น"
                                pre={+d.preAvg.happiness || 0} post={+d.postAvg.happiness || 0}
                            />
                            <ResearchCard
                                title="ผลการวิจัย: ความตื่นตัว"
                                icon="⚡" color={C.emerald}
                                avgDelta={d.avgDeltaEnergy}
                                improved={d.improvedEnergy} total={d.n}
                                label="เพิ่มขึ้น"
                                pre={+d.preAvg.energy || 0} post={+d.postAvg.energy || 0}
                            />
                        </div>

                        {/* Demographics row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }} className="grid-2">
                            <div className="card">
                                <ChartTitle title="กลุ่มอายุ" sub="Demographics" />
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={d.ageData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                            {d.ageData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % 5]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, color: '#f1f5f9' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="card">
                                <ChartTitle title="เพศ" sub="Demographics" />
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={d.genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                            {d.genderData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % 5]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, color: '#f1f5f9' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="card">
                                <ChartTitle title="ประสบการณ์เกม" sub="Avg score by skill" />
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart layout="vertical" data={d.expPerfData} margin={{ left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2d2d4e" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12 }} />
                                        <Bar dataKey="score" fill={C.indigo} radius={[0, 8, 8, 0]} barSize={22} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Radar post-game */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }} className="grid-2">
                            <div className="card">
                                <ChartTitle title="ประสบการณ์หลังเล่น" sub="Post-game experience radar" />
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={d.experienceData}>
                                        <PolarGrid stroke="#2d2d4e" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar name="ค่าเฉลี่ย" dataKey="value" stroke={C.indigo} fill={C.indigo} fillOpacity={0.35} strokeWidth={2} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12 }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="card">
                                <ChartTitle title="อารมณ์หลังเล่น 20 คนล่าสุด" sub="Stress / Happiness / Energy per session" />
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={d.recentEmotional} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4e" />
                                        <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} interval={0} height={90} />
                                        <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, color: '#f1f5f9' }} />
                                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingBottom: 8 }} />
                                        <Bar dataKey="stress" name="ความเครียด" fill={C.red} radius={[4, 4, 0, 0]} barSize={8} />
                                        <Bar dataKey="happiness" name="ความสุข" fill={C.indigo} radius={[4, 4, 0, 0]} barSize={8} />
                                        <Bar dataKey="energy" name="พลังงาน" fill={C.emerald} radius={[4, 4, 0, 0]} barSize={8} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent feedback */}
                        <div className="card">
                            <ChartTitle title="ความคิดเห็นล่าสุด" sub="Recent player feedback" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12, marginTop: 16 }}>
                                {(data.stats.recentFeedback || []).map((fb: any, i: number) => (
                                    <div key={i} style={{ background: '#16162a', border: '1px solid #2d2d4e', borderRadius: 14, padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: C.indigo, textTransform: 'uppercase', letterSpacing: 2 }}>{fb.player}</span>
                                            <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>{fb.date}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>"{fb.comment}"</p>
                                    </div>
                                ))}
                                {(!data.stats.recentFeedback || data.stats.recentFeedback.length === 0) && (
                                    <p style={{ color: '#475569', fontSize: 13 }}>ยังไม่มีความคิดเห็น</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════ COMPARISON */}
                {tab === 'comparison' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Big comparison chart */}
                        <div className="card">
                            <ChartTitle title="ระดับอารมณ์: ก่อน vs หลังเล่นเกม" sub="Average scores across all sessions (scale 1-10)" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, margin: '20px 0' }}>
                                {d.comparisonData.map((m, i) => {
                                    const improved = m.lower_is_better ? m.delta < 0 : m.delta > 0;
                                    return (
                                        <div key={i} style={{ background: '#16162a', border: '1px solid #2d2d4e', borderRadius: 16, padding: 20 }}>
                                            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>{m.metric}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>ก่อนเล่น</span>
                                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>หลังเล่น</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                                                <span style={{ fontSize: 28, fontWeight: 900, color: '#94a3b8' }}>{m.pre.toFixed(2)}</span>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: improved ? C.emerald : C.red }}>
                                                    {sign(m.delta)}{m.delta.toFixed(2)} ({sign(m.deltaPct)}{m.deltaPct.toFixed(1)}%)
                                                </span>
                                                <span style={{ fontSize: 28, fontWeight: 900, color: improved ? C.emerald : C.red }}>{m.post.toFixed(2)}</span>
                                            </div>
                                            {/* PRE bar */}
                                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 3 }}>ก่อน: {m.prePct}%</div>
                                            <div className="metric-bar-bg"><div className="metric-bar-fill" style={{ width: `${m.prePct}%`, background: '#475569' }} /></div>
                                            {/* POST bar */}
                                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, margin: '6px 0 3px' }}>หลัง: {m.postPct}%</div>
                                            <div className="metric-bar-bg"><div className="metric-bar-fill" style={{ width: `${m.postPct}%`, background: improved ? C.emerald : C.rose }} /></div>
                                            <div style={{ marginTop: 10, textAlign: 'center' }}>
                                                <span className={improved ? 'chip-pos' : 'chip-neg'}>{improved ? '✓ ดีขึ้น' : '✗ แย่ลง'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={d.comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4e" />
                                    <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 16, color: '#f1f5f9' }}
                                        formatter={(v: any, name?: any) => [`${Number(v).toFixed(2)} / 10  (${pct(Number(v))}%)`, name] as any}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                                    <Bar dataKey="pre" name="ก่อนเล่น" fill="#475569" radius={[8, 8, 0, 0]} barSize={48} />
                                    <Bar dataKey="post" name="หลังเล่น" fill={C.indigo} radius={[8, 8, 0, 0]} barSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Delta histogram */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-2">
                            <div className="card">
                                <ChartTitle title="การกระจาย Δ ความเครียด" sub="Distribution across matched sessions (negative = stress reduced)" />
                                {!d.hasHistogramData ? (
                                    <EmptyHistogram label="ต้องการข้อมูล Pre+Post ที่ match sessionId เดียวกัน" />
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={d.stressBins} margin={{ top: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4e" />
                                            <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, color: '#f1f5f9' }} />
                                            <ReferenceLine x="0" stroke="#64748b" strokeDasharray="4 4" />
                                            <Bar dataKey="count" name="จำนวน" radius={[6, 6, 0, 0]}
                                                fill={C.red}
                                                label={{ position: 'top', fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="card">
                                <ChartTitle title="การกระจาย Δ ความสุข" sub="Distribution across matched sessions (positive = happiness increased)" />
                                {!d.hasHistogramData ? (
                                    <EmptyHistogram label="ต้องการข้อมูล Pre+Post ที่ match sessionId เดียวกัน" />
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={d.happyBins} margin={{ top: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4e" />
                                            <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, color: '#f1f5f9' }} />
                                            <ReferenceLine x="0" stroke="#64748b" strokeDasharray="4 4" />
                                            <Bar dataKey="count" name="จำนวน" radius={[6, 6, 0, 0]}
                                                fill={C.indigo}
                                                label={{ position: 'top', fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Full metric table */}
                        <div className="card">
                            <ChartTitle title="ตารางเปรียบเทียบครบทุกตัวชี้วัด" sub="All pre-game vs post-game metrics with % change" />
                            <div style={{ overflowX: 'auto', marginTop: 16 }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ตัวชี้วัด</th>
                                            <th>ก่อนเล่น (avg)</th>
                                            <th>% (pre)</th>
                                            <th>หลังเล่น (avg)</th>
                                            <th>% (post)</th>
                                            <th>Δ</th>
                                            <th>Δ%</th>
                                            <th>ผล</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { name: 'ความเครียด', pre: +d.preAvg.stress || 0, post: +d.postAvg.stress || 0, lowerBetter: true },
                                            { name: 'ความสุข', pre: +d.preAvg.happiness || 0, post: +d.postAvg.happiness || 0, lowerBetter: false },
                                            { name: 'ความตื่นตัว', pre: +d.preAvg.energy || 0, post: +d.postAvg.energy || 0, lowerBetter: false },
                                            { name: 'ความสนุก (post)', pre: 0, post: +d.postAvg.fun || 0, lowerBetter: false },
                                            { name: 'ความพึงพอใจ (post)', pre: 0, post: +d.postAvg.satisfaction || 0, lowerBetter: false },
                                            { name: 'ความท้าทาย (post)', pre: 0, post: +d.postAvg.difficulty || 0, lowerBetter: false },
                                        ].map((row, i) => {
                                            const dv = delta(row.post, row.pre);
                                            const dp = row.pre > 0 ? deltaPct(row.post, row.pre) : null;
                                            const improved = row.lowerBetter ? dv < 0 : dv > 0;
                                            return (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 700 }}>{row.name}</td>
                                                    <td>{row.pre > 0 ? row.pre.toFixed(2) : '—'}</td>
                                                    <td>{row.pre > 0 ? pct(row.pre) + '%' : '—'}</td>
                                                    <td>{row.post.toFixed(2)}</td>
                                                    <td>{pct(row.post)}%</td>
                                                    <td style={{ color: row.pre > 0 ? (improved ? C.emerald : C.red) : '#64748b' }}>
                                                        {row.pre > 0 ? `${sign(dv)}${dv.toFixed(2)}` : '—'}
                                                    </td>
                                                    <td style={{ color: dp != null ? (improved ? C.emerald : C.red) : '#64748b' }}>
                                                        {dp != null ? `${sign(dp)}${dp.toFixed(1)}%` : '—'}
                                                    </td>
                                                    <td>
                                                        {row.pre > 0
                                                            ? <span className={improved ? 'chip-pos' : 'chip-neg'}>{improved ? '✓ ดีขึ้น' : '✗ แย่ลง'}</span>
                                                            : <span className="chip-neu">Post only</span>
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════ PLAYERS */}
                {tab === 'players' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="card">
                            <ChartTitle
                                title="ข้อมูลรายบุคคล: ก่อน/หลังเล่น"
                                sub={`${d.playerRows.length} sessions ที่มีทั้ง Pre และ Post survey`}
                            />
                            {d.playerRows.length === 0 ? (
                                <p style={{ color: '#64748b', marginTop: 16 }}>ยังไม่มีข้อมูลที่มีทั้ง Pre และ Post survey</p>
                            ) : (
                                <div className="scrolltable" style={{ marginTop: 16 }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Player ID</th>
                                                <th>Session</th>
                                                <th>เครียด Pre</th><th>เครียด Post</th><th>Δ เครียด</th>
                                                <th>สุข Pre</th><th>สุข Post</th><th>Δ สุข</th>
                                                <th>พลัง Pre</th><th>พลัง Post</th><th>Δ พลัง</th>
                                                <th>สนุก</th><th>พอใจ</th><th>ยาก</th>
                                                <th>Outcome</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {d.playerRows.map((r, i) => {
                                                const stressOk = r.d_stress <= 0;
                                                const happyOk = r.d_happy >= 0;
                                                const energyOk = r.d_energy >= 0;
                                                const overall = [stressOk, happyOk, energyOk].filter(Boolean).length;
                                                return (
                                                    <tr key={i}>
                                                        <td style={{ color: '#475569' }}>{i + 1}</td>
                                                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#a5b4fc' }}>{r.pid.slice(0, 8)}</td>
                                                        <td style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569' }}>{r.id.slice(0, 10)}</td>
                                                        <td>{r.pre_stress}</td>
                                                        <td>{r.post_stress}</td>
                                                        <td style={{ color: r.d_stress <= 0 ? C.emerald : C.red, fontWeight: 800 }}>{sign(r.d_stress)}{r.d_stress}</td>
                                                        <td>{r.pre_happy}</td>
                                                        <td>{r.post_happy}</td>
                                                        <td style={{ color: r.d_happy >= 0 ? C.emerald : C.red, fontWeight: 800 }}>{sign(r.d_happy)}{r.d_happy}</td>
                                                        <td>{r.pre_energy}</td>
                                                        <td>{r.post_energy}</td>
                                                        <td style={{ color: r.d_energy >= 0 ? C.emerald : C.red, fontWeight: 800 }}>{sign(r.d_energy)}{r.d_energy}</td>
                                                        <td>{r.fun}</td>
                                                        <td>{r.satisfaction}</td>
                                                        <td>{r.difficulty}</td>
                                                        <td>
                                                            <span className={overall >= 2 ? 'chip-pos' : overall === 1 ? 'chip-neu' : 'chip-neg'}>
                                                                {overall}/3 ✓
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Per-player delta chart */}
                        {d.playerRows.length > 0 && (
                            <div className="card">
                                <ChartTitle title="การเปลี่ยนแปลงรายบุคคล (Delta)" sub="Δ stress / Δ happiness / Δ energy per session" />
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart
                                        data={d.playerRows.map((r, i) => ({
                                            name: `#${i + 1}`,
                                            dStress: r.d_stress,
                                            dHappy: r.d_happy,
                                            dEnergy: r.d_energy,
                                        }))}
                                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4e" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[-10, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, color: '#f1f5f9' }} />
                                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                                        <Bar dataKey="dStress" name="Δ ความเครียด" fill={C.red} radius={[4, 4, 0, 0]} barSize={10} />
                                        <Bar dataKey="dHappy" name="Δ ความสุข" fill={C.indigo} radius={[4, 4, 0, 0]} barSize={10} />
                                        <Bar dataKey="dEnergy" name="Δ พลังงาน" fill={C.emerald} radius={[4, 4, 0, 0]} barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════ TRENDS */}
                {tab === 'trends' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="card">
                            <ChartTitle title="แนวโน้มรายวัน" sub="Daily sessions, avg score & avg happiness" />
                            <ResponsiveContainer width="100%" height={340}>
                                <AreaChart data={d.timelineData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                                    <defs>
                                        <linearGradient id="gHappy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C.indigo} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C.emerald} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4e" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="l" domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="r" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 14, color: '#f1f5f9' }} />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                                    <Area yAxisId="l" type="monotone" dataKey="happy" name="ความสุขเฉลี่ย (1-10)" stroke={C.indigo} strokeWidth={3} fill="url(#gHappy)" />
                                    <Area yAxisId="r" type="monotone" dataKey="score" name="คะแนนเฉลี่ย" stroke={C.emerald} strokeWidth={3} fill="url(#gScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="card">
                            <ChartTitle title="จำนวน Session รายวัน" sub="Daily session activity" />
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={d.timelineData} margin={{ top: 8, right: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4e" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, color: '#f1f5f9' }} />
                                    <Bar dataKey="sessions" name="Sessions" fill={C.purple} radius={[8, 8, 0, 0]}
                                        label={{ position: 'top', fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Summary stats box */}
                        <div className="card">
                            <ChartTitle title="สรุปผลการวิจัย" sub="Research summary for academic reporting" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginTop: 16 }}>
                                {[
                                    { label: 'จำนวนผู้เล่น (N)', value: data.stats.totalPlayers },
                                    { label: 'Sessions ทั้งหมด', value: data.stats.totalSessions },
                                    { label: 'Matched pairs (pre+post)', value: d.n },
                                    { label: 'Δ avg ความเครียด', value: `${sign(d.avgDeltaStress)}${d.avgDeltaStress.toFixed(2)}`, color: d.avgDeltaStress <= 0 ? C.emerald : C.red },
                                    { label: 'Δ avg ความสุข', value: `${sign(d.avgDeltaHappy)}${d.avgDeltaHappy.toFixed(2)}`, color: d.avgDeltaHappy >= 0 ? C.emerald : C.red },
                                    { label: 'Δ avg พลังงาน', value: `${sign(d.avgDeltaEnergy)}${d.avgDeltaEnergy.toFixed(2)}`, color: d.avgDeltaEnergy >= 0 ? C.emerald : C.red },
                                    { label: '% ลดความเครียด', value: d.n > 0 ? `${((d.reducedStress / d.n) * 100).toFixed(1)}%` : '—', color: C.emerald },
                                    { label: '% เพิ่มความสุข', value: d.n > 0 ? `${((d.improvedHappy / d.n) * 100).toFixed(1)}%` : '—', color: C.emerald },
                                    { label: '% เพิ่มพลังงาน', value: d.n > 0 ? `${((d.improvedEnergy / d.n) * 100).toFixed(1)}%` : '—', color: C.emerald },
                                    { label: 'คะแนนเฉลี่ยรวม', value: data.stats.averageScore || 0 },
                                    { label: 'Pre avg ความสุข', value: (+d.preAvg.happiness || 0).toFixed(2) },
                                    { label: 'Post avg ความสุข', value: (+d.postAvg.happiness || 0).toFixed(2) },
                                ].map((s, i) => (
                                    <div key={i} style={{ background: '#16162a', border: '1px solid #2d2d4e', borderRadius: 14, padding: '14px 16px' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: (s as any).color || '#f1f5f9' }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center', color: '#1e293b', fontSize: 11, marginTop: 40 }}>
                    Last refreshed: {lastRefresh.toLocaleTimeString('th-TH')} • Shoot Till Dawn Research Dashboard v3
                </div>
            </main>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function ChartTitle({ title, sub }: { title: string; sub: string }) {
    return (
        <div style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, letterSpacing: -0.5 }}>{title}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>{sub}</p>
        </div>
    );
}

function ResearchCard({
    title, icon, color, avgDelta, improved, total, label, pre, post, lowerBetter
}: {
    title: string; icon: string; color: string;
    avgDelta: number; improved: number; total: number; label: string;
    pre: number; post: number; lowerBetter?: boolean;
}) {
    const isGood = lowerBetter ? avgDelta <= 0 : avgDelta >= 0;
    const hasMatchedRows = improved !== -1;  // -1 = fallback mode, no matched pairs
    const rate = hasMatchedRows && total > 0 ? ((improved / total) * 100).toFixed(1) : null;
    const dp = pre > 0 ? deltaPct(post, pre) : 0;

    return (
        <div className="card" style={{ border: `1px solid ${color}30`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, fontSize: 80, lineHeight: 1 }}>{icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <span style={{ fontWeight: 800, fontSize: 13 }}>{title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>ค่าเฉลี่ย Δ</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: isGood ? C.emerald : C.red }}>
                        {sign(avgDelta)}{avgDelta.toFixed(2)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>% เปลี่ยนแปลง</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: isGood ? C.emerald : C.red }}>
                        {pre > 0 ? `${sign(dp)}${dp.toFixed(1)}%` : '—'}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>ก่อนเล่น</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#94a3b8' }}>{pre.toFixed(2)} <span style={{ fontSize: 11, color: '#475569' }}>({pct(pre)}%)</span></div>
                </div>
                <div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>หลังเล่น</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: isGood ? C.emerald : C.rose }}>{post.toFixed(2)} <span style={{ fontSize: 11, color: '#475569' }}>({pct(post)}%)</span></div>
                </div>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: isGood ? `${C.emerald}15` : `${C.red}15`, borderRadius: 12, border: `1px solid ${isGood ? C.emerald : C.red}30` }}>
                {hasMatchedRows && rate !== null ? (
                    <span style={{ fontWeight: 800, color: isGood ? C.emerald : C.red, fontSize: 13 }}>
                        {improved}/{total} คน ({rate}%) {label}
                    </span>
                ) : (
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                        ⚠ ใช้ค่าเฉลี่ยรวม (ยังไม่มีคู่ Pre+Post ที่ตรงกัน)
                    </span>
                )}
            </div>
        </div>
    );
}

function EmptyHistogram({ label }: { label: string }) {
    return (
        <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#475569' }}>
            <div style={{ fontSize: 32, opacity: 0.4 }}>📊</div>
            <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', maxWidth: 220 }}>ยังไม่มีข้อมูล matched pairs</div>
            <div style={{ fontSize: 11, color: '#334155', fontWeight: 600, textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>{label}</div>
        </div>
    );
}
