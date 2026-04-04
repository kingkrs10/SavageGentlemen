import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { VoidTransition } from "@/components/effects/VoidTransition";
import { Eye, Ticket, MapPin, Calendar, Clock } from "lucide-react";
import { useUser } from "@/context/UserContext";
import gsap from "gsap";

const SocaNoirSplash = () => {
    const [, navigate] = useLocation();
    const { setTheme } = useTheme();
    const { user } = useUser();
    const [showVoidTransition, setShowVoidTransition] = useState(false);

    useEffect(() => {
        // Sophisticated ambient animations for the sunset scene
        gsap.to(".sunset-glow-overlay", {
            opacity: 0.6,
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }, []);

    const enterTheVoid = (path?: string) => {
        setTheme('tactical');
        if (path) {
            setTimeout(() => navigate(path), 500);
        }
    };

    const handleTicketsClick = () => {
        const eventUrl = "/events/2";
        
        // Navigate directly to the event page to show all ticket options
        navigate(eventUrl);
    };

    return (
        <div className="relative z-0 w-full min-h-screen overflow-hidden bg-[#050005] text-white font-sans">
            {/* BACKGROUND LAYER */}
            <div className="absolute inset-0 z-0">
                {/* Main Sunset Motion Background */}
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[30s] ease-linear scale-105"
                    style={{ 
                        backgroundImage: `url('/soca-sunset.png'), radial-gradient(circle at 50% 50%, #2e1065 0%, #050005 100%)`, 
                        backgroundColor: '#050005'
                    }}
                />
                
                {/* Sunset Glow Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050005] via-transparent to-black/20 opacity-90" />
                <div className="absolute inset-0 sunset-glow-overlay bg-[radial-gradient(circle_at_50%_40%,rgba(251,146,60,0.1),transparent_70%)] opacity-30" />

                {/* Subtle Floating Embers (replaces shooting stars for sunset vibe) */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <motion.div 
                            key={`ember-${i}`}
                            animate={{ 
                                y: [0, -100], 
                                x: [0, (i % 2 === 0 ? 30 : -30)],
                                opacity: [0, 0.4, 0] 
                            }}
                            transition={{ 
                                duration: 5 + Math.random() * 5, 
                                repeat: Infinity, 
                                delay: Math.random() * 5 
                            }}
                            className="absolute bg-orange-400/40 w-[3px] h-[3px] rounded-full blur-[1px]"
                            style={{
                                bottom: '10%',
                                left: `${10 + Math.random() * 80}%`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* UI LAYER */}
            <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-6 py-12 lg:py-20">
                
                {/* TOP: Branding */}
                <div className="w-full flex justify-between items-start max-w-7xl">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel-sunset px-3 py-2 sm:px-6 sm:py-3 border-l-2 border-orange-500/50"
                    >
                        <span className="text-[8px] sm:text-[10px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.4em] font-bold text-orange-200/80">SavageGentlemen</span>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel-sunset px-3 py-2 sm:px-6 sm:py-3 border-r-2 border-rose-500/50"
                    >
                        <span className="text-[8px] sm:text-[10px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.4em] font-bold text-rose-200/80">KingLeo Promotions</span>
                    </motion.div>
                </div>

                {/* CENTER: Main Typography */}
                <div className="flex flex-col items-center gap-10 text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <h1 className="text-[2.75rem] leading-[1.1] sm:text-6xl sm:leading-[0.95] md:text-9xl md:leading-[0.85] font-black uppercase tracking-tighter [text-shadow:_0_0_40px_rgba(251,146,60,0.15)]">
                            SOCA NÓIR <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-orange-400 animate-sunset-glow">
                                RÓSÉ
                            </span>
                        </h1>
                        
                        <div className="mt-6 md:mt-10 flex flex-wrap gap-2 md:gap-4 justify-center items-center">
                            <div className="flex items-center gap-2 md:gap-3 text-white/90 glass-panel-sunset px-4 py-2 md:px-6 md:py-3 rounded-full">
                                <Calendar className="w-3.5 h-3.5 md:w-4 h-4 text-orange-400" />
                                <span className="text-xs md:text-base uppercase tracking-widest font-bold">05.17.26</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 text-white/90 glass-panel-sunset px-4 py-2 md:px-6 md:py-3 rounded-full">
                                <Clock className="w-3.5 h-3.5 md:w-4 h-4 text-rose-400" />
                                <span className="text-xs md:text-base uppercase tracking-widest font-bold">STARTS AT 6:00 PM</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 text-white/90 glass-panel-sunset px-4 py-2 md:px-6 md:py-3 rounded-full">
                                <MapPin className="w-3.5 h-3.5 md:w-4 h-4 text-orange-500" />
                                <span className="text-xs md:text-base uppercase tracking-widest font-bold">HOBOKEN, NJ</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* REDESIGNED CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Button 
                            id="tickets-cta-button"
                            onClick={handleTicketsClick}
                            className="relative group h-auto bg-transparent border-0 px-6 py-8 sm:px-12 sm:py-10 md:px-16 md:py-12 rounded-2xl transition-all duration-700 hover:scale-[1.02]"
                        >
                            {/* Sunset Border Effect */}
                            <div className="absolute inset-0 neon-border-sunset opacity-60 group-hover:opacity-100 transition-opacity rounded-2xl" />
                            
                            {/* Deep Glass Background */}
                            <div className="absolute inset-[1px] bg-black/60 backdrop-blur-2xl rounded-2xl z-0 border border-white/5" />
                            
                            {/* Button Content */}
                            <div className="relative z-10 flex items-center gap-4 md:gap-6">
                                <div className="p-3 md:p-4 bg-gradient-to-br from-orange-500/20 to-rose-600/20 rounded-xl group-hover:from-orange-500/40 group-hover:to-rose-600/40 transition-all duration-500">
                                    <Ticket className="w-6 h-6 md:w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[8px] md:text-xs uppercase tracking-[0.4em] text-orange-400 font-black mb-1">Comfy & Fashionable</span>
                                    <span className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-orange-100 transition-colors">
                                        Secure Early Bird Tickets
                                    </span>
                                </div>
                            </div>

                            {/* Internal Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-transparent to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        </Button>
                    </motion.div>

                    {/* EXIT BUTTON (VOID) */}
                    <motion.button 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={() => setShowVoidTransition(true)}
                        className="flex items-center gap-3 text-white/60 group mt-6 uppercase tracking-[0.5em] text-[10px] font-black"
                    >
                        <Eye className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                        Enter the Void
                    </motion.button>
                </div>

                {/* FOOTER */}
                <div className="text-center w-full max-w-2xl">
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ delay: 1.2 }}
                        className="text-[10px] md:text-xs uppercase tracking-[0.6em] leading-relaxed font-bold text-orange-100/50"
                    >
                        CURATED VIBES. PREMIUM EXPERIENCE. <br/>
                        VIP & BOTTLE SERVICE ANNOUNCEMENTS COMING SOON
                    </motion.p>
                </div>
            </div>

            {/* VOID TRANSITION EFFECT */}
            {showVoidTransition && (
                <VoidTransition onComplete={() => enterTheVoid('/home')} />
            )}
        </div>
    );
};

export default SocaNoirSplash;
