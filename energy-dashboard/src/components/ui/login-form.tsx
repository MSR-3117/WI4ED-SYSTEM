import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import type { JSX, SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const GoogleIcon = (
    props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
    </svg>
);

export default function Login() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setIsLoading(false);
            navigate('/dashboard');
        }, 1500);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#030303] text-foreground">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-cyan-500/[0.02] blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-sm"
            >
                <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                        <h2 className="text-center text-xl font-semibold text-white tracking-wide">
                            WI4ED <span className="text-cyan-400">ACCESS</span>
                        </h2>
                        <p className="text-center text-xs text-muted-foreground mt-1 uppercase tracking-widest">Secure Terminal</p>

                        <form onSubmit={handleLogin} className="mt-8 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white/80">
                                    Identity
                                </Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder="operator@wi4ed.io"
                                    className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-white/80">
                                    Passphrase
                                </Label>
                                <Input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={isLoading} className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(8,145,178,0.3)] border border-cyan-400/20">
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Authenticating...
                                    </span>
                                ) : "Initialize Session"}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full bg-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0a0a0a] px-2 text-muted-foreground">
                                    or authenticate with
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="inline-flex w-full items-center justify-center space-x-2 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white"
                            asChild
                        >
                            <a href="#">
                                <GoogleIcon className="size-5" aria-hidden={true} />
                                <span className="text-sm font-medium">SSO Provider</span>
                            </a>
                        </Button>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
