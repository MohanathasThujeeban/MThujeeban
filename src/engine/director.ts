import Lenis from 'lenis';
import gsap from 'gsap';

export interface SceneConfig {
  id: string;
  label: string;
  from: number;
  to: number;
  x: number;
  k: number;
  heightVh: number;
}

export interface SceneMetrics {
  enter: number;
  p: number;
  exit: number;
  vis: number;
}

export interface DirectorState {
  scrollY: number;
  progress: number; // 0..1 overall
  activeSceneId: string;
  activeSceneIndex: number;
  frame: number;
  // Blade transition info:
  transition?: {
    fromScene: SceneConfig;
    toScene: SceneConfig;
    fromFrame: number;
    toFrame: number;
    t: number; // 0..1
    isContactEntering: boolean;
  };
  scenesMetrics: Record<string, SceneMetrics>;
}

export type DirectorSubscriber = (state: DirectorState) => void;

export const SCENES: SceneConfig[] = [
  { id: 'hero', label: 'Hello', from: 0, to: 57, x: 0.70, k: 1.0, heightVh: 230 },
  { id: 'about', label: 'About', from: 58, to: 95, x: 0.27, k: 1.0, heightVh: 280 },
  { id: 'work', label: 'Work', from: 96, to: 166, x: 0.77, k: 0.86, heightVh: 460 },
  { id: 'journey', label: 'Journey', from: 167, to: 181, x: 0.26, k: 1.0, heightVh: 240 },
  { id: 'skills', label: 'Toolkit', from: 181, to: 187, x: 0.50, k: 0.98, heightVh: 280 },
  { id: 'awards', label: 'Awards', from: 187, to: 191, x: 0.75, k: 1.0, heightVh: 320 },
  { id: 'contact', label: 'Contact', from: 57, to: 0, x: 0.50, k: 1.0, heightVh: 240 },
];

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(Math.max(v, min), max);
}

function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

class ScrollDirector {
  private lenis: Lenis | null = null;
  private subscribers = new Set<DirectorSubscriber>();
  private sectionElements: Record<string, HTMLElement> = {};
  private sectionBounds: Record<string, { top: number; height: number }> = {};
  private resizeObserver: ResizeObserver | null = null;
  public isStarted = false;
  private currentY = 0;
  private totalScrollable = 1;

