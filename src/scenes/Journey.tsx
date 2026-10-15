import React, { useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';

export const JourneyBack: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentYear, setCurrentYear] = useState('2017');

  useSceneMetrics('journey', (metrics) => {
    if (!containerRef.current) return;
    const { p, enter, exit } = metrics;
    const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
    containerRef.current.style.opacity = `${opacity}`;

    // Colossal outlined year rolling dynamically from 2017 to 2026
    const yr = Math.round(2017 + p * (2026 - 2017));
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
  const listRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [activeItem, setActiveItem] = useState(0);

  const journeyItems = PORTFOLIO_DATA.journey;

  useSceneMetrics('journey', (metrics) => {
    if (!innerRef.current) return;
    const { p, exit } = metrics;
    const opacity = Math.max(0, 1 - exit * 2.4);
    innerRef.current.style.opacity = `${opacity}`;

    // SVG path draws downwards from top (0) to bottom (1)
    if (pathRef.current) {
      const offset = Math.max(0, 1 - p * 1.08);
      pathRef.current.style.strokeDashoffset = `${offset}`;
    }

    // Active item index: chronological progression from 0 (2017) to 5 (2026 Epic Lanka)
    const total = journeyItems.length;
    const activeIdx = Math.min(total - 1, Math.max(0, Math.floor(p * total * 0.99)));
    setActiveItem(activeIdx);

    // Smooth window translation so the active card is always centered in view
    if (listRef.current) {
      const containerH = listRef.current.parentElement?.clientHeight || 480;
      const contentH = listRef.current.scrollHeight;
      if (contentH > containerH) {
        const maxScroll = contentH - containerH + 30;
        const translateY = -p * maxScroll;
        listRef.current.style.transform = `translateY(${translateY}px)`;
      } else {
        listRef.current.style.transform = 'none';
      }
    }
  });

  return (
    <section ref={sectionRef} id="journey" className="scene-section journey-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner journey-inner">
          <div className="journey-front-column">
            {/* Header: Label and Title */}
            <div className="journey-header-block">
              <div className="section-label">
                <span className="section-num">(03)</span> — TIMELINE & EXPERIENCE
              </div>

              <h2 className="journey-title">
                <div>LEARNING</div>
                <div className="journey-title-red">OUT LOUD.</div>
              </h2>
            </div>

            {/* Timeline Window */}
            <div className="journey-timeline-window">
              <div className="journey-timeline">
                {/* SVG drawing track */}
                <div className="journey-track-svg-wrap">
                  <svg className="journey-svg" viewBox="0 0 4 700" preserveAspectRatio="none">
                    {/* Background grey track */}
                    <line x1="2" y1="0" x2="2" y2="700" stroke="rgba(13,13,13,0.12)" strokeWidth="2" />
                    {/* Drawing red track from top down */}
                    <path
                      ref={pathRef}
                      d="M 2,0 L 2,700"
                      fill="none"
                      stroke="#ff1f1f"
                      strokeWidth="2.5"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1}
                    />
                  </svg>
                </div>

                {/* Items List */}
                <div ref={listRef} className="journey-items-list">
                  {journeyItems.map((item, idx) => {
                    const isActive = activeItem === idx;
                    return (
                      <div
                        key={idx}
                        className={`journey-item ${isActive ? 'journey-item-active' : ''}`}
                      >
                        <div className="journey-node-dot" />
                        <div className="journey-item-content">
                          <div className="journey-item-header">
                            <div className="journey-logo-box">
                              <img
                                src={item.logo}
                                alt={item.organization}
                                className="journey-logo-img"
                                loading="lazy"
                              />
                            </div>
                            <div className="journey-item-meta">
                              <div className="journey-item-badges">
                                <span className="journey-item-year">{item.year}</span>
                                {item.type && (
                                  <span className={`journey-type-badge journey-type-${item.type.toLowerCase()}`}>
                                    {item.type}
                                  </span>
                                )}
                              </div>
                              <h4 className="journey-item-title">{item.title}</h4>
                              <div className="journey-item-org">{item.organization}</div>
                            </div>
                          </div>
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
      </div>
    </section>
  );
};
