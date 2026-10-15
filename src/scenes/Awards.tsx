import React, { useRef } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';

export const AwardsSection: React.FC = () => {
  const sectionRef = useRegisterSection('awards');
  const innerRef = useRef<HTMLDivElement>(null);
  const counterCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cylinderRef = useRef<HTMLDivElement>(null);

  const awardStats = PORTFOLIO_DATA.awards;
  const certs = PORTFOLIO_DATA.certifications;
  const N = certs.length;

  useSceneMetrics('awards', (metrics) => {
    if (!innerRef.current) return;
    const { p, enter, exit } = metrics;
    const opacity = Math.max(0, 1 - exit * 2.4);
    innerRef.current.style.opacity = `${opacity}`;

    // Flip-in counter cards: rotateX -100deg -> 0, staggered
    counterCardsRef.current.forEach((el, idx) => {
      if (!el) return;
      const staggerDelay = idx * 0.12;
      const cardP = Math.min(1, Math.max(0, (enter * 1.5 - staggerDelay) / 0.5));
      const rotX = (1 - cardP) * -100;
      el.style.transform = `perspective(800px) rotateX(${rotX}deg)`;
      el.style.opacity = `${cardP}`;
    });

    // 3D Certifications Cylinder
    // Container at translateZ(-360px) rotateX(-14deg) rotateY(-p * (360 - 360/N))
    if (cylinderRef.current) {
      const rotY = -p * (360 - 360 / N);
      cylinderRef.current.style.transform = `translateZ(-360px) rotateX(-14deg) rotateY(${rotY}deg)`;
    }
  });

  return (
    <section ref={sectionRef} id="awards" className="scene-section awards-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner awards-inner">
          <div className="awards-front-column">
            {/* Header */}
            <div className="section-label">
              <span className="section-num">(05)</span> — RECOGNITION & CODING METRICS
            </div>

            <h2 className="awards-title">PROVEN EXCELLENCE.</h2>

            {/* Four Flip-In Counter Cards in a Row (alternating red / black) */}
            <div className="awards-counters-row">
              {awardStats.map((stat, idx) => {
                const isRed = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    ref={(el) => {
                      counterCardsRef.current[idx] = el;
                    }}
                    className={`award-stat-card ${isRed ? 'stat-card-red' : 'stat-card-black'}`}
                  >
                    <div className="stat-card-number-row">
                      <span className="stat-card-count">{stat.count}</span>
                      <span className="stat-card-suffix">{stat.suffix}</span>
                    </div>
                    <div className="stat-card-platform">{stat.platform}</div>
                    <div className="stat-card-detail">{stat.detail}</div>
                  </div>
                );
              })}
            </div>

            {/* 3D Certifications Cylinder */}
            <div className="cylinder-viewport">
              <div ref={cylinderRef} className="cylinder-container">
                {certs.map((cert, idx) => {
                  const angle = (360 / N) * idx;
                  const isRedCard = idx % 3 === 0;
                  return (
                    <div
                      key={cert.id}
                      className="cylinder-card-slot"
                      style={{
                        transform: `rotateY(${angle}deg) translateZ(360px)`,
                      }}
                    >
                      {/* Front face */}
                      <div className={`cylinder-card-face face-front ${isRedCard ? 'face-front-red' : 'face-front-white'}`}>
                        <div className="cert-top-row">
                          <span className="cert-issuer">{cert.issuer}</span>
                          <span className="cert-year">{cert.year}</span>
                        </div>
                        <h4 className="cert-title">{cert.title}</h4>
                        <div className="cert-seal">
                          <span className="cert-check">✓</span>
                          <span className="cert-verified">VERIFIED</span>
                        </div>
                      </div>

                      {/* Back face */}
                      <div className="cylinder-card-face face-back">
                        <div className="face-back-pattern">
                          <span>{cert.issuer}</span>
                          <span className="back-badge">OFFICIAL CREDENTIAL</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
