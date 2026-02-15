'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, Activity, Brain, Smile, CheckCircle2 } from 'lucide-react';
import { GAS_WEBAPP_URL } from '@/lib/api-config';

function SurveyForm() {
    const searchParams = useSearchParams();
    const [playerId, setPlayerId] = useState(searchParams.get('playerId') || '');
    const [playerName, setPlayerName] = useState(searchParams.get('name') || '');
    const [score, setScore] = useState(searchParams.get('score') || '');
    const [level, setLevel] = useState(searchParams.get('level') || '');
    const [type, setType] = useState<'pre' | 'post'>((searchParams.get('type') as 'pre' | 'post') || 'pre');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<any>({
        stressLevel: 5,
        happinessLevel: 5,
        energyLevel: 5,
        funLevel: 5,
        satisfactionLevel: 5,
        difficultyRating: 5,
        age: '',
        gender: '',
        comments: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const action = type === 'pre' ? 'submitPreSurvey' : 'submitPostSurvey';

            await fetch(`${GAS_WEBAPP_URL}?action=${action}`, {
                method: 'POST',
                body: JSON.stringify({
                    playerId,
                    playerName,
                    score: parseInt(score),
                    level,
                    ...formData
                })
            });

            setSubmitted(true);
        } catch (error) {
            console.error('Survey submission failed', error);
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in zoom-in duration-500">
                <CheckCircle2 className="w-20 h-20 text-green-500" />
                <h2 className="text-3xl font-bold text-slate-800">ขอบคุณสำหรับข้อมูล!</h2>
                <p className="text-slate-500 text-center max-w-md">ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว คุณสามารถปิดหน้าต่างนี้และกลับเข้าสู่เกมได้ทันที</p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2 rounded-full border border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-all"
                >
                    ส่งใหม่อีกครั้ง
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto shadow-2xl border border-white/20 bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="p-8 text-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">
                <h1 className="text-4xl font-black mb-2 tracking-tight">
                    {type === 'pre' ? 'พร้อมเล่นหรือยัง?' : 'เป็นอย่างไรบ้าง?'}
                </h1>
                <p className="text-indigo-100 font-medium opacity-90">
                    สวัสดีคุณ <strong>{playerName || 'ผู้เล่น'}</strong> ช่วยบอกเราหน่อยว่าคุณรู้สึกอย่างไร!
                </p>
                {(score || level) && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                        {score && (
                            <div className="bg-white/20 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                                คะแนน: {score}
                            </div>
                        )}
                        {level && (
                            <div className="bg-white/20 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                                ระดับ: {level}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {type === 'pre' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">ชื่อผู้เล่น</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="ใส่ชื่อของคุณ"
                                    required={!playerName}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">อายุ</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                    value={formData.age || ''}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    placeholder="ปี"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">เพศ</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-white"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    required
                                >
                                    <option value="">เลือกเพศ</option>
                                    <option value="ชาย">ชาย</option>
                                    <option value="หญิง">หญิง</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                    <option value="ไม่ระบุ">ไม่ระบุ</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">รหัสผู้เล่น</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                    value={playerId}
                                    onChange={(e) => setPlayerId(e.target.value)}
                                    placeholder="รหัสระบบอัตโนมัติ"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-10">
                        <SurveySlider
                            label="ระดับความเครียด"
                            icon={<Brain className="w-5 h-5" />}
                            value={formData.stressLevel}
                            desc="สภาวะจิตใจปัจจุบัน"
                            onChange={(v) => setFormData({ ...formData, stressLevel: v })}
                        />

                        <SurveySlider
                            label="ความสุข"
                            icon={<Smile className="w-5 h-5" />}
                            value={formData.happinessLevel}
                            desc="อารมณ์โดยรวม"
                            onChange={(v) => setFormData({ ...formData, happinessLevel: v })}
                        />

                        <SurveySlider
                            label="พลังงาน"
                            icon={<Activity className="w-5 h-5" />}
                            value={formData.energyLevel}
                            desc="ความกระฉับกระเฉง"
                            onChange={(v) => setFormData({ ...formData, energyLevel: v })}
                        />

                        {type === 'post' && (
                            <>
                                <SurveySlider
                                    label="ความสนุก"
                                    icon={<Heart className="w-5 h-5" />}
                                    value={formData.funLevel}
                                    desc="ความเพลิดเพลินในเกม"
                                    onChange={(v) => setFormData({ ...formData, funLevel: v })}
                                />
                                <SurveySlider
                                    label="ความยาก"
                                    icon={<Activity className="w-5 h-5" />}
                                    value={formData.difficultyRating}
                                    desc="ระดับความท้าทาย"
                                    onChange={(v) => setFormData({ ...formData, difficultyRating: v })}
                                />
                            </>
                        )}
                    </div>

                    <div className="space-y-2 pt-4">
                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">ความคิดเห็นเพิ่มเติม</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all min-h-[120px] resize-none"
                            placeholder="มีอะไรอยากบอกเราเพิ่มเติมไหม?"
                            value={formData.comments}
                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-5 rounded-2xl text-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                กำลังประมวลผล...
                            </span>
                        ) : (
                            'ส่งข้อมูล'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

function SurveySlider({ label, icon, value, onChange, desc }: { label: string, icon: React.ReactNode, value: number, onChange: (v: number) => void, desc: string }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 leading-tight">{label}</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{desc}</p>
                    </div>
                </div>
                <div className="text-3xl font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl">
                    {value}
                </div>
            </div>
            <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 transition-all hover:h-4 focus:ring-4 focus:ring-indigo-100"
            />
            <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1 uppercase tracking-tighter">
                <span>น้อย</span>
                <span>ปานกลาง</span>
                <span>มากที่สุด</span>
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-indigo-100">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-[100px]" />
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            }>
                <SurveyForm />
            </Suspense>
        </div>
    );
}
