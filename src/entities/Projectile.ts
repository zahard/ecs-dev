import {
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

export class ProjectileSprite implements WorldObject {
  worldRules = {
    physics: true,
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
      frames: frameRange(22, 25),
      frameDelay: 200,
      isLooped: true,
    });
  }

  tick(delta: number, _, sceneData: SceneData) {
    const pos = toLocalPosition(sceneData.worldOffset, this.pos);
    if (pos.x < 0 || pos.x > 720) {
      console.log(sceneData.worldOffset, this.pos);
      console.log(pos.x);
      this.deleteNextTick = true;
    }
    return this.spritePlayer.tick(delta);
  }

  draw(ctx: CanvasRenderingContext2D, worldOffset: Position) {
    const pos = toLocalPosition(worldOffset, this.pos);
    this.spritePlayer.drawFrame(ctx, pos, this.spriteDir !== -1);
  }

  setSpeed(speed: number) {
    this.speed.x = speed;
  }

  setPosition(pos: Position) {
    this.pos = pos;
  }
}
