import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { director, SCENES, type DirectorState } from '../engine/director';
import { frameLoader } from '../engine/frames';
import { PORTFOLIO_DATA } from '../data';

interface ChromeProps {
  onIntroComplete?: () => void;
}

export const Chrome: React.FC<ChromeProps> = ({ onIntroComplete }) => {
  const [loadPercent, setLoadPercent] = useState(0);
  const [preloaderFinished, setPreloaderFinished] = useState(false);
  const [isContactWhite, setIsContactWhite] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState('hero');
  const [overallProgress, setOverallProgress] = useState(0);

  // Preloader refs
  const preloaderTopRef = useRef<HTMLDivElement>(null);
  const preloaderBottomRef = useRef<HTMLDivElement>(null);
  const preloaderCounterRef = useRef<HTMLDivElement>(null);
  const preloaderLinesRef = useRef<HTMLDivElement>(null);

  // Custom cursor refs
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const cursorState = useRef({
    x: -100,
    y: -100,
    ringX: -100,
    ringY: -100,
    label: '',
    isHovered: false,
  });

  // Handle frame preloader progress
  useEffect(() => {
    let currentTweenVal = { val: 0 };

    const unsubscribe = frameLoader.onProgress((rawProgress, ready) => {
      gsap.to(currentTweenVal, {
        val: rawProgress,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: () => {
          setLoadPercent(Math.round(currentTweenVal.val));
        },
      });

      if (ready && !preloaderFinished) {
        // Wait a split second, then finish preloader
        setTimeout(() => {
          finishPreloader();
        }, 500);
      }
    });

    const finishPreloader = () => {
      if (preloaderFinished) return;
      setPreloaderFinished(true);

      const tl = gsap.timeline({
        onComplete: () => {
          director.start();
          onIntroComplete?.();
        },
      });

      // Lines slide up
      tl.to(preloaderLinesRef.current, {
        y: -40,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.in',
      });

      // Counter fades out
      tl.to(
        preloaderCounterRef.current,
        {
          scale: 0.9,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
        },
        '-=0.4'
      );

      // Halves split apart using expo.inOut over 1.2s
      tl.to(
        preloaderTopRef.current,
        {
          yPercent: -100,
          duration: 1.2,
          ease: 'expo.inOut',
        },
        '-=0.2'
      );

      tl.to(
        preloaderBottomRef.current,
        {
          yPercent: 100,
          duration: 1.2,
          ease: 'expo.inOut',
        },
        '<'
      );
    };

    return () => {
      unsubscribe();
    };
  }, [preloaderFinished, onIntroComplete]);

  // Subscribe to director for HUD updates
  useEffect(() => {
    return director.subscribe((state: DirectorState) => {
      setActiveSceneId(state.activeSceneId);
      setOverallProgress(Math.round(state.progress * 100));

      // On Contact, only after blade passes t > 0.6, HUD turns white
      if (state.activeSceneId === 'contact') {
        if (state.transition && state.transition.isContactEntering) {
          setIsContactWhite(state.transition.t > 0.6);
        } else {
          setIsContactWhite(true);
        }
      } else {
        setIsContactWhite(false);
      }
    });
  }, []);

  // Desktop custom cursor setup
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 820) return;

    let animId = 0;

    const onMouseMove = (e: MouseEvent) => {
      cursorState.current.x = e.clientX;
      cursorState.current.y = e.clientY;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
      }

      // Check for [data-cursor]
      const target = (e.target as HTMLElement).closest('[data-cursor]');
      if (target) {
        const label = target.getAttribute('data-cursor') || '';
        cursorState.current.isHovered = true;
        cursorState.current.label = label;
      } else {
        cursorState.current.isHovered = false;
        cursorState.current.label = '';
      }
    };

    const renderCursor = () => {
      const s = cursorState.current;
      // Lerp ring behind at 0.16
      s.ringX += (s.x - s.ringX) * 0.16;
      s.ringY += (s.y - s.ringY) * 0.16;

      if (cursorRingRef.current) {
        const radius = s.isHovered ? 46 : 21;
        cursorRingRef.current.style.transform = `translate3d(${s.ringX - radius}px, ${s.ringY - radius}px, 0)`;
        cursorRingRef.current.className = `cursor-ring ${s.isHovered ? 'cursor-ring-hovered' : ''}`;
      }

      if (cursorLabelRef.current) {
        cursorLabelRef.current.textContent = s.label;
      }

      animId = requestAnimationFrame(renderCursor);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    animId = requestAnimationFrame(renderCursor);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      {/* PRELOADER */}
      <div className={`preloader-root ${preloaderFinished ? 'preloader-done' : ''}`}>
        <div ref={preloaderTopRef} className="preloader-half preloader-top" />
        <div ref={preloaderBottomRef} className="preloader-half preloader-bottom" />

        <div className="preloader-content">
          <div ref={preloaderLinesRef} className="preloader-mono-line">
            SYSTEM INITIALIZING — {PORTFOLIO_DATA.profile.fullName}
          </div>

          <div ref={preloaderCounterRef} className="preloader-counter">
            {String(loadPercent).padStart(3, '0')}
          </div>

          <div className="preloader-mono-line preloader-mono-bottom">
            PORTFOLIO ENGINE V2.6 // SCROLL TO NAVIGATE
          </div>
        </div>
      </div>

      {/* HUD HEADER */}
      <header className={`hud-header ${isContactWhite ? 'hud-white' : ''}`}>
        {/* Left: First name in Anton 28px with red (R) */}
        <div
          className="hud-logo"
          onClick={() => director.scrollToTop()}
          data-cursor="Top"
        >
          <span className="hud-logo-text">{PORTFOLIO_DATA.profile.firstName}</span>
          <span className="hud-logo-registered">®</span>
        </div>

        {/* Right: Pill nav showing scene labels */}
        <nav className="hud-pill-nav">
          {SCENES.map((sc) => {
            const isActive = activeSceneId === sc.id;
            return (
              <button
                key={sc.id}
                className={`hud-nav-item ${isActive ? 'hud-nav-active' : ''}`}
                onClick={() => director.scrollToScene(sc.id)}
                data-cursor="Go"
              >
                {sc.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* HUD FOOTER / PROGRESS RAIL */}
      <aside className={`hud-rail-wrapper ${isContactWhite ? 'hud-white' : ''}`}>
        <div className="hud-progress-text">{String(overallProgress).padStart(2, '0')}%</div>
        <div className="hud-rail-track">
          <div
            className="hud-rail-bar"
            style={{ height: `${overallProgress}%` }}
          />
        </div>
      </aside>

      {/* DESKTOP CURSOR */}
      <div ref={cursorDotRef} className="cursor-dot" />
      <div ref={cursorRingRef} className="cursor-ring">
        <span ref={cursorLabelRef} className="cursor-label" />
      </div>
    </>
  );
};

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'red' | 'outline';
  className?: string;
  cursorLabel?: string;
  href?: string;
  download?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  variant = 'red',
  className = '',
  cursorLabel = 'Go',
  href,
  download = false,
}) => {
  const btnRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const xTo = useRef<gsap.QuickToFunc | null>(null);
  const yTo = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    const el = btnRef.current;
    if (!el || window.innerWidth < 820) return;

    // Button magnetic motion using gsap quickTo, elastic, strength 0.35
    xTo.current = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
    yTo.current = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.35;
      const dy = (e.clientY - cy) * 0.35;

      xTo.current?.(dx);
      yTo.current?.(dy);
    };

    const onMouseLeave = () => {
      xTo.current?.(0);
      yTo.current?.(0);
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  const content = (
    <div className="btn-roll-wrap">
      <span className="btn-roll-text">{children}</span>
      <span className="btn-roll-text btn-roll-clone">{children}</span>
    </div>
  );

  const classes = `magnetic-btn magnetic-btn-${variant} ${className}`;

  if (href) {
    return (
      <a
        ref={btnRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        download={download}
        target={download ? undefined : '_blank'}
        rel="noopener noreferrer"
        className={classes}
        data-cursor={cursorLabel}
        onClick={onClick}
      >
        <span className="btn-fill" />
        {content}
      </a>
    );
  }

  return (
    <button
      ref={btnRef as React.RefObject<HTMLButtonElement>}
      type="button"
      className={classes}
      onClick={onClick}
      data-cursor={cursorLabel}
    >
      <span className="btn-fill" />
      {content}
    </button>
  );
};
