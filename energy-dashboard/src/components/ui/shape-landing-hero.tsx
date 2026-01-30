"use client";
import React from "react";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { motion } from "framer-motion";
import { ArrowRight, Zap, ShieldCheck, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroGeometric() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md relative z-0">

            {/* 3D Dotted Surface Background */}
            <DottedSurface className="size-full opacity-60" />

            {/* Content Layer */}
            <div className="relative z-20 flex flex-col items-center justify-center gap-6 px-4 text-center max-w-5xl mx-auto">

                {/* Minimalist Title */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.2em" }}
                    animate={{ opacity: 1, scale: 1, letterSpacing: "0.5em" }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="md:text-9xl text-6xl font-black text-white tracking-[0.5em] transition-colors drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                    WI4ED
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="mt-12"
                >
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 font-bold px-12 h-14 rounded-full text-lg shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-all"
                        onClick={() => navigate('/login')}
                    >
                        ENTER TERMINAL
                    </Button>
                </motion.div>

            </div>
        </div>
    );
}
