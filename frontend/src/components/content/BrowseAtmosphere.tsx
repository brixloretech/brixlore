"use client";

import { useEffect, useRef } from "react";

type Fold = { x: number; width: number; speed: number; phase: number; strength: number };

export function BrowseAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const folds: Fold[] = Array.from({ length: 9 }, (_, index) => ({
      x: 0.08 + index * 0.105,
      width: 0.12 + (index % 3) * 0.035,
      speed: 0.00006 + (index % 4) * 0.000012,
      phase: index * 0.82,
      strength: 0.11 + (index % 3) * 0.035,
    }));
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#020203";
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "screen";

      folds.forEach((fold, index) => {
        const drift = reduceMotion.matches ? 0 : Math.sin(time * fold.speed + fold.phase) * width * 0.045;
        const center = fold.x * width + drift;
        const bandWidth = fold.width * width;
        const gradient = context.createLinearGradient(center - bandWidth, 0, center + bandWidth, 0);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.42, `rgba(165,174,196,${fold.strength * 0.28})`);
        gradient.addColorStop(0.52, `rgba(235,239,247,${fold.strength})`);
        gradient.addColorStop(0.64, `rgba(102,114,139,${fold.strength * 0.36})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(center - bandWidth, 0);
        context.bezierCurveTo(center - bandWidth * 0.2, height * 0.26, center - bandWidth * (index % 2 ? 0.5 : -0.12), height * 0.62, center - bandWidth * 0.72, height);
        context.lineTo(center + bandWidth * 0.72, height);
        context.bezierCurveTo(center + bandWidth * 0.18, height * 0.66, center + bandWidth * (index % 2 ? -0.08 : 0.42), height * 0.25, center + bandWidth, 0);
        context.closePath();
        context.fill();
      });

      const bloom = context.createRadialGradient(width * 0.82, height * 0.95, 0, width * 0.82, height * 0.95, Math.max(width, height) * 0.58);
      bloom.addColorStop(0, "rgba(218,224,236,0.24)");
      bloom.addColorStop(0.3, "rgba(110,122,148,0.1)");
      bloom.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = bloom;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      if (!reduceMotion.matches) frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    const handleMotionChange = () => {
      cancelAnimationFrame(frame);
      draw();
    };
    reduceMotion.addEventListener("change", handleMotionChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      reduceMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
