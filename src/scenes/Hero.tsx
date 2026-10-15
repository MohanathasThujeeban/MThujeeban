import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';
import { director } from '../engine/director';
import { MagneticButton } from '../components/Chrome';

export const HeroBack: React.FC = () => {
  return null;
};

export const HeroSection: React.FC = () => {
  const sectionRef = useRegisterSection('hero');
  const innerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  useSceneMetrics('hero', (metrics) => {
    if (!innerRef.current) return;
    const { p, exit } = metrics;
    // Fades and translates in on enter and fades out fast on exit: opacity x max(0, 1 - exit * 2.4)
    const opacity = Math.max(0, 1 - exit * 2.4);
    const yShift = exit * -50;
    innerRef.current.style.opacity = `${opacity}`;
    innerRef.current.style.transform = `translate3d(0, ${yShift}px, 0)`;

    // Red highlighter underline whose width grows with scroll progress, as if the person "reads" it
    if (underlineRef.current) {
      const w = Math.min(100, Math.max(0, p * 125));
      underlineRef.current.style.width = `${w}%`;
    }
  });

  useEffect(() => {
    // Masked title slides up on intro
    const lines = [line1Ref.current, line2Ref.current].filter(Boolean);
    gsap.fromTo(
      lines,
      { yPercent: 100, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 1.4,
        ease: 'expo.out',
        delay: 0.4,
      }
    );
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="scene-section hero-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner hero-inner">
          <div className="hero-front-content">
            <div className="hero-greeting">
              Hi, I'm <span className="hero-greeting-name">{PORTFOLIO_DATA.profile.fullName}</span> —
            </div>

            <h1 className="hero-title">
              <div className="hero-title-mask">
                <span ref={line1Ref} className="hero-title-line">
                  {PORTFOLIO_DATA.profile.roleLine1}
                </span>
              </div>
              <div className="hero-title-mask">
                <span ref={line2Ref} className="hero-title-line hero-title-red">
                  {PORTFOLIO_DATA.profile.roleLine2}
                </span>
              </div>
            </h1>

            <p className="hero-description">
              <span className="hero-description-text">
                {PORTFOLIO_DATA.profile.tagline}
                <span ref={underlineRef} className="hero-highlighter" />
              </span>
            </p>

            <div className="hero-cta-group">
              <MagneticButton
                variant="red"
                onClick={() => director.scrollToScene('work')}
                cursorLabel="Work"
              >
                See my work ↘
              </MagneticButton>

              <MagneticButton
                variant="outline"
                href="./resume.pdf"
                download={true}
                cursorLabel="PDF"
              >
                Download résumé
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
