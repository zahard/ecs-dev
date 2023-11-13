import { Position, getFrameCoordinate } from "./utils";

export type SpriteHandle = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

export interface SpriteSettings {
  handle: SpriteHandle;
  offsetY: number;
  offsetX: number;
  padY: number;
  padX: number;
  framesPerRow: number;
  frameH: number;
  frameW: number;
}

export interface SpriteAnimation {
  sprite: SpriteSettings;
  frames: number[];
  frameDelay: number;
  isLooped: boolean;
}

export class SpriteAnimationPlayer {
  public frameIndex: number = 0;
  private timeToFrameChange: number = 0;
  private _isFinished = false;

  constructor(private animation: SpriteAnimation) {
    this.setAnimation(animation);
  }

  setAnimation(animation: SpriteAnimation) {
    this.animation = animation;
    this.frameIndex = 0;
    this.timeToFrameChange = 0;
    this._isFinished = false;
  }

  isFrameStarted(frame: number): boolean {
    if (this.frameIndex !== frame) {
      return false;
    }
    return this.animation.frameDelay === this.timeToFrameChange;
  }

  isActive(): boolean {
    return !this._isFinished;
  }

  isFinished(): boolean {
    return this._isFinished;
  }

  getFrameIndex(): number {
    return this.frameIndex;
  }

  animationFrame(): number {
    return this.animation.frames[this.frameIndex];
  }

  timeToFrame(): number {
    return this.timeToFrameChange;
  }

  tick(delta: number): boolean {
    if (this._isFinished) {
      return false;
    }

    this.timeToFrameChange -= delta;
    if (this.timeToFrameChange > 0) {
      return false;
    }

    // Reset timer
    this.timeToFrameChange = this.animation.frameDelay;

    // Find next frame index
    if (this.frameIndex < this.animation.frames.length - 1) {
      this.frameIndex += 1;
    } else {
      this.frameIndex = 0;
      if (!this.animation.isLooped) {
        this._isFinished = true;
      }
    }

    return true;
  }

  drawFrame(ctx: CanvasRenderingContext2D, pos: Position, mirror?: boolean) {
    const { x, y } = getFrameCoordinate(
      this.animation.sprite,
      this.animationFrame()
    );

    const sprite = this.animation.sprite;

    // TODO: Position to sprite anchoring as settings of sprite

    if (mirror) {
      ctx.save();
      ctx.translate(pos.x - sprite.frameW / 2, pos.y - sprite.frameH);
      ctx.scale(-1, 1);

      ctx.drawImage(
        sprite.handle,
        x,
        y,
        sprite.frameW,
        sprite.frameH,
        -sprite.frameW,
        0,
        sprite.frameW,
        sprite.frameH
      );

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.drawImage(
        sprite.handle,
        x,
        y,
        sprite.frameW,
        sprite.frameH,
        pos.x - sprite.frameW / 2,
        pos.y - sprite.frameH,
        sprite.frameW,
        sprite.frameH
      );
    }
  }
}
