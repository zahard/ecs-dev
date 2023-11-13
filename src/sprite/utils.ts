import { SpriteSettings } from "./sprite";

export interface Position {
  x: number;
  y: number;
}

export interface Speed2D {
  x: number;
  y: number;
}

export function frameRange(start: number, end: number): number[] {
  if (end < start) {
    const tmp = end;
    end = start;
    start = tmp;
  }

  const range = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}

export function getFrameCoordinate(sprite: SpriteSettings, frameIndex: number) {
  const sp = sprite;
  const row = Math.floor(frameIndex / sp.framesPerRow);
  const col = frameIndex % sp.framesPerRow;
  return {
    x: sp.offsetX + col * (sp.frameW + sp.padX),
    y: sp.offsetY + row * (sp.frameH + sp.padY),
  };
}
