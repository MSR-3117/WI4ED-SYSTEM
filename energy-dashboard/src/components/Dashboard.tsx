import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Battery, Server, Wifi, WifiOff, Lightbulb, Fan, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WaveformAnalysis from './WaveformAnalysis';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

interface EnergyData {
    voltage: number;
    current: number;
    power: number;
    energy: number;
    status: 'online' | 'offline';
    alert: 'normal' | 'warning' | 'critical';
    timestamp: number;
}

export default function Dashboard() {
    const [data, setData] = useState<EnergyData | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isOffline, setIsOffline] = useState(false);

    /* Mock Data Simulation (DISABLED)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const isOnline = Math.random() > 0.05; // 95% chance online
            const voltage = 220 + Math.random() * 10;
            const current = 2 + Math.random() * 5;
            const power = voltage * current;
            const alert = power > 1500 ? 'critical' : power > 1200 ? 'warning' : 'normal';

            const newData: EnergyData = {
                voltage,
                current,
                power,
                energy: (history.length * power) / 1000 / 3600, // Rough integration
                status: isOnline ? 'online' : 'offline',
                alert,
                timestamp: now / 1000
            };

            setIsOffline(!isOnline);
            setData(newData);
            setHistory(prev => [...prev.slice(-40), { ...newData, time: now }]); // Keep last 40 points
        }, 1000);

        return () => clearInterval(interval);
    }, [history]); 
    */

    const [simulationActive, setSimulationActive] = useState(false);
    const [simulationType, setSimulationType] = useState<'normal' | 'anomaly'>('normal');
    const [selectedAppliance, setSelectedAppliance] = useState<'bulb' | 'laptop' | 'fan' | null>(null);

    // Simulation Logic
    useEffect(() => {
        if (!simulationActive) return;

        const interval = setInterval(() => {
            const now = Date.now();
            let basePower = 0;
            let voltageNoise = Math.random() * 2 - 1;
            let voltage, current, power, alert;

            // 1. Determine Base Power & Voltage for Appliance
            if (selectedAppliance === 'bulb') {
                basePower = 9;
            } else if (selectedAppliance === 'laptop') {
                basePower = 65;
            } else if (selectedAppliance === 'fan') {
                basePower = 45;
            } else {
                // Generic Load (Floating)
                basePower = 200 + Math.random() * 50;
            }

            // 2. Apply Simulation Mode (Normal vs Anomaly)
            if (simulationType === 'normal') {
                voltage = 230 + voltageNoise;
                power = basePower + (Math.random() * (basePower * 0.1)); // +/- 10% fluctuation
                alert = 'normal';
            } else {
                // Anomaly Mode: Critical Threshold Breach
                // Simulating a fault, short, or over-voltage
                const anomalyType = Math.random() > 0.5 ? 'surge' : 'fault';

                if (anomalyType === 'surge') {
                    voltage = 260 + Math.random() * 15; // Voltage Spike
                    power = basePower * 1.5; // Power increases with voltage
                } else {
                    voltage = 230 + voltageNoise;
                    power = basePower * 2.5; // Faulty component drawing 2.5x power
                }
                alert = 'critical';
            }

            current = power / voltage;

            const newData: EnergyData = {
                voltage,
                current,
                power,
                energy: (history.length * power) / 1000 / 3600,
                status: 'online',
                alert: alert as 'normal' | 'critical',
                timestamp: now / 1000
            };

            setIsOffline(false);
            setData(newData);
            setHistory(prev => [...prev.slice(-40), { ...newData, time: now }]);
        }, 2000); // Refresh every 2 seconds

        return () => clearInterval(interval);
    }, [simulationActive, simulationType, history]);

    // Real Firebase Implementation (Only active if NOT simulating)
    useEffect(() => {
        if (simulationActive) return;

        const dataRef = ref(db, 'sensors/esp32_01');
        const unsubscribe = onValue(dataRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                setData(val);
                setHistory(prev => [...prev.slice(-40), { ...val, time: Date.now() }]);
                setIsOffline(val.status === 'offline');
            } else {
                // Keep "waiting" state if DB is empty and not simulating
                // Optional: set isOffline(true) here? 
                // User said "if there is no inputs... I don't want it to be on standby", 
                // but checking the simulation buttons is the solution for that.
            }
        });
        return () => unsubscribe();
    }, [simulationActive]);

    const currentStatusColor = isOffline ? 'text-red-500' : 'text-emerald-400';
    const glowColor = data?.alert === 'critical' ? 'shadow-red-500/50' : data?.alert === 'warning' ? 'shadow-amber-500/50' : 'shadow-cyan-500/30';

    return (
        <div className={cn(
            "min-h-screen bg-[#030303] text-white font-sans overflow-hidden transition-all duration-1000",
            isOffline ? "grayscale-[0.8]" : ""
        )}>
            {/* Top Bar */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030303]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">WI4ED <span className="text-white/40 text-sm font-normal ml-2">DASHBOARD_V2.0</span></h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Waveform Nav Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = '/waveforms'}
                            className="hidden md:flex border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                        >
                            <Activity className="w-4 h-4 mr-2" />
                            Waveform AI
                        </Button>

                        {/* Simulation Controls */}
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                            <Button
                                variant={simulationActive ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    setSimulationActive(!simulationActive);
                                    if (simulationActive) setSelectedAppliance(null); // Reset on stop
                                }}
                                className={cn(
                                    "transition-all",
                                    simulationActive ? "bg-cyan-600 hover:bg-cyan-500" : "text-white/60 hover:text-white"
                                )}
                            >
                                {simulationActive ? <span className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Simulating</span> : "Start Simulation"}
                            </Button>

                            {simulationActive && (
                                <>
                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSimulationType('normal')}
                                        className={cn(
                                            "w-8 h-8 p-0 rounded-full border transition-all",
                                            simulationType === 'normal'
                                                ? "bg-emerald-500/20 text-emerald-500 border-emerald-500"
                                                : "border-transparent text-white/40 hover:text-emerald-400"
                                        )}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-current" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSimulationType('anomaly')}
                                        className={cn(
                                            "w-8 h-8 p-0 rounded-full border transition-all",
                                            simulationType === 'anomaly'
                                                ? "bg-red-500/20 text-red-500 border-red-500"
                                                : "border-transparent text-white/40 hover:text-red-400"
                                        )}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-current" />
                                    </Button>
                                </>
                            )}
                        </div>
                        {/* Appliance Selector (Only visible during simulation) */}
                        {simulationActive && (
                            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 ml-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedAppliance('bulb')}
                                    className={cn("h-8 w-8 p-0 rounded-full", selectedAppliance === 'bulb' ? "bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500" : "text-white/40 hover:text-yellow-400")}
                                >
                                    <Lightbulb className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedAppliance('laptop')}
                                    className={cn("h-8 w-8 p-0 rounded-full", selectedAppliance === 'laptop' ? "bg-blue-500/20 text-blue-500 ring-1 ring-blue-500" : "text-white/40 hover:text-blue-400")}
                                >
                                    <Plug className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedAppliance('fan')}
                                    className={cn("h-8 w-8 p-0 rounded-full", selectedAppliance === 'fan' ? "bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500" : "text-white/40 hover:text-emerald-400")}
                                >
                                    <Fan className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div> {/* Close simulation controls container */}

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            {isOffline ? <WifiOff className="w-4 h-4 text-red-500" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                            <span className={cn("text-xs font-mono uppercase tracking-widest", currentStatusColor)}>
                                {isOffline ? 'OFFLINE' : 'ONLINE'}
                            </span>
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", isOffline ? "bg-red-500" : "bg-emerald-400")}></div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8">

                {/* Hero Section: Live Power */}
                <section className="relative">
                    <div className={cn(
                        "relative overflow-hidden rounded-3xl border border-white/10 p-8 md:p-12 text-center transition-all duration-500",
                        glowColor, isOffline ? "" : "shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]"
                    )}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                        <div className="relative z-10">
                            <p className="text-sm md:text-base text-cyan-300 uppercase tracking-[0.3em] font-medium mb-4">Live Power Consumption</p>
                            <div className="flex items-baseline justify-center gap-2 md:gap-4">
                                <motion.span
                                    key={data?.power}
                                    initial={{ opacity: 0.5, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "text-7xl md:text-9xl font-black tracking-tighter tabular-nums",
                                        data?.alert === 'critical' ? "text-red-500" : data?.alert === 'warning' ? "text-amber-400" : "text-white"
                                    )}
                                >
                                    {isOffline ? '---' : data?.power.toFixed(0)}
                                </motion.span>
                                <span className="text-2xl md:text-4xl text-white/40 font-light">W</span>
                            </div>
                            <div className="mt-4 flex justify-center gap-2">
                                {data?.alert !== 'normal' && !isOffline && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                            data?.alert === 'critical' ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        )}
                                    >
                                        Power Anomaly Detected
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Metrics Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Voltage',
                            value: data?.voltage.toFixed(1),
                            unit: 'V',
                            icon: Battery,
                            color: 'text-blue-400',
                            bg: 'bg-blue-500/10',
                            glow: 'group-hover:text-blue-400 group-hover:drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'
                        },
                        {
                            label: 'Current',
                            value: data?.current.toFixed(2),
                            unit: 'A',
                            icon: Activity,
                            color: 'text-violet-400',
                            bg: 'bg-violet-500/10',
                            glow: 'group-hover:text-violet-400 group-hover:drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]'
                        },
                        {
                            label: 'Energy',
                            value: data?.energy.toFixed(3),
                            unit: 'kWh',
                            icon: Server,
                            color: 'text-emerald-400',
                            bg: 'bg-emerald-500/10',
                            glow: 'group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                        },
                    ].map((metric, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-40 group"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{metric.label}</span>
                                <div className={cn("p-2 rounded-lg transition-colors group-hover:bg-white/10", metric.bg, metric.color)}>
                                    <metric.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-4xl font-bold text-white tracking-tight tabular-nums transition-all duration-300",
                                    metric.glow
                                )}>
                                    {isOffline ? '--' : metric.value}
                                </span>
                                <span className="text-white/40 font-medium">{metric.unit}</span>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* Real-Time Chart */}
                <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 h-[400px] relative">
                    <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-500" />
                        Real-Time Analysis
                    </h3>

                    {isOffline && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#030303]/60 backdrop-blur-sm rounded-3xl">
                            <div className="text-center">
                                <WifiOff className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <p className="text-white/40 font-mono tracking-widest">SIGNAL LOST - WAITING FOR DATA</p>
                            </div>
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={data?.alert === 'critical' ? '#ef4444' : '#06b6d4'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={data?.alert === 'critical' ? '#ef4444' : '#06b6d4'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                            <XAxis dataKey="time" hide />
                            <YAxis
                                stroke="#4b5563"
                                fontSize={12}
                                tickFormatter={(val) => `${val}W`}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                labelStyle={{ color: '#888' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="power"
                                stroke={data?.alert === 'critical' ? '#ef4444' : '#06b6d4'}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPower)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </section>

                {/* Waveform Analysis Embedded */}
                <section>
                    <WaveformAnalysis
                        className="min-h-0 h-auto rounded-3xl border border-white/10 bg-white/[0.02]"
                        targetAppliance={selectedAppliance}
                    />
                </section>

            </main>
        </div>
    );
}
