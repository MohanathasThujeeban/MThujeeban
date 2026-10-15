import React, { useEffect, useRef } from 'react';
import { director, SCENES } from '../engine/director';
import { frameLoader, type ShotManifest } from '../engine/frames';

export const Stage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const lastKeyRef = useRef<string>('');
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Track mouse for parallax (±14px with lerp 0.06)
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.x = nx;
      mouseRef.current.y = ny;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastKeyRef.current = ''; // force redraw
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const drawFrameContent = (
      ctx: CanvasRenderingContext2D,
      frameVal: number,
      shot: ShotManifest | null,
      xPos: number,
      kVal: number,
      vw: number,
      vh: number,
      isMobile: boolean,
      shiftX = 0,
      alpha = 1.0
    ) => {
      if (!shot) return;
      const box = shot.box; // [x, y, w, h]
      const cx = shot.cx ?? 0.5;

      let scale = (vh * kVal) / 900;
      let effectiveX = xPos;
      if (isMobile) {
        effectiveX = 0.5;
        scale = Math.min((vh * 0.74) / 900, (vw * 1.05) / Math.max(1, box[2]));
      }

      // Parallax
      const mouseOffX = mouseRef.current.currentX * 14;
      const mouseOffY = mouseRef.current.currentY * 14;

      const offY = vh - 900 * scale + mouseOffY;
      const offX = effectiveX * vw - cx * 1600 * scale + mouseOffX + shiftX;

      const drawX = offX + box[0] * scale;
      const drawY = offY + box[1] * scale;
      const drawW = box[2] * scale;
      const drawH = box[3] * scale;

      const fFloor = Math.floor(frameVal);
      const frac = frameVal - fFloor;
      const fCeil = fFloor + 1;

      const imgA = frameLoader.getFrame(fFloor);
      const imgB = frameLoader.getFrame(fCeil);

      ctx.save();
      ctx.globalAlpha = alpha;

      if (imgA) {
        ctx.drawImage(imgA, drawX, drawY, drawW, drawH);
      }
      // Silky blending if next frame is loaded within same shot
      if (imgB && frac > 0.001) {
        ctx.globalAlpha = alpha * frac;
        ctx.drawImage(imgB, drawX, drawY, drawW, drawH);
      }

      ctx.restore();
    };

    const render = () => {
      // Lerp mouse parallax
      mouseRef.current.currentX += (mouseRef.current.x - mouseRef.current.currentX) * 0.06;
      mouseRef.current.currentY += (mouseRef.current.y - mouseRef.current.currentY) * 0.06;

      const state = director.state;
      const loadedCount = frameLoader.getLoadedCount();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 820;

      // Key includes: frame, transition state, loadedCount, mouse offset
      const key = `${state.frame.toFixed(2)}_${state.transition?.t.toFixed(3) || 'none'}_${loadedCount}_${mouseRef.current.currentX.toFixed(2)}_${mouseRef.current.currentY.toFixed(2)}_${vw}x${vh}`;

      if (key !== lastKeyRef.current) {
        lastKeyRef.current = key;
        ctx.clearRect(0, 0, vw, vh);

        if (state.transition) {
          const { fromScene, toScene, fromFrame, toFrame, t, isContactEntering } = state.transition;
          const fromShot = frameLoader.getShotForFrame(fromFrame);
          const toShot = frameLoader.getShotForFrame(toFrame);

          // Blade math:
          const skew = 0.2 * vh;
          const e = -skew + (vw + 2 * skew) * t;
          const bladeColor = isContactEntering ? '#ffffff' : '#ff1f1f';

          // 1. Draw Outgoing Shot (clipped to polygon to right of line: (e+skew, 0) to (e-skew, vh))
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(e + skew, 0);
          ctx.lineTo(vw, 0);
          ctx.lineTo(vw, vh);
          ctx.lineTo(e - skew, vh);
          ctx.closePath();
          ctx.clip();

          drawFrameContent(
            ctx,
            fromFrame,
            fromShot,
            fromScene.x,
            fromScene.k,
            vw,
            vh,
            isMobile,
            60 * t, // shifted +60t px
            1 - 0.35 * t // alpha 1 - 0.35t
          );
          ctx.restore();

          // 2. Draw Incoming Shot (clipped to polygon to left of line: (e+skew, 0) to (e-skew, vh))
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(e + skew, 0);
          ctx.lineTo(e - skew, vh);
          ctx.lineTo(0, vh);
          ctx.closePath();
          ctx.clip();

          drawFrameContent(
            ctx,
            toFrame,
            toShot,
            toScene.x,
            toScene.k,
            vw,
            vh,
            isMobile,
            -60 * (1 - t), // shifted -60(1-t) px
            1.0
          );
          ctx.restore();

          // 3. Draw Blade: 3px line with 24px glow and 90px gradient trail
          ctx.save();

          // Gradient trail (90px)
          const grad = ctx.createLinearGradient(e + skew, 0, e + skew - 90, 0);
          grad.addColorStop(0, isContactEntering ? 'rgba(255,255,255,0.45)' : 'rgba(255,31,31,0.45)');
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(e + skew, 0);
          ctx.lineTo(e + skew - 90, 0);
          ctx.lineTo(e - skew - 90, vh);
          ctx.lineTo(e - skew, vh);
          ctx.closePath();
          ctx.fill();

          // 3px red/white line with 24px glow
          ctx.shadowColor = bladeColor;
          ctx.shadowBlur = 24;
          ctx.strokeStyle = bladeColor;
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.moveTo(e + skew, 0);
          ctx.lineTo(e - skew, vh);
          ctx.stroke();

          ctx.restore();
        } else {
          // Standard single scene render
          const activeShot = frameLoader.getShotForFrame(state.frame);
          const sceneConfig = SCENES[state.activeSceneIndex] ?? null;
          const xPos = sceneConfig?.x ?? 0.5;
          const kVal = sceneConfig?.k ?? 1.0;

          drawFrameContent(ctx, state.frame, activeShot, xPos, kVal, vw, vh, isMobile);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} id="stage-canvas" className="stage-canvas" />;
};
