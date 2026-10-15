import React, { useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';

export const WorkBack: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useSceneMetrics('work', (metrics) => {
    if (!gridRef.current) return;
    const { p, enter, exit } = metrics;
    const opacity = Math.min(enter * 2, Math.max(0, 1 - exit * 2.4));
    // Lines move with scroll: translateY
    const gridShift = (p * 300) % 90;
    gridRef.current.style.opacity = `${opacity}`;
    gridRef.current.style.transform = `perspective(1000px) rotateX(68deg) translate3d(0, ${gridShift}px, 0)`;
  });

  return (
    <div className="work-back-wrapper">
      <div ref={gridRef} className="work-grid-floor" />
    </div>
  );
};

export const WorkSection: React.FC = () => {
  const sectionRef = useRegisterSection('work');
  const innerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const projects = PORTFOLIO_DATA.projects;
  const numCards = projects.length;

  useSceneMetrics('work', (metrics) => {
    if (!innerRef.current) return;
    const { p, enter, exit } = metrics;
    const opacity = Math.max(0, 1 - exit * 2.4);
    innerRef.current.style.opacity = `${opacity}`;

    // Deck entry from below
    if (deckRef.current) {
      const isMobile = window.innerWidth < 820;
      const enterProgress = Math.min(1, enter * 1.8);
      const entryY = (1 - enterProgress) * (isMobile ? 60 : 120);
      const entryRotY = (1 - enterProgress) * (isMobile ? -8 : -25);
      deckRef.current.style.transform = `perspective(1500px) translate3d(0, ${entryY}px, 0) rotateY(${entryRotY}deg)`;
    }

    // Scroll mapping with dwell on each card:
    // Scale p from 0..1 to 0..(numCards - 1) with dwells
    const rawVal = p * (numCards - 0.2);
    const iBase = Math.floor(rawVal);
    const frac = rawVal - iBase;
    // dwell: smooth transition between cards
    const smoothFrac = frac < 0.25 ? 0 : frac > 0.75 ? 1 : (frac - 0.25) / 0.5;
    const q = Math.min(numCards - 1, iBase + smoothFrac * smoothFrac * (3 - 2 * smoothFrac));

    const currentCard = Math.min(numCards - 1, Math.max(0, Math.round(q)));
    setActiveCardIndex(currentCard);

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = q - i; // relative distance

      if (d > 0.001) {
        // Leaving cards: z = d*900, y = -12d vh, rotateX = 28d, opacity = 1 - 1.8d
        const z = d * 900;
        const y = -12 * d; // vh
        const rotX = 28 * d; // deg
        const cardOp = Math.max(0, 1 - 1.8 * d);
        el.style.transform = `translate3d(0, ${y}vh, ${z}px) rotateX(${rotX}deg)`;
        el.style.opacity = `${cardOp}`;
        el.style.pointerEvents = cardOp > 0.5 ? 'auto' : 'none';
      } else if (d < -0.001) {
        // Upcoming cards: z = d*300, y = d*3.2 vh, fading
        const z = d * 300;
        const y = d * 3.2; // vh
        const cardOp = Math.max(0, 1 + d * 1.5);
        el.style.transform = `translate3d(0, ${y}vh, ${z}px) rotateX(0deg)`;
        el.style.opacity = `${cardOp}`;
        el.style.pointerEvents = cardOp > 0.5 ? 'auto' : 'none';
      } else {
        // Active card
        el.style.transform = 'translate3d(0, 0, 0) rotateX(0deg)';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      }
    });
  });

  return (
    <section ref={sectionRef} id="work" className="scene-section work-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner work-inner">
          {/* Header with label, counter 01 / 03, and 140px progress bar */}
          <div className="work-header">
            <div className="section-label">
              <span className="section-num">(02)</span> — FEATURED WORK
            </div>
            <div className="work-progress-cluster">
              <span className="work-counter-text">
                0{activeCardIndex + 1} <span className="work-counter-slash">/</span> 0{numCards}
              </span>
              <div className="work-progress-track">
                <div
                  className="work-progress-fill"
                  style={{ width: `${((activeCardIndex + 1) / numCards) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3D Deck */}
          <div ref={deckRef} className="work-deck">
            {projects.map((proj, idx) => (
              <div
                key={proj.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className="work-card"
              >
                {/* Left Side */}
                <div className="work-card-left">
                  <div className="work-card-tag-row">
                    <span className="work-card-number">{proj.number}</span>
                    <span className="work-card-category">{proj.category}</span>
                  </div>

                  <h3 className="work-card-title">{proj.name}</h3>
                  <p className="work-card-desc">{proj.description}</p>

                  <div className="work-card-chips">
                    {proj.chips.map((chip, cIdx) => (
                      <span key={cIdx} className="work-chip">
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="work-card-actions">
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="work-card-link"
                      data-cursor="Open"
                    >
                      View on GitHub ↗
                    </a>
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="work-card-link work-card-live"
                        data-cursor="Visit"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Side: Red visual panel with CSS mock */}
                <div className="work-card-right">
                  <div className="work-mock-panel">
                    {proj.mockType === 'heatmap' && (
                      <div className="mock-heatmap">
                        <div className="mock-title">MOH CLINIC TELEMETRY</div>
                        <div className="heatmap-grid">
                          {Array.from({ length: 35 }).map((_, i) => {
                            const active = (i * 7) % 5 === 0 || (i * 3) % 4 === 0;
                            return (
                              <div
                                key={i}
                                className={`heatmap-cell ${active ? 'cell-active' : ''}`}
                              />
                            );
                          })}
                        </div>
                        <div className="mock-badge">LIVE SYNC ACTIVE</div>
                      </div>
                    )}

                    {proj.mockType === 'gauge' && (
                      <div className="mock-gauge">
                        <div className="mock-title">ESIM NETWORK THROUGHPUT</div>
                        <div className="gauge-circle">
                          <div className="gauge-fill" />
                          <div className="gauge-center">
                            <span className="gauge-speed">99.8</span>
                            <span className="gauge-unit">% UPTIME</span>
                          </div>
                        </div>
                        <div className="mock-badge">NORWAY / EU GATEWAY</div>
                      </div>
                    )}

                    {proj.mockType === 'bubbles' && (
                      <div className="mock-security">
                        <div className="mock-title">SENTINEL BIOMETRIC FEED</div>
                        <div className="mock-face-box">
                          <div className="face-scan-line" />
                          <span className="face-tag">VERIFIED: OWNER [THUJEEBAN]</span>
                        </div>
                        <div className="mock-alert-bubble">
                          <span className="alert-dot" />
                          <span>SMTP INTRUDER DISPATCH: READY</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
