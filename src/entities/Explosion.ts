import {
  SpriteAnimation,
  SpriteAnimationPlayer,
  SpriteHandle,
  SpriteSettings,
} from "../sprite/sprite";
import {
  Speed2D,
  Position,
  frameRange,
  toLocalPosition,
} from "../sprite/utils";
import { SceneData, WorldObject } from "../world";

export class ExplosionSprite implements WorldObject {
  worldRules = {
    physics: false,
    spriteAnimation: true,
  };
  spritePlayer: SpriteAnimationPlayer;
  pos: Position = {
    x: 0,
    y: 0,
  };
  speed: Speed2D = {
    x: 0,
    y: 0,
  };
  spriteDir: number = 1;
  deleteNextTick = false;

  constructor(spriteImageHandle: SpriteHandle, direction: number) {
    this.spriteDir = direction;

    const sprite: SpriteSettings = {
      handle: spriteImageHandle,
      offsetY: 830,
      offsetX: 27,
      padY: 0,
      padX: 0,
      framesPerRow: 9,
      frameH: 52,
      frameW: 52,
    };

    this.spritePlayer = new SpriteAnimationPlayer({
      sprite: sprite,
      frames: frameRange(6, 21),
      frameDelay: 40,
      isLooped: false,
    });
  }

  tick(delta: number, io: any, sceneData: SceneData) {
    if (this.spritePlayer.isFinished()) {
      this.deleteNextTick = true;
      return false;
    }
    return this.spritePlayer.tick(delta);
  }

  draw(ctx: CanvasRenderingContext2D, worldOffset: Position) {
    const pos = toLocalPosition(worldOffset, this.pos);
    this.spritePlayer.drawFrame(ctx, pos, this.spriteDir !== -1);
  }

  setPosition(pos: Position) {
    this.pos = pos;
  }
}
