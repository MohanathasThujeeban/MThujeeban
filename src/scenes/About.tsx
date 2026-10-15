import React, { useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';
import { TiltCard } from '../components/TiltCard';
import { Odometer } from '../components/Odometer';

export const AboutBack: React.FC = () => {
  const backRef = useRef<HTMLDivElement>(null);

  useSceneMetrics('about', (metrics) => {
    if (!backRef.current) return;
    const { enter, exit } = metrics;
    // Fades and slides in on enter, fades out on exit
    const opacity = Math.min(enter * 1.5, Math.max(0, 1 - exit * 2.4));
    const xSlide = (1 - enter) * -80;
    backRef.current.style.opacity = `${opacity}`;
    backRef.current.style.transform = `translate3d(${xSlide}px, 0, 0)`;
  });

  return (
    <div ref={backRef} className="about-back-wrapper">
      <div className="about-red-shade" />
    </div>
  );
};

export const AboutSection: React.FC = () => {
  const sectionRef = useRegisterSection('about');
  const innerRef = useRef<HTMLDivElement>(null);
  const wordSpansRef = useRef<HTMLSpanElement[]>([]);
  const [scrollP, setScrollP] = useState(0);

  const manifestoWords = React.useMemo(() => {
    return PORTFOLIO_DATA.profile.manifesto.split(' ');
  }, []);

  const redKeywords = new Set(['high-level', 'architecture', 'emotion.', 'high-throughput', 'visceral', 'permanent']);

  useSceneMetrics('about', (metrics) => {
    if (!innerRef.current) return;
    const { p, exit } = metrics;
    const opacity = Math.max(0, 1 - exit * 2.4);
    const yShift = exit * -40;
    innerRef.current.style.opacity = `${opacity}`;
    innerRef.current.style.transform = `translate3d(0, ${yShift}px, 0)`;

    // Word by word reveal with scroll: opacity .1->1, translateY .25em->0, blur 4px->0
    const totalWords = wordSpansRef.current.length;
    for (let i = 0; i < totalWords; i++) {
      const el = wordSpansRef.current[i];
      if (el) {
        // Active window for each word
        const start = (i / totalWords) * 0.7;
        const end = start + 0.15;
        const wordP = Math.min(1, Math.max(0, (p - start) / (end - start)));

        const wordOpacity = 0.1 + 0.9 * wordP;
        const wordY = (1 - wordP) * 0.25; // em
        const wordBlur = (1 - wordP) * 4; // px

        el.style.opacity = `${wordOpacity}`;
        el.style.transform = `translate3d(0, ${wordY}em, 0)`;
        el.style.filter = wordBlur > 0.05 ? `blur(${wordBlur.toFixed(1)}px)` : 'none';
      }
    }

    setScrollP(p);
  });

  return (
    <section ref={sectionRef} id="about" className="scene-section about-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner about-inner">
          <div className="about-front-column">
            {/* Section label (0N) — Name */}
            <div className="section-label">
              <span className="section-num">(01)</span> — ABOUT ME
            </div>

            {/* Manifesto paragraph */}
            <p className="about-manifesto">
              {manifestoWords.map((word, i) => {
                const cleanWord = word.toLowerCase().replace(/[^a-z-]/g, '');
                const isRed = redKeywords.has(word) || redKeywords.has(cleanWord);
                return (
                  <span
                    key={i}
                    ref={(el) => {
                      if (el) wordSpansRef.current[i] = el;
                    }}
                    className={`about-word ${isRed ? 'about-word-red' : ''}`}
                  >
                    {word}{' '}
                  </span>
                );
              })}
            </p>

            {/* Three Glass Stat Cards with Odometers */}
            <div className="about-stats-grid">
              {PORTFOLIO_DATA.stats.map((stat, idx) => {
                const cardP = Math.min(1, Math.max(0, (scrollP - 0.2) / 0.65));
                return (
                  <TiltCard key={idx} className="about-stat-tilt">
                    <div className="about-stat-label">{stat.label}</div>
                    <div className="about-stat-value-row">
                      <Odometer
                        value={stat.value}
                        decimals={stat.decimals || 0}
                        progress={cardP}
                        className="about-odometer"
                      />
                      {stat.suffix && <span className="about-stat-suffix">{stat.suffix}</span>}
                    </div>
                    <div className="about-stat-detail">{stat.detail}</div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
