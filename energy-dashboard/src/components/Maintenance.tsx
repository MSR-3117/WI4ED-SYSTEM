import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Brain, Activity, RefreshCw, AlertTriangle, CheckCircle2, Cpu, ArrowLeft, Laptop, Fan, Monitor, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cnnManager } from '@/lib/cnn-model';
import type { ModelMetrics } from '@/lib/cnn-model';

// Appliance Definitions
const APPLIANCES = [
    { id: 'laptop', name: 'MacBook Pro Charger', icon: Laptop, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'fan', name: 'Dyson Cooling Fan', icon: Fan, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'monitor', name: 'LG Ultrawide 34"', icon: Monitor, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'bulb', name: 'Phillips Hue Bulb', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
];

interface ApplianceState {
    age: number; // 0-100
    healthScore: number; // 0.0-1.0
}

export default function Maintenance() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [isModelReady, setIsModelReady] = useState(false);

    // Selection State
    const [selectedId, setSelectedId] = useState<string>('laptop');

    // Multi-Appliance State Map
    const [applianceStates, setApplianceStates] = useState<Record<string, ApplianceState>>({
        laptop: { age: 0, healthScore: 1.0 },
        fan: { age: 0, healthScore: 1.0 },
        monitor: { age: 0, healthScore: 1.0 },
        bulb: { age: 0, healthScore: 1.0 },
    });

    const [liveData, setLiveData] = useState<any[]>([]);

    // Helper to update specific appliance state
    const updateAppState = (id: string, updates: Partial<ApplianceState>) => {
        setApplianceStates(prev => ({
            ...prev,
            [id]: { ...prev[id], ...updates }
        }));
    };

    const currentAppliance = APPLIANCES.find(a => a.id === selectedId) || APPLIANCES[0];
    const currentState = applianceStates[selectedId];

    // Training Handler
    const startTraining = async () => {
        setIsTraining(true);
        setIsModelReady(false);
        await cnnManager.train((m) => setMetrics(m));
        setIsTraining(false);
        setIsModelReady(true);
    };

    // Auto-train on mount
    useEffect(() => {
        startTraining();
    }, []);

    // Real-time Simulation & Inference Loop
    useEffect(() => {
        if (!isModelReady) return;

        const interval = setInterval(() => {
            const currentAge = currentState.age / 100; // Normalized 0-1

            // 1. Generate Waveform based on Selected Appliance Type
            const points = [];
            const rawWaveform = [];
            const now = Date.now();
            const phase = now / 1000 * 10; // Moving phase

            // Degradation Parameters
            const noiseLevel = 2 + (currentAge * 30);
            const distortion = currentAge * 3;
            const drift = (Math.random() - 0.5) * currentAge * 60;

            for (let i = 0; i < 100; i++) {
                const t = i * 0.1;
                let val = 0;

                // Base Signature Logic (Matches cnn-model.ts gen logic)
                if (selectedId === 'laptop') {
                    const sine = Math.sin(t + phase);
                    val = (sine > 0 ? Math.pow(sine, 3) : -Math.pow(Math.abs(sine), 3)) * 60;
                } else if (selectedId === 'fan') {
                    val = Math.sin(t + phase - 0.5) * 45 + Math.sin((t + phase) * 3) * 5;
                } else if (selectedId === 'monitor') {
                    const sine = Math.sin(t + phase);
                    val = Math.sign(sine) * 40 * (1 - Math.exp(-Math.abs(sine) * 5));
                } else { // bulb
                    val = Math.sin(t + phase) * 15;
                }

                // Apply Age Effects
                val += Math.sin(t * 3) * distortion * 8; // Harmonic distortion
                val += (Math.random() - 0.5) * noiseLevel; // Noise
                val += drift; // DC Offset drift

                points.push({ i, val });
                rawWaveform.push(val);
            }

            setLiveData(points);

            // 2. Run Inference
            const score = cnnManager.predict(rawWaveform);

            // Update ONLY the health score, keep age as is
            updateAppState(selectedId, { healthScore: score });

        }, 100); // 10 FPS

        return () => clearInterval(interval);
    }, [isModelReady, selectedId, currentState.age]); // Re-bind on selection/age change

    const getHealthStatus = (score: number) => {
        if (score > 0.8) return { label: 'OPTIMAL', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
        if (score > 0.4) return { label: 'DEGRADED', color: 'text-amber-400', bg: 'bg-amber-500/20' };
        return { label: 'CRITICAL FAILURE', color: 'text-red-500', bg: 'bg-red-500/20' };
    };

    const status = getHealthStatus(currentState.healthScore);

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between mb-8 shrink-0">
                <Button variant="ghost" className="text-white/60 hover:text-white gap-2" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    NEURAL_SENTINEL <span className="text-purple-500">//</span> PREDICTIVE MAINTENANCE
                </h1>
                <div className={cn("flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full border",
                    isTraining ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-white/10 text-white/40"
                )}>
                    {isTraining ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    {isTraining ? "TRAINING MODEL..." : isModelReady ? "MODEL ACTIVE" : "MODEL IDLE"}
                </div>
            </div>

            <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left Column: Appliance List (3 cols) */}
                <div className="lg:col-span-3 space-y-4 overflow-y-auto">
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest px-1">Monitored Assets</h3>
                    {APPLIANCES.map((app) => (
                        <Card
                            key={app.id}
                            onClick={() => setSelectedId(app.id)}
                            className={cn(
                                "p-4 cursor-pointer transition-all hover:bg-white/5 border-white/10 flex items-center gap-4",
                                selectedId === app.id ? "bg-white/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "bg-white/[0.02]"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg", app.bg, app.color)}>
                                <app.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-sm">{app.name}</div>
                                <div className="text-xs text-white/40 font-mono mt-1 flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full",
                                        applianceStates[app.id].healthScore > 0.8 ? "bg-emerald-500" :
                                            applianceStates[app.id].healthScore > 0.4 ? "bg-amber-500" : "bg-red-500"
                                    )} />
                                    {(applianceStates[app.id].healthScore * 100).toFixed(0)}% Health
                                </div>
                            </div>
                        </Card>
                    ))}

                    <Card className="bg-white/[0.03] border-white/10 p-6 backdrop-blur-sm mt-8">
                        <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-purple-500" /> Model Performance
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-white/40">Loss</span>
                                <span className="font-mono text-white">{metrics?.loss.toFixed(4) || "---"}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/40">Accuracy</span>
                                <span className="font-mono text-emerald-400">{(metrics?.accuracy || 0 * 100).toFixed(1)}%</span>
                            </div>
                            {isTraining && (
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                                    <motion.div
                                        className="h-full bg-purple-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(metrics?.epoch || 0) / 30 * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Detailed Analysis (9 cols) */}
                <div className="lg:col-span-9 space-y-6 flex flex-col">

                    {/* Top Row: Health & Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Health Display */}
                        <Card className="bg-white/[0.03] border-white/10 p-8 relative overflow-hidden h-[300px] flex items-center justify-center">
                            <div className="text-center z-10">
                                <div className="flex justify-center mb-4">
                                    <div className={cn("p-4 rounded-full bg-white/5 border border-white/10", currentAppliance.color)}>
                                        <currentAppliance.icon className="w-10 h-10" />
                                    </div>
                                </div>
                                <motion.div
                                    className={cn("text-6xl md:text-7xl font-black tracking-tighter tabular-nums mb-2", status.color)}
                                >
                                    {(currentState.healthScore * 100).toFixed(0)}%
                                </motion.div>
                                <p className="text-white/40 text-sm uppercase tracking-[0.3em] font-medium">Health Index</p>

                                <motion.div
                                    className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full mt-6 border", status.bg, status.color, "border-current/20")}
                                >
                                    {currentState.healthScore > 0.4 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    <span className="font-bold text-xs tracking-wider">{status.label}</span>
                                </motion.div>
                            </div>
                        </Card>

                        {/* Controls */}
                        <Card className="bg-white/[0.03] border-white/10 p-8 flex flex-col justify-center">
                            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-cyan-500" /> Wear Simulation
                            </h3>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between mb-4">
                                        <span className="text-sm font-medium text-white">Component Age (Years)</span>
                                        <span className="text-sm font-mono text-cyan-400">{(currentState.age / 10).toFixed(1)}y</span>
                                    </div>
                                    <Slider
                                        value={[currentState.age]}
                                        onValueChange={(val) => updateAppState(selectedId, { age: val[0] })}
                                        max={100}
                                        step={1}
                                        className="py-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="block text-white/40 text-xs uppercase tracking-wider mb-1">Noise Fl.</span>
                                        <span className="block font-mono text-lg text-white">{(2 + currentState.age * 0.3).toFixed(1)} dB</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="block text-white/40 text-xs uppercase tracking-wider mb-1">THD %</span>
                                        <span className="block font-mono text-lg text-white">{(currentState.age * 0.12).toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Bottom Row: Waveform */}
                    <Card className="bg-white/[0.03] border-white/10 p-6 flex-1 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-cyan-500" /> Real-Time Sensor Input
                            </h3>
                            <div className="text-xs font-mono text-white/40">
                                1D-CNN INTERPRETATION LAYER // {selectedId.toUpperCase()}
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveData}>
                                    <YAxis domain={[-100, 100]} hide />
                                    <Line
                                        type="monotone"
                                        dataKey="val"
                                        stroke={currentState.healthScore > 0.8 ? "#10b981" : currentState.healthScore > 0.4 ? "#f59e0b" : "#ef4444"}
                                        strokeWidth={3}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>


                </div>
            </main>

            {/* Explanation Section */}
            <section className="max-w-7xl mx-auto w-full mt-12 mb-12 border-t border-white/10 pt-8">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    System Logic & Analysis Parameters
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. The AI Model */}
                    <Card className="bg-white/[0.02] border-white/10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Brain className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="font-semibold text-sm">1D CNN Engine</h3>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed">
                            Unlike simple threshold detectors, our <span className="text-white">Convolutional Neural Network (CNN)</span> specifically analyzes the <strong>shape</strong> of the standard electrical waveform.
                            It is trained on thousands of samples to recognize subtle deformities—like flattened peaks or micro-spikes—that indicate specific component failures before they become critical.
                        </p>
                    </Card>

                    {/* 2. Noise Floor */}
                    <Card className="bg-white/[0.02] border-white/10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="font-semibold text-sm">Signal Noise (SNR)</h3>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed">
                            <strong className="text-white">Physical Meaning:</strong> High frequency static in the signal.
                            <br /><br />
                            This usually indicates mechanical degradation such as <span className="text-white">worn bearings</span> (grinding creates electrical noise) or <span className="text-white">arcing contacts</span> inside the appliance.
                        </p>
                    </Card>

                    {/* 3. THD */}
                    <Card className="bg-white/[0.02] border-white/10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-amber-400" />
                            </div>
                            <h3 className="font-semibold text-sm">Harmonic Distortion (THD)</h3>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed">
                            <strong className="text-white">Physical Meaning:</strong> Deviation from a perfect sine wave.
                            <br /><br />
                            A high THD percentage typically points to <span className="text-white">failed capacitors</span> in power supplies or non-linear loads, causing the waveform to look "squashed" or "pointed".
                        </p>
                    </Card>
                </div>
            </section>
        </div>
    );
}
