import React, { useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { useRegisterSection, useSceneMetrics } from '../engine/hooks';
import { director } from '../engine/director';

export const ContactBack: React.FC = () => {
  const backRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [clipPath, setClipPath] = useState<string>('none');
  const [isVisible, setIsVisible] = useState(false);

  useSceneMetrics('contact', (metrics, state) => {
    if (!backRef.current) return;
    const { enter, vis } = metrics;

    if (vis <= 0.001 && state.activeSceneId !== 'contact' && !state.transition?.isContactEntering) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Full red background revealed by the same blade:
    // e = -skew + (vw + 2*skew)*t, polygon(0 0, e+skew 0, e-skew 100%, 0 100%)
    if (state.transition && state.transition.isContactEntering) {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const t = state.transition.t;
      const skew = 0.2 * vh;
      const e = -skew + (vw + 2 * skew) * t;
      setClipPath(`polygon(0 0, ${e + skew}px 0, ${e - skew}px 100%, 0 100%)`);
    } else {
      setClipPath('none');
    }

    // Giant white "LET'S" / "TALK" fades and rises on enter
    if (titleRef.current) {
      const titleP = Math.min(1, enter * 1.5);
      const titleY = (1 - titleP) * 50;
      titleRef.current.style.opacity = `${titleP}`;
      titleRef.current.style.transform = `translate3d(0, ${titleY}px, 0)`;
    }
  });

  if (!isVisible) return null;

  return (
    <div
      ref={backRef}
      className="contact-back-wrapper"
      style={{ clipPath }}
    >
      <div className="contact-red-backdrop">
        <div ref={titleRef} className="contact-giant-title">
          <div className="giant-line">LET'S</div>
          <div className="giant-line">TALK</div>
        </div>
      </div>
    </div>
  );
};

export const ContactSection: React.FC = () => {
  const sectionRef = useRegisterSection('contact');
  const innerRef = useRef<HTMLDivElement>(null);

  useSceneMetrics('contact', (metrics) => {
    if (!innerRef.current) return;
    const { enter } = metrics;
    // Fades and translates in
    const opacity = Math.min(1, enter * 1.6);
    const yShift = (1 - opacity) * 30;
    innerRef.current.style.opacity = `${opacity}`;
    innerRef.current.style.transform = `translate3d(0, ${yShift}px, 0)`;
  });

  const { emailUser, emailDomain, github, linkedin, resumePdf, copyrightYear, fullName } = PORTFOLIO_DATA.profile;

  return (
    <section ref={sectionRef} id="contact" className="scene-section contact-section">
      <div className="scene-sticky">
        <div ref={innerRef} className="scene-inner contact-inner">
          <div className="contact-front-layout">
            {/* Top label */}
            <div className="contact-top-row">
              <div className="section-label contact-label">
                <span className="section-num">(06)</span> — GET IN TOUCH
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="contact-bottom-area">
              {/* Bottom-Left: Email */}
              <div className="contact-email-block">
                <a
                  href={`mailto:${emailUser}@${emailDomain}`}
                  className="contact-email-link"
                  data-cursor="Write"
                >
                  <span className="email-line-user">{emailUser}</span>
                  <span className="email-line-domain">@{emailDomain}</span>
                  <span className="email-underline-wipe" />
                </a>
              </div>

              {/* Bottom-Right: Stacked list of links */}
              <div className="contact-links-list">
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link-item"
                  data-cursor="Open"
                >
                  <span className="contact-link-label">GITHUB</span>
                  <span className="contact-link-icon">↗</span>
                </a>

                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link-item"
                  data-cursor="Open"
                >
                  <span className="contact-link-label">LINKEDIN</span>
                  <span className="contact-link-icon">↗</span>
                </a>

                <a
                  href={resumePdf}
                  download={true}
                  className="contact-link-item"
                  data-cursor="PDF"
                >
                  <span className="contact-link-label">RÉSUMÉ</span>
                  <span className="contact-link-icon">↗</span>
                </a>
              </div>
            </div>

            {/* Footer */}
            <footer className="contact-footer">
              <div className="contact-copy">
                © {copyrightYear} {fullName}. ALL RIGHTS RESERVED.
              </div>
              <button
                type="button"
                className="back-to-top-btn"
                onClick={() => director.scrollToTop()}
                data-cursor="Top"
              >
                Back to top ↑
              </button>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
};
