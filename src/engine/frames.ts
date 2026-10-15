export interface ShotManifest {
  from: number;
  to: number;
  box: [number, number, number, number]; // [x, y, w, h]
  cx: number;
}

export interface Manifest {
  w: number;
  h: number;
  count: number;
  shots: ShotManifest[];
}

export class FrameLoader {
  private manifest: Manifest | null = null;
  private frames: Map<number, HTMLImageElement> = new Map();
  private loadedCount = 0;
  private quarterCount = 0;
  private isMobile = false;
  private basePath = './frames';
  private onProgressCallbacks = new Set<(progress: number, readyForIntro: boolean) => void>();
  private readyResolved = false;

  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.isMobile = window.innerWidth < 820;
    const subFolder = this.isMobile ? 'sm' : 'lg';
    this.basePath = `./frames/${subFolder}`;

    try {
      const res = await fetch('./frames/manifest.json');
      if (!res.ok) throw new Error('Manifest fetch failed');
      this.manifest = await res.json();
    } catch {
      // Fallback default manifest if not loaded yet
      this.manifest = {
        w: 1600,
        h: 900,
        count: 192,
        shots: [
          { from: 0, to: 57, box: [200, 40, 1200, 860], cx: 0.5 },
          { from: 58, to: 95, box: [200, 100, 1200, 800], cx: 0.5 },
          { from: 96, to: 166, box: [100, 150, 1400, 750], cx: 0.5 },
          { from: 167, to: 191, box: [200, 40, 1200, 860], cx: 0.5 },
        ],
      };
    }

    const count = this.manifest?.count || 192;
    this.quarterCount = Math.floor(count / 4);

    this.startStreaming(count);
  }

  public getManifest(): Manifest | null {
    return this.manifest;
  }

  public getShotForFrame(frameIndex: number): ShotManifest | null {
    if (!this.manifest) return null;
    for (const shot of this.manifest.shots) {
      if (frameIndex >= shot.from && frameIndex <= shot.to) {
        return shot;
      }
    }
    // Handle reverse contact shot mapping or boundaries
    for (const shot of this.manifest.shots) {
      const minF = Math.min(shot.from, shot.to);
      const maxF = Math.max(shot.from, shot.to);
      if (frameIndex >= minF && frameIndex <= maxF) {
        return shot;
      }
    }
    return this.manifest.shots[0] || null;
  }

  public getLoadedCount(): number {
    return this.loadedCount;
  }

  public getFrame(index: number): HTMLImageElement | null {
    if (this.frames.has(index)) {
      return this.frames.get(index)!;
    }
    // Fall back to the nearest loaded frame in the same shot
    const shot = this.getShotForFrame(index);
    if (!shot) return null;
    const minF = Math.min(shot.from, shot.to);
    const maxF = Math.max(shot.from, shot.to);

    let bestDiff = Infinity;
    let fallbackImg: HTMLImageElement | null = null;
    for (let f = minF; f <= maxF; f++) {
      if (this.frames.has(f)) {
        const diff = Math.abs(f - index);
        if (diff < bestDiff) {
          bestDiff = diff;
          fallbackImg = this.frames.get(f)!;
        }
      }
    }
    return fallbackImg;
  }

  public onProgress(cb: (progress: number, readyForIntro: boolean) => void): () => void {
    this.onProgressCallbacks.add(cb);
    return () => {
      this.onProgressCallbacks.delete(cb);
    };
  }

  private notify() {
    // Tween progress to load progress (0..100)
    const rawProgress = Math.min(100, Math.round((this.loadedCount / this.quarterCount) * 100));
    const ready = this.loadedCount >= this.quarterCount;
    if (ready && !this.readyResolved) {
      this.readyResolved = true;
    }
    for (const cb of this.onProgressCallbacks) {
      cb(rawProgress, ready);
    }
  }

  private async loadSingleFrame(index: number): Promise<void> {
    if (this.frames.has(index)) return;
    const formatted = String(index).padStart(3, '0');
    const img = new Image();
    img.src = `${this.basePath}/f${formatted}.webp`;

    try {
      await img.decode();
      this.frames.set(index, img);
      this.loadedCount++;
      this.notify();
    } catch {
      // Fallback on standard load error
      img.onload = () => {
        this.frames.set(index, img);
        this.loadedCount++;
        this.notify();
      };
      img.onerror = () => {
        // Frame not yet ready
      };
    }
  }

  private async startStreaming(count: number): Promise<void> {
    // Stride order 8 → 4 → 2 → 1, with shot boundaries first
    const shotBoundaries: number[] = [];
    if (this.manifest) {
      for (const s of this.manifest.shots) {
        shotBoundaries.push(s.from, s.to);
      }
    }
    const boundarySet = new Set(shotBoundaries);

    // 1. Shot boundaries first
    for (const f of boundarySet) {
      if (f >= 0 && f < count) {
        await this.loadSingleFrame(f);
      }
    }

    // 2. Stride passes: 8, 4, 2, 1
    const strides = [8, 4, 2, 1];
    for (const stride of strides) {
      for (let i = 0; i < count; i += stride) {
        if (!this.frames.has(i)) {
          // Fire async decode
          this.loadSingleFrame(i);
          // Yield occasionally
          if (i % 16 === 0) {
            await new Promise((r) => setTimeout(r, 4));
          }
        }
      }
    }

    // 3. Catch all remaining
    for (let i = 0; i < count; i++) {
      if (!this.frames.has(i)) {
        this.loadSingleFrame(i);
      }
    }
  }
}

export const frameLoader = new FrameLoader();
