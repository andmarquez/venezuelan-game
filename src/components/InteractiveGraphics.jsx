import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const MAX_PARTICLES = 90;
const MAX_RIPPLES = 8;
const MAX_RINGS = 5;
const BAR_COUNT = 40;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function spawnParticle(pool, width, height, bass, glow, burst = false) {
  const angle = Math.random() * Math.PI * 2;
  const speed = (burst ? 2.8 : 1.2) + bass * 4.5;
  const cx = width * (0.35 + Math.random() * 0.3);
  const cy = height * (0.38 + Math.random() * 0.18);

  pool.push({
    x: cx,
    y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: burst ? 1 : 0.55 + Math.random() * 0.35,
    size: burst ? 2.5 + bass * 4 : 1 + Math.random() * 2.5,
    glow,
  });
}

const InteractiveGraphics = forwardRef(function InteractiveGraphics({ active, config }, ref) {
  const canvasRef = useRef(null);
  const configRef = useRef(config ?? {});
  const metricsRef = useRef({
    bass: 0,
    mid: 0,
    high: 0,
    beatFlash: 0,
    glow: '#ff183d',
    color: '#ffffff',
  });
  const particlesRef = useRef([]);
  const ripplesRef = useRef([]);
  const ringsRef = useRef([]);
  const barsRef = useRef(Array.from({ length: BAR_COUNT }, () => 0));
  const animationRef = useRef(null);

  useEffect(() => {
    configRef.current = config ?? {};
  }, [config]);

  useImperativeHandle(ref, () => ({
    setMetrics(metrics) {
      metricsRef.current = { ...metricsRef.current, ...metrics };
    },
    addRipple(x, y, strength = 1) {
      if (configRef.current.ripples === false) {
        return;
      }
      ripplesRef.current.push({ x, y, radius: 8, life: 1, strength });
      if (ripplesRef.current.length > MAX_RIPPLES) {
        ripplesRef.current.shift();
      }
    },
    pulseBeat() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const cfg = configRef.current;
      const { bass, glow } = metricsRef.current;
      const rect = canvas.getBoundingClientRect();
      const intensity = cfg.particles ?? 1;

      if (cfg.rings !== false) {
        ringsRef.current.push({
          x: rect.width * 0.5,
          y: rect.height * 0.42,
          radius: 20,
          life: 1,
          glow,
          width: 2 + bass * 3,
        });

        if (ringsRef.current.length > MAX_RINGS) {
          ringsRef.current.shift();
        }
      }

      const burstCount = Math.round(14 * intensity);
      for (let i = 0; i < burstCount; i += 1) {
        if (particlesRef.current.length < MAX_PARTICLES) {
          spawnParticle(particlesRef.current, rect.width, rect.height, bass, glow, true);
        }
      }
    },
    burst(x, y) {
      const { bass, glow } = metricsRef.current;
      const intensity = configRef.current.particles ?? 1;
      const burstCount = Math.round(24 * intensity);
      for (let i = 0; i < burstCount; i += 1) {
        if (particlesRef.current.length >= MAX_PARTICLES) {
          break;
        }
        const angle = (i / 24) * Math.PI * 2;
        const speed = 3 + bass * 5;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 2 + bass * 3,
          glow,
        });
      }
    },
  }));

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d', { alpha: true });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let lastSpawn = 0;

    const draw = (time) => {
      const parent = canvas.parentElement;
      if (!parent) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const { width, height } = parent.getBoundingClientRect();
      const { bass, mid, high, beatFlash, glow, color } = metricsRef.current;
      const cfg = configRef.current;
      const particleIntensity = cfg.particles ?? 1;
      const maxParticles = Math.round(MAX_PARTICLES * particleIntensity);

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.42;
      const orbitRadius = Math.min(width, height) * (0.28 + bass * 0.08);

      if (cfg.spectrum !== false) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.00035 + bass * 0.4);
        ctx.strokeStyle = `${glow}55`;
        ctx.lineWidth = 1 + bass * 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, orbitRadius, orbitRadius * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.rotate(1.2);
        ctx.strokeStyle = `${color}33`;
        ctx.beginPath();
        ctx.ellipse(0, 0, orbitRadius * 0.78, orbitRadius * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        for (let i = 0; i < BAR_COUNT; i += 1) {
          const target = 0.15 + bass * 0.55 + Math.sin(time * 0.004 + i * 0.45) * mid * 0.25 + high * 0.15;
          barsRef.current[i] = barsRef.current[i] * 0.72 + target * 0.28;
          const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
          const inner = orbitRadius * 0.55;
          const len = barsRef.current[i] * orbitRadius * 0.45;
          const x1 = cx + Math.cos(angle) * inner;
          const y1 = cy + Math.sin(angle) * inner;
          const x2 = cx + Math.cos(angle) * (inner + len);
          const y2 = cy + Math.sin(angle) * (inner + len);
          ctx.strokeStyle = i % 2 === 0 ? `${glow}${Math.round(60 + barsRef.current[i] * 120).toString(16).padStart(2, '0')}` : `${color}44`;
          ctx.lineWidth = 1.5 + beatFlash * 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      if (particleIntensity > 0 && time - lastSpawn > 120 - bass * 60) {
        lastSpawn = time;
        if (particlesRef.current.length < maxParticles - 2) {
          spawnParticle(particlesRef.current, width, height, bass, glow, false);
        }
      }

      if (particleIntensity > 0) {
        particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx * (0.8 + bass * 0.6);
        particle.y += particle.vy * (0.8 + bass * 0.6);
        particle.vy += 0.02;
        particle.life -= 0.012 + mid * 0.008;

        if (particle.life <= 0) {
          return false;
        }

        ctx.beginPath();
        ctx.fillStyle = `${particle.glow}${Math.round(particle.life * 200).toString(16).padStart(2, '0')}`;
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      } else {
        particlesRef.current = [];
      }

      if (cfg.rings !== false) {
        ringsRef.current = ringsRef.current.filter((ring) => {
        ring.radius += 2.5 + bass * 6 + beatFlash * 4;
        ring.life -= 0.018;

        if (ring.life <= 0) {
          return false;
        }

        ctx.beginPath();
        ctx.strokeStyle = `${ring.glow}${Math.round(ring.life * 180).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = ring.width * ring.life;
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      });
      } else {
        ringsRef.current = [];
      }

      if (cfg.ripples !== false) {
        ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += 3 + bass * 5;
        ripple.life -= 0.025;

        if (ripple.life <= 0) {
          return false;
        }

        ctx.beginPath();
        ctx.strokeStyle = `${glow}${Math.round(ripple.life * 160).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1.5 * ripple.strength;
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      });
      } else {
        ripplesRef.current = [];
      }

      if (beatFlash > 0.15 && cfg.spectrum !== false) {
        const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, orbitRadius * 1.2);
        gradient.addColorStop(0, `${glow}${Math.round(beatFlash * 90).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
      ripplesRef.current = [];
      ringsRef.current = [];
    };
  }, [active, config]);

  return (
    <canvas
      ref={canvasRef}
      className="interactive-canvas"
      aria-hidden="true"
    />
  );
});

export default InteractiveGraphics;
