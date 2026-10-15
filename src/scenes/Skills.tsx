import React, { useEffect, useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';

interface OrbitChip {
  skill: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
}

const SKILLS_LIST = PORTFOLIO_DATA.skills;
const N = SKILLS_LIST.length;

// Compute base Fibonacci sphere points
const SPHERE_POINTS = Array.from({ length: N }).map((_, i) => {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
  return {
    x0: Math.sin(phi) * Math.cos(theta),
    y0: Math.cos(phi),
    z0: Math.sin(phi) * Math.sin(theta),
  };
});

function calculateOrbitChips(
  time: number,
  scrollP: number,
  mouseX: number,
  mouseY: number,
  vw: number,
  vh: number
): { backChips: OrbitChip[]; frontChips: OrbitChip[] } {
  const isMobile = vw < 820;
  const R = isMobile ? Math.min(vw * 0.36, vh * 0.24) : Math.min(vw * 0.27, vh * 0.46);
  const angleY = time * 0.0008 + scrollP * 5 + mouseX * 0.35;
  const tilt = -0.28 + mouseY * 0.15;

  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);
  const cosX = Math.cos(tilt);
  const sinX = Math.sin(tilt);

  // Person center on stage for skills scene is around x=0.50, y=0.50 (adjusted for mobile)
  const cx = vw * 0.50;
  const cy = isMobile ? vh * 0.56 : vh * 0.50;

  const backChips: OrbitChip[] = [];
  const frontChips: OrbitChip[] = [];

  for (let i = 0; i < N; i++) {
    const pt = SPHERE_POINTS[i];

    // Rotate around Y
    const x1 = pt.x0 * cosY + pt.z0 * sinY;
    const z1 = -pt.x0 * sinY + pt.z0 * cosY;

    // Rotate around X (tilt) and squash Y by 0.78
    const y2 = pt.y0 * 0.78 * cosX - z1 * sinX;
    const z2 = pt.y0 * 0.78 * sinX + z1 * cosX;

    const screenX = cx + x1 * R;
    const screenY = cy + y2 * R;

    // Perspective scale and depth
    const scale = 0.8 + (z2 + 1) * 0.25;
    const opacity = z2 < 0 ? 0.35 + (z2 + 1) * 0.35 : 0.85 + (z2 * 0.15);

    const chipData: OrbitChip = {
      skill: SKILLS_LIST[i],
      x: screenX,
      y: screenY,
      z: z2 * R,
      scale,
      opacity,
    };

    if (z2 < 0) {
      backChips.push(chipData);
    } else {
      frontChips.push(chipData);
    }
  }

  return { backChips, frontChips };
}

// Global state shared for back and front layers without triggering scroll re-renders
let latestChips = { backChips: [] as OrbitChip[], frontChips: [] as OrbitChip[], vis: 0 };
const orbitListeners = new Set<() => void>();

export const SkillsBack: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    orbitListeners.add(listener);
    return () => {
      orbitListeners.delete(listener);
    };
  }, []);

  if (latestChips.vis <= 0.01) return null;

  return (
    <div
      className="skills-orbit-back-container"
      style={{ opacity: latestChips.vis }}
    >
      {latestChips.backChips.map((chip, idx) => (
        <div
          key={idx}
          className="skills-chip-back"
          style={{
            transform: `translate3d(${chip.x}px, ${chip.y}px, 0) translate(-50%, -50%) scale(${chip.scale})`,
            opacity: chip.opacity,
          }}
        >
          {chip.skill}
        </div>
      ))}
    </div>
  );
};

export const SkillsFrontLayer: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    orbitListeners.add(listener);
    return () => {
      orbitListeners.delete(listener);
    };
  }, []);

  if (latestChips.vis <= 0.01) return null;

  return (
    <div
      className="skills-orbit-front-container"
      style={{ opacity: latestChips.vis }}
    >
      {latestChips.frontChips.map((chip, idx) => (
        <div
          key={idx}
          className="skills-chip-front"
          style={{
            transform: `translate3d(${chip.x}px, ${chip.y}px, 0) translate(-50%, -50%) scale(${chip.scale})`,
            opacity: chip.opacity,
          }}
        >
          {chip.skill}
        </div>
      ))}
    </div>
  );
};

export const SkillsSection: React.FC = () => {
  const sectionRef = useRegisterSection('skills');
  const innerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const scrollPRef = useRef(0);
  const visRef = useRef(0);

  useSceneMetrics('skills', (metrics) => {
    if (!innerRef.current) return;
    const { p, vis, exit } = metrics;
    scrollPRef.current = p;
    visRef.current = vis;

    const opacity = Math.max(0, 1 - exit * 2.4);
    innerRef.current.style.opacity = `${opacity}`;

    // Marquee moving with scroll
    if (marqueeRef.current) {
      const shift = (p * -400) % 50;
      marqueeRef.current.style.transform = `rotate(-2deg) translate3d(${shift}%, 0, 0)`;
    }
  });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePosRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let rafId = 0;
    const animate = (time: number) => {
      if (visRef.current > 0.01) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const { backChips, frontChips } = calculateOrbitChips(
          time,
          scrollPRef.current,
          mousePosRef.current.x,
          mousePosRef.current.y,
          vw,
          vh
        );
        latestChips = { backChips, frontChips, vis: visRef.current };
        for (const l of orbitListeners) l();
      } else if (latestChips.vis > 0) {
        latestChips.vis = 0;
        for (const l of orbitListeners) l();
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const marqueeContent = Array.from({ length: 4 })
    .map(() => SKILLS_LIST.join(' ✦ '))
    .join(' ✦ ');

  return (
    <section ref={sectionRef} id="skills" className="scene-section skills-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner skills-inner">
          {/* Top-Left Header */}
          <div className="skills-header">
            <div className="section-label">
              <span className="section-num">(04)</span> — TOOLKIT
            </div>
            <h2 className="skills-title">
              <div>EVERYTHING</div>
              <div className="skills-title-red">IN ORBIT.</div>
            </h2>
          </div>

          {/* Bottom Red Marquee Tape (10vh high, rotated -2 deg) */}
          <div className="skills-marquee-wrap">
            <div ref={marqueeRef} className="skills-marquee-tape">
              <span className="skills-marquee-text">{marqueeContent}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
