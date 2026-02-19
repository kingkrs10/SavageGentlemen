import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Matter from 'matter-js';

export default function AppsSavagePhysics() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [bodyCount, setBodyCount] = useState(0);
    const [gravityLabel, setGravityLabel] = useState('ANTIGRAVITY MODE');
    const [gravityLabelColor, setGravityLabelColor] = useState('rgba(255,255,255,0.15)');
    const [showKonamiMsg, setShowKonamiMsg] = useState(false);
    const [btnText, setBtnText] = useState('SAVAGE ENGAGE');
    const [btnEngaged, setBtnEngaged] = useState(false);

    // Mutable refs for physics state
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const wallsRef = useRef<Matter.Body[]>([]);
    const bodyCountRef = useRef(0);
    const konamiRef = useRef(false);
    const gravityEngagedRef = useRef(false);

    // Initialize physics engine
    useEffect(() => {
        if (!canvasRef.current) return;

        const container = canvasRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;

        const engine = Matter.Engine.create();
        engine.gravity.y = 0; // Antigravity mode
        engineRef.current = engine;

        const render = Matter.Render.create({
            element: container,
            engine,
            options: {
                width: W,
                height: H,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio || 1,
            },
        });
        renderRef.current = render;

        Matter.Render.run(render);
        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);
        runnerRef.current = runner;

        // Invisible walls
        const wallOpts = { isStatic: true, render: { visible: false } } as Matter.IChamferableBodyDefinition;
        const walls = [
            Matter.Bodies.rectangle(W / 2, H + 30, W + 100, 60, wallOpts),  // floor
            Matter.Bodies.rectangle(W / 2, -30, W + 100, 60, wallOpts),      // ceiling
            Matter.Bodies.rectangle(-30, H / 2, 60, H + 100, wallOpts),      // left
            Matter.Bodies.rectangle(W + 30, H / 2, 60, H + 100, wallOpts),   // right
        ];
        wallsRef.current = walls;
        Matter.Composite.add(engine.world, walls);

        // Mouse constraint for drag & throw
        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: true, lineWidth: 1, strokeStyle: '#39ff14' },
            },
        });
        Matter.Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        // Ambient drift for zero-gravity
        Matter.Events.on(engine, 'beforeUpdate', () => {
            if (engine.gravity.y === 0) {
                Matter.Composite.allBodies(engine.world).forEach((body) => {
                    if (!body.isStatic) {
                        const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                        if (speed < 0.3) {
                            Matter.Body.setVelocity(body, {
                                x: body.velocity.x + (Math.random() - 0.5) * 0.2,
                                y: body.velocity.y + (Math.random() - 0.5) * 0.2,
                            });
                        }
                    }
                });
            }
        });

        // Resize handler
        const handleResize = () => {
            if (!container || !render) return;
            const nW = container.clientWidth;
            const nH = container.clientHeight;
            render.canvas.width = nW;
            render.canvas.height = nH;
            render.options.width = nW;
            render.options.height = nH;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
            Matter.Engine.clear(engine);
            render.canvas.remove();
        };
    }, []);

    // Create a canvas texture for a text body
    const createTextTexture = useCallback((text: string, isGold = false) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const fontSize = 22;
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        const metrics = ctx.measureText(text);
        const padding = 24;
        const w = Math.max(metrics.width + padding * 2, 80);
        const h = fontSize + padding * 2;
        canvas.width = w * 2;
        canvas.height = h * 2;
        ctx.scale(2, 2);

        // Background
        if (isGold) {
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#ffd700');
            grad.addColorStop(0.5, '#ffec8b');
            grad.addColorStop(1, '#daa520');
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        }
        ctx.fillRect(0, 0, w, h);

        // Border with glow
        ctx.strokeStyle = isGold ? '#ffd700' : '#39ff14';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, w - 2, h - 2);
        ctx.shadowColor = isGold ? '#ffd700' : '#39ff14';
        ctx.shadowBlur = 8;
        ctx.strokeRect(1, 1, w - 2, h - 2);
        ctx.shadowBlur = 0;

        // Text
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.fillStyle = isGold ? '#000' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (!isGold) {
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 4;
        }
        ctx.fillText(text, w / 2, h / 2);

        return { dataUrl: canvas.toDataURL(), width: w, height: h };
    }, []);

    // Spawn a physics body with text
    const spawnTextBody = useCallback((text: string, isGold = false) => {
        if (!engineRef.current || !canvasRef.current) return null;

        const { dataUrl, width, height } = createTextTexture(text, isGold);
        const container = canvasRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;

        const x = W / 2 + (Math.random() - 0.5) * 300;
        const y = H / 2 + (Math.random() - 0.5) * 200;

        const body = Matter.Bodies.rectangle(x, y, width, height, {
            restitution: 0.6,
            friction: 0.1,
            frictionAir: 0.01,
            render: {
                sprite: { texture: dataUrl, xScale: 0.5, yScale: 0.5 },
            },
            label: text,
        });

        Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 3,
            y: (Math.random() - 0.5) * 3,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

        Matter.Composite.add(engineRef.current.world, body);
        bodyCountRef.current += 1;
        setBodyCount(bodyCountRef.current);

        return body;
    }, [createTextTexture]);

    // SAVGENT easter egg
    const triggerKonami = useCallback(() => {
        if (!engineRef.current) return;
        konamiRef.current = true;

        // Reverse gravity — UP
        engineRef.current.gravity.y = -2;

        // Remove ceiling so things ascend away
        if (wallsRef.current[1]) {
            Matter.Composite.remove(engineRef.current.world, wallsRef.current[1]);
        }

        setGravityLabel('⚡ REVERSE GRAVITY ⚡');
        setGravityLabelColor('#ffd700');
        setTimeout(() => setShowKonamiMsg(true), 800);

        // Glitch all bodies upward
        Matter.Composite.allBodies(engineRef.current.world).forEach((b) => {
            if (!b.isStatic) {
                Matter.Body.setVelocity(b, {
                    x: (Math.random() - 0.5) * 10,
                    y: -Math.random() * 8 - 3,
                });
            }
        });
    }, []);

    // Toggle gravity
    const handleEngageClick = useCallback(() => {
        if (konamiRef.current || !engineRef.current) return;

        const newEngaged = !gravityEngagedRef.current;
        gravityEngagedRef.current = newEngaged;
        setBtnEngaged(newEngaged);
        engineRef.current.gravity.y = newEngaged ? 1 : 0;
        setBtnText(newEngaged ? 'DISENGAGE' : 'SAVAGE ENGAGE');
        setGravityLabel(newEngaged ? 'GRAVITY ENGAGED' : 'ANTIGRAVITY MODE');
        setGravityLabelColor(newEngaged ? 'rgba(255, 57, 57, 0.3)' : 'rgba(255,255,255,0.15)');
    }, []);

    // Input handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const text = (e.target as HTMLInputElement).value.trim().toUpperCase();
            if (!text) return;

            if (text === 'SAVGENT' && !konamiRef.current) {
                spawnTextBody(text, true);
                setTimeout(() => triggerKonami(), 300);
            } else {
                spawnTextBody(text);
            }

            (e.target as HTMLInputElement).value = '';
        }
    }, [spawnTextBody, triggerKonami]);

    return (
        <>
            <SEOHead
                title="Savage Physics"
                description="An interactive physics playground. Type your burdens and watch them float, fall, or ascend."
            />

            <div className="relative min-h-screen overflow-hidden bg-black" style={{ fontFamily: "'Courier New', monospace" }}>
                {/* Scanlines overlay */}
                <div
                    className="fixed inset-0 z-[5] pointer-events-none"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
                    }}
                />

                {/* Back nav */}
                <div className="fixed top-4 left-4 z-20">
                    <Link href="/apps">
                        <span className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors cursor-pointer" style={{ fontFamily: "'Courier New', monospace" }}>
                            <ArrowLeft className="w-4 h-4" />
                            Back to Apps
                        </span>
                    </Link>
                </div>

                {/* Title */}
                <div
                    className="fixed top-7 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none"
                    style={{ fontSize: 12, letterSpacing: 8, color: 'rgba(57, 255, 20, 0.3)', textTransform: 'uppercase' }}
                >
                    SAVAGE PHYSICS
                </div>

                {/* Gravity label */}
                <div
                    className="fixed top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-colors duration-500"
                    style={{ fontSize: 10, letterSpacing: 6, color: gravityLabelColor, textTransform: 'uppercase' }}
                >
                    {gravityLabel}
                </div>

                {/* Counter */}
                <div
                    className="fixed top-7 right-7 z-10 pointer-events-none select-none"
                    style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(57, 255, 20, 0.25)' }}
                >
                    BODIES: {bodyCount}
                </div>

                {/* Konami message */}
                <div
                    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none text-center transition-opacity duration-1000 ${showKonamiMsg ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: '#ffd700',
                        letterSpacing: 4,
                        textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4), 0 0 100px rgba(255, 215, 0, 0.2)',
                        lineHeight: 1.4,
                        animation: showKonamiMsg ? 'msgGlow 2s ease-in-out infinite alternate' : 'none',
                    }}
                >
                    You Are One 🦁
                </div>

                {/* Physics canvas */}
                <div ref={canvasRef} className="absolute inset-0 z-0" />

                {/* HUD */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="TYPE YOUR BURDEN . . ."
                        autoComplete="off"
                        spellCheck={false}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="bg-black/70 text-center uppercase outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(57,255,20,0.4),inset_0_0_20px_rgba(57,255,20,0.05)]"
                        style={{
                            border: '2px solid #39ff14',
                            color: '#39ff14',
                            fontFamily: "'Courier New', monospace",
                            fontSize: 18,
                            padding: '12px 24px',
                            width: 400,
                            maxWidth: '90vw',
                            letterSpacing: 2,
                        }}
                    />
                    <button
                        onClick={handleEngageClick}
                        className="transition-all duration-300 relative overflow-hidden group"
                        style={{
                            background: 'transparent',
                            border: `2px solid ${btnEngaged ? '#ff3939' : '#39ff14'}`,
                            color: btnEngaged ? '#ff3939' : '#39ff14',
                            fontFamily: "'Courier New', monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            padding: '10px 32px',
                            cursor: 'pointer',
                            letterSpacing: 4,
                            textTransform: 'uppercase' as const,
                            animation: btnEngaged ? 'pulseRed 1.5s infinite' : 'none',
                        }}
                    >
                        <span className="relative z-10 group-hover:text-black transition-colors duration-300">{btnText}</span>
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: btnEngaged ? '#ff3939' : '#39ff14' }}
                        />
                    </button>
                </div>

                {/* Keyframe animations */}
                <style>{`
          @keyframes msgGlow {
            from { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4); }
            to { text-shadow: 0 0 40px rgba(255, 215, 0, 1), 0 0 100px rgba(255, 215, 0, 0.6), 0 0 150px rgba(255, 215, 0, 0.3); }
          }
          @keyframes pulseRed {
            0%, 100% { box-shadow: 0 0 5px rgba(255, 57, 57, 0.3); }
            50% { box-shadow: 0 0 25px rgba(255, 57, 57, 0.6); }
          }
        `}</style>
            </div>
        </>
    );
}
