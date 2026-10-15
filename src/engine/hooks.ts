import { useEffect, useRef } from 'react';
import { director, type DirectorState, type SceneMetrics } from './director';

/**
 * Returns a stable ref to director state. Never causes component re-renders on scroll.
 */
export function useDirectorRef() {
  const stateRef = useRef<DirectorState>(director.state);

  useEffect(() => {
    return director.subscribe((latestState) => {
      stateRef.current = latestState;
    });
  }, []);

  return stateRef;
}

/**
 * Hook to register a section element with the director.
 */
export function useRegisterSection(sceneId: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      director.registerSection(sceneId, el);
    }
    return () => {
      director.unregisterSection(sceneId);
    };
  }, [sceneId]);

  return ref;
}

/**
 * Hook to subscribe to scene metrics for a specific scene with direct DOM mutation.
 */
export function useSceneMetrics(
  sceneId: string,
  onUpdate: (metrics: SceneMetrics, state: DirectorState) => void
) {
  useEffect(() => {
    return director.subscribe((state) => {
      const metrics = state.scenesMetrics[sceneId];
      if (metrics) {
        onUpdate(metrics, state);
      }
    });
  }, [sceneId, onUpdate]);
}

/**
 * Tracks mouse position normalized (-1..1) with lerping for parallax and tilt.
 */
export function useMouseParallax() {
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.targetX = nx;
      mouseRef.current.targetY = ny;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return mouseRef;
}
