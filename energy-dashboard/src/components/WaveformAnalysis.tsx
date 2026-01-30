import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowLeft, Activity, Cpu, CheckCircle2, Search, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WaveformAnalysisProps {
    className?: string;
    targetAppliance?: string | null;
}

// Mock Signatures
const SIGNATURES = [
    { id: 'laptop', name: 'MacBook Pro Charger', power: 65, color: '#06b6d4', noise: 0.1 },
    { id: 'fan', name: 'Dyson Cooling Fan', power: 45, color: '#10b981', noise: 0.3 },
    { id: 'monitor', name: 'LG Ultrawide 34"', power: 80, color: '#8b5cf6', noise: 0.15 },
    { id: 'bulb', name: 'Phillips Hue Bulb', power: 9, color: '#eab308', noise: 0.05 },
];

export default function WaveformAnalysis({ className, targetAppliance }: WaveformAnalysisProps) {
    const navigate = useNavigate();
    const [isSimulating, setIsSimulating] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [detectedId, setDetectedId] = useState<string | null>(null);
    const [liveWaveform, setLiveWaveform] = useState<any[]>([]);

    // Generate waveform data
    const generateWaveform = (applianceId: string | null, offset: number) => {
        const signature = SIGNATURES.find(s => s.id === applianceId);
        const points = [];

        for (let i = 0; i < 100; i++) { // Increased resolution
            const t = (i + offset) * 0.1; // Time factor

            // Base Clean Signal (50Hz)
            let cleanVal = Math.sin(t) * 50;

            // Apply Appliance specific Signature to Clean Reference
            if (signature) {
                if (signature.id === 'laptop') {
                    // SMPS: High peak, flat chaotic valleys
                    cleanVal = (Math.sin(t) > 0 ? Math.pow(Math.sin(t), 3) : -Math.pow(Math.abs(Math.sin(t)), 3)) * 60;
                } else if (signature.id === 'fan') {
                    // Inductive: Phase shift + harmonic
                    cleanVal = Math.sin(t - 0.5) * 45 + Math.sin(t * 3) * 5;
                } else if (signature.id === 'monitor') {
                    // Square-ish
                    cleanVal = Math.sign(Math.sin(t)) * 40 * (1 - Math.exp(-Math.abs(Math.sin(t)) * 5));
                } else if (signature.id === 'bulb') {
                    // Pure resistive
                    cleanVal = Math.sin(t) * 15; // Low amplitude
                }
            }

            // Live Signal = Clean + Noise + Jitter
            // If no appliance detected yet, just show random noise on baseline
            let liveVal = signature ? cleanVal : (Math.sin(t) * 10);

            // Add chaos/noise to live signal
            const noise = (Math.random() - 0.5) * (signature ? 5 : 20);
            liveVal += noise;

            points.push({
                i,
                live: liveVal,
                reference: signature ? cleanVal : null // Only show ref if matched/simulating target
            });
        }
        return points;
    };

    // React to external targetAppliance
    useEffect(() => {
        if (targetAppliance) {
            setIsSimulating(true);
            setDetectedId(null);
            setScanProgress(0);
        } else {
            setIsSimulating(false);
            setDetectedId(null);
        }
    }, [targetAppliance]);

    // Simulation/Scanner Logic
    useEffect(() => {
        if (!isSimulating) {
            // Idle state: just noise or flat
            setLiveWaveform(generateWaveform(null, Date.now() / 50));
            return;
        }

        let offset = 0;
        const interval = setInterval(() => {
            offset += 2; // Faster movement

            // Increase progress
            setScanProgress(prev => prev + 1);

            // If we have a target from dashboard, lock onto it faster
            if (targetAppliance) {
                if (scanProgress > 10) { // Fast lock
                    setDetectedId(targetAppliance);
                }
            } else {
                // Free roam simulation logic
                const elapsed = scanProgress + 1;
                if (elapsed > 40 && elapsed < 80) setDetectedId('laptop');
                else if (elapsed > 100 && elapsed < 140) setDetectedId('fan');
                else if (elapsed > 160 && elapsed < 200) setDetectedId('monitor');
                else if (elapsed % 80 === 0) setDetectedId(null);
            }

            setLiveWaveform(generateWaveform(detectedId || (targetAppliance && scanProgress > 10 ? targetAppliance : null), offset));

        }, 30); // 30ms refresh for smoother 30fps-ish anim

        return () => clearInterval(interval);
    }, [isSimulating, detectedId, targetAppliance, scanProgress]);


    return (
        <div className={cn("min-h-screen bg-[#030303] text-white font-sans p-6 overflow-hidden", className)}>
            {/* Header - Hide if embedded (controlled) */}
            {!targetAppliance && (
                <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
                    <Button variant="ghost" className="text-white/60 hover:text-white gap-2" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        NIAGARA_v2 <span className="text-cyan-500">//</span> WAVEFORM IDENTITY
                    </h1>
                    <div className="w-24"></div> {/* Spacer */}
                </div>
            )}

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Panel: Real-time Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white/[0.03] border-white/10 p-8 h-[500px] relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-6 left-8 flex items-center gap-3">
                            <Activity className={cn("w-5 h-5", isSimulating ? "text-cyan-400 animate-pulse" : "text-white/20")} />
                            <span className="text-sm font-mono tracking-widest text-white/60">LIVE ADC INPUT STREAM</span>
                        </div>

                        <div className="absolute top-6 right-8 flex items-center gap-4">
                            {detectedId && (
                                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 animate-pulse">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                                    SYNC_LOCKED
                                </div>
                            )}
                        </div>

                        {/* Scanner Line */}
                        {isSimulating && !detectedId && (
                            <motion.div
                                className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent z-10"
                                animate={{ left: ['0%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        )}

                        {/* Graph */}
                        <div className="mt-12 h-full">
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={liveWaveform}>
                                    <YAxis domain={[-80, 80]} hide />

                                    {/* Reference Signature (Ghost) */}
                                    <Line
                                        type="monotone"
                                        dataKey="reference"
                                        stroke={detectedId ? SIGNATURES.find(s => s.id === detectedId)?.color : "transparent"}
                                        strokeWidth={2}
                                        strokeOpacity={0.4}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        isAnimationActive={false}
                                    />

                                    {/* Real-time Input (Live) */}
                                    <Line
                                        type="monotone"
                                        dataKey="live" // Now using 'live' key
                                        stroke={detectedId ? "#ffffff" : "#4b5563"}
                                        strokeWidth={3}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Simulation Control Overlay */}
                        {!isSimulating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                <Button
                                    size="lg"
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest px-8 shadow-[0_0_30px_rgba(8,145,178,0.4)]"
                                    onClick={() => setIsSimulating(true)}
                                >
                                    <Zap className="mr-2 w-4 h-4 fill-white" />
                                    START IDENTIFICATION SIMULATION
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Detection Result Banner */}
                    <AnimatePresence>
                        {detectedId && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-6 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-full">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-emerald-400 text-sm font-bold tracking-wider uppercase">Positive Match Found</h3>
                                        <p className="text-2xl font-bold text-white">
                                            {SIGNATURES.find(s => s.id === detectedId)?.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/40 text-xs uppercase tracking-widest">Confidence</p>
                                    <p className="text-xl font-mono text-emerald-400">98.4%</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Panel: Registered Signatures */}
                <div className="space-y-4">
                    <h2 className="text-sm font-mono tracking-widest text-white/40 uppercase mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Registered Signatures
                    </h2>

                    {SIGNATURES.map((sig) => (
                        <motion.div
                            key={sig.id}
                            animate={{
                                scale: detectedId === sig.id ? 1.05 : 1,
                                borderColor: detectedId === sig.id ? sig.color : 'rgba(255,255,255,0.1)',
                                backgroundColor: detectedId === sig.id ? `${sig.color}10` : 'rgba(255,255,255,0.03)'
                            }}
                            className={cn(
                                "border rounded-xl p-4 transition-all duration-300 relative overflow-hidden",
                                detectedId === sig.id ? "shadow-[0_0_20px_rgba(0,0,0,0.5)]" : "hover:border-white/20"
                            )}
                        >
                            {/* Active Glow */}
                            {detectedId === sig.id && (
                                <motion.div
                                    className="absolute inset-0 opacity-20"
                                    style={{ backgroundColor: sig.color }}
                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className="font-medium text-white">{sig.name}</span>
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: sig.color, boxShadow: `0 0 10px ${sig.color}` }}
                                />
                            </div>
                            <div className="flex justify-between items-end relative z-10">
                                <span className="text-xs text-white/40 font-mono">{sig.id.toUpperCase()}_SIG_0X{Math.floor(Math.random() * 999)}</span>
                                <span className="text-sm font-bold text-white/80">{sig.power}W Typ.</span>
                            </div>
                        </motion.div>
                    ))}

                    <div className="mt-8 p-6 rounded-xl border border-dashed border-white/10 text-center">
                        <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-xs text-white/40">Waiting for new unknown signatures...</p>
                    </div>
                </div>

            </main>
        </div>
    );
}
