import { useEffect, useRef } from "react";
import { CELEBRATE_EVENT } from "@/lib/celebrate";

// 和のトーンの祝い色(改善の緑・朱・黄土＋少しの華やぎ)。
const COLORS = [
  "#4E8259",
  "#7FB587",
  "#B5533F",
  "#B5893C",
  "#E4B363",
  "#DEA0A0",
  "#EAD7C2",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
}

/** 治癒を確定した瞬間の紙吹雪(くす玉風)。canvas 自作・依存なし。 */
export function Celebration() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let running = false;

    const spawn = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.16;
      const next: Particle[] = [];
      for (let i = 0; i < 110; i++) {
        // 上向きに扇状に飛ばす(くす玉が開くイメージ)。
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
        const speed = 5 + Math.random() * 10;
        const ribbon = Math.random() < 0.4;
        next.push({
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          w: ribbon ? 3 + Math.random() * 3 : 6 + Math.random() * 6,
          h: ribbon ? 16 + Math.random() * 18 : 6 + Math.random() * 6,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          life: 1,
        });
      }
      particles.current = next;
    };

    const tick = () => {
      const ps = particles.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of ps) {
        p.vy += 0.22; // 重力
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > canvas.height * 0.5) p.life -= 0.018; // 落ちながら消える
        if (p.life <= 0) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0 && running) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const onCelebrate = () => {
      if (reduced) return;
      spawn();
      if (!running) {
        running = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener(CELEBRATE_EVENT, onCelebrate);
    return () => {
      window.removeEventListener(CELEBRATE_EVENT, onCelebrate);
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-100"
    />
  );
}
