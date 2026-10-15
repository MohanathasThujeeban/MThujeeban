import React, { useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';

export const JourneyBack: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentYear, setCurrentYear] = useState('2021');

  useSceneMetrics('journey', (metrics) => {
    if (!containerRef.current) return;
    const { p, enter, exit } = metrics;
    const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
    containerRef.current.style.opacity = `${opacity}`;

    // Colossal outlined year rolling from 2021 to 2026
    const yr = Math.round(2021 + p * (2026 - 2021));
    setCurrentYear(String(yr));
  });

  return (
    <div ref={containerRef} className="journey-back-wrapper">
      <div className="journey-colossal-year" data-year={currentYear}>
        {currentYear}
      </div>
    </div>
  );
};

export const JourneySection: React.FC = () => {
  const sectionRef = useRegisterSection('journey');
  const innerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const [activeItem, setActiveItem] = useState(0);

  const journeyItems = PORTFOLIO_DATA.journey;

  useSceneMetrics('journey', (metrics) => {
    if (!innerRef.current) return;
    const { p, exit } = metrics;
    const opacity = Math.max(0, 1 - exit * 2.4);
    innerRef.current.style.opacity = `${opacity}`;

    // SVG path draws from bottom up using pathLength=1 and strokeDashoffset
    if (pathRef.current) {
      // 1 at bottom, 0 at top
      const offset = Math.max(0, 1 - p * 1.1);
      pathRef.current.style.strokeDashoffset = `${offset}`;
    }

    // Active item index (newest at top, index 0 is 2026)
    const activeIdx = p > 0.65 ? 0 : p > 0.35 ? 1 : 2;
    setActiveItem(activeIdx);

    // Items reveal from bottom with rotateY -55deg -> 0
    itemsRef.current.forEach((el, idx) => {
      if (!el) return;
      // Invert indexing so bottom reveals first
      const orderFromBottom = journeyItems.length - 1 - idx;
      const revealStart = orderFromBottom * 0.25;
      const itemP = Math.min(1, Math.max(0, (p - revealStart) / 0.35));

      const rotY = (1 - itemP) * -55;
      const itemOp = itemP;
      el.style.transform = `perspective(1000px) rotateY(${rotY}deg)`;
      el.style.opacity = `${itemOp}`;
    });
  });

  return (
    <section ref={sectionRef} id="journey" className="scene-section journey-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner journey-inner">
          <div className="journey-front-column">
            {/* Label and title */}
            <div className="section-label">
              <span className="section-num">(03)</span> — TIMELINE
            </div>

            <h2 className="journey-title">
              <div>LEARNING</div>
              <div className="journey-title-red">OUT LOUD.</div>
            </h2>

            {/* Timeline */}
            <div className="journey-timeline">
              {/* SVG drawing track */}
              <div className="journey-track-svg-wrap">
                <svg className="journey-svg" viewBox="0 0 4 360" preserveAspectRatio="none">
                  {/* Background grey track */}
                  <line x1="2" y1="0" x2="2" y2="360" stroke="rgba(13,13,13,0.12)" strokeWidth="2" />
                  {/* Drawing red track from bottom up */}
                  <path
                    ref={pathRef}
                    d="M 2,360 L 2,0"
                    fill="none"
                    stroke="#ff1f1f"
                    strokeWidth="2"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1}
                  />
                </svg>
              </div>

              {/* Items */}
              <div className="journey-items-list">
                {journeyItems.map((item, idx) => {
                  const isActive = activeItem === idx;
                  return (
                    <div
                      key={idx}
                      ref={(el) => {
                        itemsRef.current[idx] = el;
                      }}
                      className={`journey-item ${isActive ? 'journey-item-active' : ''}`}
                    >
                      <div className="journey-node-dot" />
                      <div className="journey-item-content">
                        <span className="journey-item-year">{item.year}</span>
                        <h4 className="journey-item-title">{item.title}</h4>
                        <div className="journey-item-org">{item.organization}</div>
                        <p className="journey-item-desc">{item.description}</p>
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
