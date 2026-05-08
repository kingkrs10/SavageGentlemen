import { useEffect, useRef, useCallback } from "react";

/**
 * ParticleBackground3D
 * 
 * A performant 3D-simulated particle field rendered on <canvas>.
 * - Gradient mesh from #24f7ff (cyan) → #6c5ce7 (purple)
 * - Particles have z-depth for parallax / size scaling
 * - Mouse / touch interaction pushes nearby particles away
 * - Fully responsive — resizes with the viewport
 * - Uses requestAnimationFrame for smooth 60 fps rendering
 */

interface Particle {
  x: number;
  y: number;
  z: number;       // 0 (far) → 1 (near)
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
  hue: number;      // interpolated between cyan ↔ purple
  alpha: number;
  pulseOffset: number;
}

// Gradient endpoints
const COLOR_A = { r: 0x24, g: 0xf7, b: 0xff }; // #24f7ff  cyan
const COLOR_B = { r: 0x6c, g: 0x5c, b: 0xe7 }; // #6c5ce7  purple

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(t: number) {
  return {
    r: Math.round(lerp(COLOR_A.r, COLOR_B.r, t)),
    g: Math.round(lerp(COLOR_A.g, COLOR_B.g, t)),
    b: Math.round(lerp(COLOR_A.b, COLOR_B.b, t)),
  };
}

const PARTICLE_COUNT_DESKTOP = 120;
const PARTICLE_COUNT_MOBILE = 60;
const CONNECTION_DISTANCE = 140;
const MOUSE_RADIUS = 180;

export default function ParticleBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // --- helpers ---------------------------------------------------------------

  const isMobile = useCallback(() => typeof window !== "undefined" && window.innerWidth < 768, []);

  const createParticle = useCallback((w: number, h: number): Particle => {
    const z = Math.random();
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      z,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.002,
      baseRadius: 1 + Math.random() * 2.5,
      hue: Math.random(),            // used for color interpolation
      alpha: 0.3 + Math.random() * 0.5,
      pulseOffset: Math.random() * Math.PI * 2,
    };
  }, []);

  // --- main loop -------------------------------------------------------------

  const animate = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const { w, h } = sizeRef.current;
    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    // --- background gradient -------------------------------------------------
    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.5, h * 0.5, Math.max(w, h));
    bgGrad.addColorStop(0, "rgba(36, 247, 255, 0.05)");
    bgGrad.addColorStop(0.5, "rgba(80, 100, 230, 0.03)");
    bgGrad.addColorStop(1, "rgba(108, 92, 231, 0.02)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // --- update & draw particles ---------------------------------------------
    const sortedParticles = [...particles].sort((a, b) => a.z - b.z); // back-to-front

    for (let i = 0; i < sortedParticles.length; i++) {
      const p = sortedParticles[i];

      // depth-based properties
      const depthScale = 0.3 + p.z * 0.7;
      const radius = p.baseRadius * depthScale;
      const pulse = Math.sin(time * 0.001 + p.pulseOffset) * 0.3 + 0.7;
      const drawAlpha = p.alpha * depthScale * pulse;

      // mouse repulsion
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.8;
          p.vy += Math.sin(angle) * force * 0.8;
        }
      }

      // friction + velocity
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x += p.vx;
      p.y += p.vy;

      // z oscillation
      p.z += p.vz;
      if (p.z <= 0 || p.z >= 1) p.vz *= -1;
      p.z = Math.max(0, Math.min(1, p.z));

      // wrap edges
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // draw glow
      const col = lerpColor(p.hue);
      const glowRadius = radius * 4;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
      glow.addColorStop(0, `rgba(${col.r},${col.g},${col.b},${drawAlpha * 0.4})`);
      glow.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - glowRadius, p.y - glowRadius, glowRadius * 2, glowRadius * 2);

      // draw core
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${drawAlpha})`;
      ctx.fill();

      // connections to nearby particles (only for closer/larger particles to stay performant)
      if (depthScale > 0.5) {
        for (let j = i + 1; j < sortedParticles.length; j++) {
          const q = sortedParticles[j];
          const qDepth = 0.3 + q.z * 0.7;
          if (qDepth < 0.5) continue;

          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const lineAlpha = (1 - dist / CONNECTION_DISTANCE) * 0.15 * Math.min(depthScale, qDepth);
            const midColor = lerpColor((p.hue + q.hue) / 2);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${midColor.r},${midColor.g},${midColor.b},${lineAlpha})`;
            ctx.lineWidth = 0.5 * Math.min(depthScale, qDepth);
            ctx.stroke();
          }
        }
      }
    }

    // --- subtle vignette overlay ---------------------------------------------
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    rafRef.current = requestAnimationFrame((t) => animate(ctx, t));
  }, []);

  // --- lifecycle -------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // sizing
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };

      // re-generate particles when resizing
      const count = isMobile() ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
      particlesRef.current = Array.from({ length: count }, () => createParticle(w, h));
    };

    resize();
    window.addEventListener("resize", resize);

    // pointer tracking
    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onPointerLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          active: true,
        };
      }
    };
    const onTouchEnd = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // start render loop
    rafRef.current = requestAnimationFrame((t) => animate(ctx, t));

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [animate, createParticle, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="particle-bg-3d"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
}