  public state: DirectorState = {
    scrollY: 0,
    progress: 0,
    activeSceneId: 'hero',
    activeSceneIndex: 0,
    frame: 0,
    scenesMetrics: {},
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
    }
  }

  public init() {
    if (typeof window === 'undefined') return;

    // Configure Lenis as { lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4 }
    this.lenis = new Lenis({
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });

    this.lenis.stop(); // Keep stopped until preloader finishes

    // Drive from gsap.ticker with lagSmoothing(0)
    gsap.ticker.lagSmoothing(0);
    const tickerCallback = (time: number) => {
      this.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    this.lenis.on('scroll', (e: { scroll: number }) => {
      this.currentY = e.scroll;
      this.tick();
    });

    // ResizeObserver for section bounding
    this.resizeObserver = new ResizeObserver(() => {
      this.measure();
      this.tick();
    });

    window.addEventListener('resize', () => {
      this.measure();
      this.tick();
    });

    this.measure();
    this.tick();
  }

  public registerSection(id: string, el: HTMLElement) {
    this.sectionElements[id] = el;
    this.resizeObserver?.observe(el);
    this.measure();
    this.tick();
  }

  public unregisterSection(id: string) {
    if (this.sectionElements[id]) {
      this.resizeObserver?.unobserve(this.sectionElements[id]);
      delete this.sectionElements[id];
      delete this.sectionBounds[id];
    }
    this.measure();
  }

  public measure() {
    if (typeof window === 'undefined') return;
    const vh = window.innerHeight;
    let accumulatedTop = 0;

    for (const sc of SCENES) {
      const el = this.sectionElements[sc.id];
      if (el) {
        // Cached top & height
        const rect = el.getBoundingClientRect();
        const top = window.scrollY + rect.top;
        const height = el.offsetHeight || (sc.heightVh / 100) * vh;
        this.sectionBounds[sc.id] = { top, height };
        accumulatedTop = Math.max(accumulatedTop, top + height);
      } else {
        const height = (sc.heightVh / 100) * vh;
        this.sectionBounds[sc.id] = { top: accumulatedTop, height };
        accumulatedTop += height;
      }
    }

    this.totalScrollable = Math.max(1, accumulatedTop - vh);
  }

  public start() {
    this.isStarted = true;
    this.lenis?.start();
    this.tick();
  }

  public scrollToScene(id: string) {
    const bound = this.sectionBounds[id];
    if (!bound || !this.lenis) return;
    // Over 2.2s using easeOutQuart
    this.lenis.scrollTo(bound.top, {
      duration: 2.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 4), // easeOutQuart
    });
  }

  public scrollToTop() {
    this.lenis?.scrollTo(0, {
      duration: 2.0,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    });
  }

  public subscribe(cb: DirectorSubscriber): () => void {
    this.subscribers.add(cb);
    cb(this.state);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  public tick() {
    if (typeof window === 'undefined') return;
    const y = this.currentY;
    const vh = window.innerHeight;
    const lead = 0.78 * vh;
    const span = 0.62 * vh;

    const metrics: Record<string, SceneMetrics> = {};
    let activeSceneIdx = 0;

    // Calculate metrics for each scene
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      const bound = this.sectionBounds[sc.id] || { top: i * vh * 2.5, height: sc.heightVh * 0.01 * vh };
      const top = bound.top;
      const h = bound.height;

      const enter = clamp((y - (top - vh)) / vh);
      const p = clamp((y - top) / Math.max(1, h - vh));
      const exit = clamp((y - (top + h - vh)) / vh);
      const vis = clamp(Math.min(enter * 1.6, 1 - exit * 2.2));

      metrics[sc.id] = { enter, p, exit, vis };

      // Active scene is the last one where y >= top - lead
      if (y >= top - lead) {
        activeSceneIdx = i;
      }
    }

    const activeScene = SCENES[activeSceneIdx];
    const activeMetrics = metrics[activeScene.id];

    // Frame value calculation:
    // Base frame in active scene
    let frame = activeScene.from + (activeScene.to - activeScene.from) * activeMetrics.p;

    // Check transition
    let transitionInfo: DirectorState['transition'] = undefined;
    if (activeSceneIdx < SCENES.length - 1) {
      const nextScene = SCENES[activeSceneIdx + 1];
      const nextBound = this.sectionBounds[nextScene.id];
      if (nextBound) {
        const transY = y - (nextBound.top - lead);
        if (transY >= 0 && transY <= span) {
          const rawT = clamp(transY / span);
          const t = easeInOutSine(rawT);
          const fromFrame = activeScene.to;
          const toFrame = nextScene.from;
          transitionInfo = {
            fromScene: activeScene,
            toScene: nextScene,
            fromFrame,
            toFrame,
            t,
            isContactEntering: nextScene.id === 'contact',
          };
        }
      }
    }

    // Also check transition if y is just entering current active scene from previous scene
    if (!transitionInfo && activeSceneIdx > 0) {
      const prevScene = SCENES[activeSceneIdx - 1];
      const curBound = this.sectionBounds[activeScene.id];
      if (curBound) {
        const transY = y - (curBound.top - lead);
        if (transY >= 0 && transY <= span) {
          const rawT = clamp(transY / span);
          const t = easeInOutSine(rawT);
          transitionInfo = {
            fromScene: prevScene,
            toScene: activeScene,
            fromFrame: prevScene.to,
            toFrame: activeScene.from,
            t,
            isContactEntering: activeScene.id === 'contact',
          };
        }
      }
    }

    const overallProgress = clamp(y / this.totalScrollable);

    this.state = {
      scrollY: y,
      progress: overallProgress,
      activeSceneId: activeScene.id,
      activeSceneIndex: activeSceneIdx,
      frame,
      transition: transitionInfo,
      scenesMetrics: metrics,
    };

    // Notify subscribers
    for (const sub of this.subscribers) {
      sub(this.state);
    }
  }
}

export const director = new ScrollDirector();
