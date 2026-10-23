import { useEffect, useRef } from 'react';
import './Radar.css';

interface RadarProps {
  color?: string;
  targets?: number;
  ringCount?: number;
  speed?: number;
  className?: string;
}

interface RadarContact {
  angle: number;
  radius: number;
  phase: number;
}

const contacts: RadarContact[] = [
  { angle: 0.42, radius: 0.54, phase: 0.2 },
  { angle: 1.78, radius: 0.76, phase: 1.7 },
  { angle: 2.86, radius: 0.37, phase: 2.4 },
  { angle: 4.12, radius: 0.66, phase: 3.1 },
  { angle: 5.2, radius: 0.48, phase: 4.4 },
  { angle: 5.72, radius: 0.82, phase: 5.1 }
];

export default function Radar({
  color = '#3ef09a',
  targets = 6,
  ringCount = 5,
  speed = 1,
  className = ''
}: RadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let sweep = -Math.PI / 2;
    let last = performance.now();
    let width = 1;
    let height = 1;
    let dpr = 1;
    const pointer = { x: 0.5, y: 0.5, active: false };

    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const draw = (now: number) => {
      const delta = Math.min(50, now - last) / 1000;
      last = now;
      const centerX = width * 0.5;
      const centerY = height * 0.52;
      const radius = Math.min(width, height) * 0.39;
      const pulse = (Math.sin(now / 500) + 1) / 2;
      if (!reducedMotion) sweep += delta * speed * 0.85;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(centerX, centerY);

      const glow = context.createRadialGradient(0, 0, 0, 0, 0, radius * 1.15);
      glow.addColorStop(0, `${color}1c`);
      glow.addColorStop(0.72, `${color}09`);
      glow.addColorStop(1, 'transparent');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = `${color}38`;
      context.lineWidth = 1;
      for (let index = 1; index <= ringCount; index += 1) {
        context.beginPath();
        context.arc(0, 0, (radius * index) / ringCount, 0, Math.PI * 2);
        context.stroke();
      }
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        context.strokeStyle = `${color}18`;
        context.stroke();
      }

      const sweepGradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      sweepGradient.addColorStop(0, `${color}00`);
      sweepGradient.addColorStop(0.78, `${color}10`);
      sweepGradient.addColorStop(1, `${color}35`);
      context.fillStyle = sweepGradient;
      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, radius, sweep - 0.5, sweep);
      context.closePath();
      context.fill();
      context.strokeStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(Math.cos(sweep) * radius, Math.sin(sweep) * radius);
      context.stroke();
      context.shadowBlur = 0;

      contacts.slice(0, Math.min(targets, contacts.length)).forEach((contact) => {
        const x = Math.cos(contact.angle) * radius * contact.radius;
        const y = Math.sin(contact.angle) * radius * contact.radius;
        const diff = Math.abs(Math.atan2(Math.sin(sweep - contact.angle), Math.cos(sweep - contact.angle)));
        const hit = Math.max(0, 1 - diff / 0.8);
        const size = 2.5 + hit * 3 + pulse * 0.8;
        context.fillStyle = color;
        context.shadowColor = color;
        context.shadowBlur = 8 + hit * 12;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
        if (hit > 0.2) {
          context.strokeStyle = `${color}${Math.round(hit * 150).toString(16).padStart(2, '0')}`;
          context.beginPath();
          context.arc(x, y, size + 7 + hit * 12, 0, Math.PI * 2);
          context.stroke();
        }
        context.shadowBlur = 0;
      });

      if (pointer.active) {
        const x = (pointer.x - 0.5) * width;
        const y = (pointer.y - 0.52) * height;
        context.fillStyle = `${color}cc`;
        context.beginPath();
        context.arc(x, y, 2, 0, Math.PI * 2);
        context.fill();
      }
      context.strokeStyle = `${color}88`;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);
    resize();
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [color, ringCount, speed, targets]);

  return <div ref={hostRef} className={`radar-container ${className}`} aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
