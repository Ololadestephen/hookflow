"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

const RING_RADIUS = 180;
const PARTICLE_COUNT = 240;

type Particle = {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  opacity: number;
  history: Array<{ x: number; y: number }>;
  historyLimit: number;
  x: number;
  y: number;
};

type Pulse = {
  angle: number;
  distance: number;
  speed: number;
  life: number;
  decay: number;
  x: number;
  y: number;
};

function createParticle(): Particle {
  return {
    angle: Math.random() * Math.PI * 2,
    distance: RING_RADIUS + (Math.random() - 0.5) * 120,
    speed: (0.002 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1),
    size: 0.5 + Math.random() * 1.5,
    opacity: 0.1 + Math.random() * 0.4,
    history: [],
    historyLimit: 15 + Math.floor(Math.random() * 20),
    x: 0,
    y: 0
  };
}

function createPulse(): Pulse {
  return {
    angle: Math.random() * Math.PI * 2,
    distance: RING_RADIUS + (Math.random() - 0.5) * 40,
    speed: 0.02 + Math.random() * 0.03,
    life: 1,
    decay: 0.005 + Math.random() * 0.01,
    x: 0,
    y: 0
  };
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    const currentCanvas = canvasRef.current;
    const context = currentCanvas?.getContext("2d");
    if (!currentCanvas || !context) return;
    const drawingCanvas: HTMLCanvasElement = currentCanvas;
    const drawingContext: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let particles: Particle[] = [];
    let pulses: Pulse[] = [];
    let animationFrame = 0;

    function init() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      drawingCanvas.width = Math.floor(width * dpr);
      drawingCanvas.height = Math.floor(height * dpr);
      drawingCanvas.style.width = `${width}px`;
      drawingCanvas.style.height = `${height}px`;
      drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawingContext.lineCap = "round";
      drawingContext.lineJoin = "round";
      centerX = width / 2;
      centerY = height * (width < 768 ? 0.25 : 0.48);
      particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
      for (let step = 0; step < 24; step += 1) {
        particles.forEach(updateParticle);
      }
    }

    function drawPoolRing() {
      drawingContext.beginPath();
      drawingContext.arc(centerX, centerY, RING_RADIUS, 0, Math.PI * 2);
      drawingContext.strokeStyle = "rgba(78, 222, 163, 0.08)";
      drawingContext.lineWidth = 10;
      drawingContext.stroke();

      drawingContext.beginPath();
      drawingContext.arc(centerX, centerY, RING_RADIUS, 0, Math.PI * 2);
      drawingContext.strokeStyle = "rgba(78, 222, 163, 0.16)";
      drawingContext.lineWidth = 1;
      drawingContext.setLineDash([5, 15]);
      drawingContext.stroke();
      drawingContext.setLineDash([]);
    }

    function updateParticle(particle: Particle) {
      particle.angle += particle.speed;
      const currentDistance = particle.distance + Math.sin(particle.angle * 3) * 15;

      particle.x = centerX + Math.cos(particle.angle) * currentDistance;
      particle.y = centerY + Math.sin(particle.angle) * currentDistance;
      particle.history.push({ x: particle.x, y: particle.y });

      if (particle.history.length > particle.historyLimit) {
        particle.history.shift();
      }
    }

    function drawParticle(particle: Particle) {
      if (particle.history.length < 2) return;

      drawingContext.beginPath();
      drawingContext.moveTo(particle.history[0].x, particle.history[0].y);
      for (let i = 1; i < particle.history.length; i += 1) {
        drawingContext.lineTo(particle.history[i].x, particle.history[i].y);
      }
      drawingContext.strokeStyle = `rgba(78, 222, 163, ${particle.opacity * 0.75})`;
      drawingContext.lineWidth = particle.size;
      drawingContext.stroke();

      drawingContext.beginPath();
      drawingContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      drawingContext.fillStyle = `rgba(78, 222, 163, ${Math.min(particle.opacity * 1.15, 0.55)})`;
      drawingContext.fill();
    }

    function updatePulse(pulse: Pulse) {
      pulse.angle += pulse.speed;
      pulse.life -= pulse.decay;
      pulse.x = centerX + Math.cos(pulse.angle) * pulse.distance;
      pulse.y = centerY + Math.sin(pulse.angle) * pulse.distance;
      return pulse.life > 0;
    }

    function drawPulse(pulse: Pulse) {
      const gradient = drawingContext.createRadialGradient(pulse.x, pulse.y, 0, pulse.x, pulse.y, 25);
      gradient.addColorStop(0, `rgba(111, 251, 190, ${pulse.life * 0.8})`);
      gradient.addColorStop(1, "rgba(111, 251, 190, 0)");

      drawingContext.fillStyle = gradient;
      drawingContext.beginPath();
      drawingContext.arc(pulse.x, pulse.y, 25, 0, Math.PI * 2);
      drawingContext.fill();

      drawingContext.beginPath();
      drawingContext.arc(pulse.x, pulse.y, 2, 0, Math.PI * 2);
      drawingContext.fillStyle = `rgba(255, 255, 255, ${pulse.life})`;
      drawingContext.fill();
    }

    function drawFrame() {
      drawingContext.clearRect(0, 0, width, height);
      drawPoolRing();

      particles.forEach((particle) => {
        updateParticle(particle);
        drawParticle(particle);
      });

      pulses = pulses.filter((pulse) => {
        const alive = updatePulse(pulse);
        if (alive) drawPulse(pulse);
        return alive;
      });
    }

    function animate() {
      if (Math.random() < 0.03) {
        pulses.push(createPulse());
      }
      drawFrame();
      animationFrame = requestAnimationFrame(animate);
    }

    init();
    drawFrame();
    animate();
    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-on-background selection:bg-primary selection:text-on-primary">
      <header className="fixed right-0 top-0 z-40 flex h-14 w-full items-center justify-center bg-surface/60 px-margin-mobile backdrop-blur-md md:h-16 md:justify-end md:px-margin-desktop">
        <div className="flex items-center gap-6">
          <button className="cursor-pointer rounded-lg bg-primary px-4 py-2 font-label-md text-[11px] text-on-primary transition-transform hover:scale-105 active:opacity-80 md:px-6 md:text-label-md">
            X Layer Mainnet
          </button>
        </div>
      </header>

      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-10 pt-20 md:px-0 md:pb-0 md:pt-16">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <div className="orb-glow absolute h-[800px] w-[800px] rounded-full opacity-40" />
          <canvas ref={canvasRef} className="h-full w-full" id="liquidity-currents-canvas" />
        </div>

        <div className="relative z-10 w-full max-w-4xl px-0 text-center md:px-gutter">
          <h1 className="mx-auto mb-5 max-w-[680px] font-display-lg text-[44px] leading-[1.02] tracking-normal text-on-background sm:text-[52px] md:max-w-none md:text-[64px]">
            Protect liquidity with adaptive <span className="text-primary">Uniswap v4</span> hooks
          </h1>

          <p className="mx-auto mb-8 max-w-2xl font-body-lg text-base leading-7 text-on-surface-variant md:mb-10 md:text-body-lg">
            HookFlow lets LPs launch X Layer pools with adaptive fees, size-aware pricing, and toxic-flow protection.
            Choose a safe preset, add liquidity, and let risky flow pay more.
          </p>

          <div className="mx-auto flex max-w-md flex-col items-stretch justify-center gap-3 md:max-w-none md:flex-row md:items-center md:gap-4">
            <Link
              className="group flex w-full items-center justify-center gap-2 rounded-none bg-primary px-8 py-4 font-label-md text-label-md text-on-primary transition-all hover:shadow-[0_0_20px_rgba(78,222,163,0.3)] md:w-auto md:px-10"
              href="/dashboard"
            >
              Dashboard
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>

            <Link
              className="flex w-full items-center justify-center gap-2 rounded-none border border-primary/40 px-8 py-4 font-label-md text-label-md text-primary transition-all hover:bg-primary/5 md:w-auto md:px-10"
              href="/create"
            >
              Create Pool
              <span className="material-symbols-outlined">add</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
