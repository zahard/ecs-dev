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
import { ExplosionSprite } from "./Explosion";
import { ProjectileSprite } from "./Projectile";

export enum TankStateEnum {
  Idle,
  Driving,
  Jump,
  Shooting,
  Lean,
}

export class TankSprite implements WorldObject {
  worldRules = {
    physics: true,
    spriteAnimation: true,
  };
  spritePlayer: SpriteAnimationPlayer;
  pos: Position = {
    x: 0,
    y: 0,
  };
  inAir: boolean = false;
  speed: Speed2D = {
    x: 0,
    y: 0,
  };
  spriteDir: number = 1;
  stateAnimations: Record<TankStateEnum, SpriteAnimation>;
  currentState: TankStateEnum;

  private needRedraw = false;

  private jumpSpeed = -10;

  tickHandlers = {
    [TankStateEnum.Idle]: () => this.tickIdle,
    [TankStateEnum.Driving]: () => this.tickDriving,
    [TankStateEnum.Jump]: () => this.tickJump,
    [TankStateEnum.Lean]: () => this.tickLean,
    [TankStateEnum.Shooting]: () => this.tickShooting,
  };

  constructor(spriteImageHandle: SpriteHandle, state: TankStateEnum) {
    this.stateAnimations = this.builsStatesAnimations(spriteImageHandle);
    this.spritePlayer = new SpriteAnimationPlayer(
      this.getAnimation(TankStateEnum.Idle)
    );
    this.setState(state);
  }

  tick(delta: number, UserIO: any, sceneData: SceneData) {
    this.needRedraw = false;

    const tickHandler = this.tickHandlers[this.currentState]();
    tickHandler.call(this, UserIO, delta, sceneData);

    // Update Sprite Animations
    if (this.spritePlayer.tick(delta)) {
      this.needRedraw = true;
    }

    return this.needRedraw;
  }

  draw(ctx: CanvasRenderingContext2D, worldOffset: Position) {
    const pos = toLocalPosition(worldOffset, this.pos);
    this.spritePlayer.drawFrame(ctx, pos, this.spriteDir !== -1);
  }

  private tickShooting(_, __, sceneData: SceneData) {
    if (this.spritePlayer.isFrameStarted(5)) {
      this.shootProjectile(sceneData);
    } else if (this.spritePlayer.isFinished()) {
      this.setState(TankStateEnum.Idle);
    }
  }

  private tickLean(UserIO: any, delta: number, sceneData: SceneData) {
    if (this.inAir === false) {
      this.setState(TankStateEnum.Driving);
      return;
    }
    if (!UserIO.keyPressed("KeyA") && !UserIO.keyPressed("KeyD")) {
      this.speed.x = 0;
      this.setState(TankStateEnum.Jump);
    } else {
      if (UserIO.keyPressed("KeyD")) {
        this.spriteDir = 1;
      }
      if (UserIO.keyPressed("KeyA")) {
        this.spriteDir = -1;
      }
      if (UserIO.keyWasPressed("Space")) {
        this.shootProjectile(sceneData);
      }
      const speed = 40;
      const pxDistance = speed / delta;
      this.speed.x = pxDistance * this.spriteDir;
    }
  }

  private tickJump(UserIO: any, _, sceneData: SceneData) {
    if (!this.inAir) {
      this.setState(TankStateEnum.Idle);
    }
    if (UserIO.keyPressed("KeyA")) {
      this.spriteDir = -1;
      this.setState(TankStateEnum.Lean);
    } else if (UserIO.keyPressed("KeyD")) {
      this.spriteDir = 1;
      this.setState(TankStateEnum.Lean);
    }

    if (UserIO.keyWasPressed("Space")) {
      this.shootProjectile(sceneData);
    }
  }

  private tickDriving(UserIO: any, delta: number) {
    if (!UserIO.keyPressed("KeyA") && !UserIO.keyPressed("KeyD")) {
      this.speed.x = 0;
      this.setState(TankStateEnum.Idle);
    } else {
      if (UserIO.keyPressed("KeyW")) {
        this.speed.y = this.jumpSpeed;
        this.inAir = true;
        this.setState(TankStateEnum.Jump);
      }

      if (UserIO.keyPressed("KeyD")) {
        this.spriteDir = 1;
      }
      if (UserIO.keyPressed("KeyA")) {
        this.spriteDir = -1;
      }
      const speed = 50; // 100px per second
      const pxDistance = speed / delta;
      this.speed.x = pxDistance * this.spriteDir;
    }
  }

  private tickIdle(UserIO: any) {
    if (UserIO.keyPressed("KeyA")) {
      this.spriteDir = -1;
      this.setState(TankStateEnum.Driving);
    } else if (UserIO.keyPressed("KeyD")) {
      this.spriteDir = 1;
      this.setState(TankStateEnum.Driving);
    } else if (UserIO.keyWasPressed("Space")) {
      this.setState(TankStateEnum.Shooting);
    } else if (UserIO.keyWasPressed("KeyW")) {
      this.speed.y = this.jumpSpeed;
      this.inAir = true;
      this.setState(TankStateEnum.Jump);
    }
  }

  private shootProjectile(sceneData: SceneData) {
    const explosion = new ExplosionSprite(
      sceneData.resources.tank,
      this.spriteDir
    );
    explosion.setPosition({
      x: this.pos.x + 60 * this.spriteDir,
      y: this.pos.y - 20,
    });

    const projectile = new ProjectileSprite(
      sceneData.resources.tank,
      this.spriteDir
    );
    projectile.setPosition({
      x: this.pos.x + 60 * this.spriteDir,
      y: this.pos.y - 10,
    });
    projectile.setSpeed(this.spriteDir * 5);

    sceneData.spawnObject(projectile);
    sceneData.spawnObject(explosion);
  }

  setPosition(pos: Position) {
    this.pos = pos;
  }

  setState(state: TankStateEnum) {
    this.needRedraw = true;
    this.currentState = state;
    this.spritePlayer.setAnimation(this.getAnimation(this.currentState));
  }

  getAnimation(state: TankStateEnum): SpriteAnimation {
    return this.stateAnimations[state];
  }

  private builsStatesAnimations(
    spriteImageHandle: SpriteHandle
  ): Record<TankStateEnum, SpriteAnimation> {
    const mainSprite: SpriteSettings = {
      handle: spriteImageHandle,
      offsetY: 30,
      offsetX: 0,
      padY: 1,
      padX: 3,
      framesPerRow: 6,
      frameH: 58,
      frameW: 72,
    };
    const spriteJump: SpriteSettings = {
      ...mainSprite,
      padY: 3,
    };
    const spriteShooting: SpriteSettings = {
      ...mainSprite,
      offsetX: 2,
      offsetY: 12,
      padY: 0,
      padX: 0,
      frameH: 62,
      frameW: 74,
    };

    return {
      [TankStateEnum.Driving]: {
        sprite: mainSprite,
        frames: frameRange(6, 11),
        frameDelay: 100,
        isLooped: true,
      },

      [TankStateEnum.Shooting]: {
        sprite: spriteShooting,
        frames: frameRange(36, 45),
        frameDelay: 60,
        isLooped: false,
      },
      [TankStateEnum.Idle]: {
        sprite: mainSprite,
        frames: frameRange(0, 3),
        frameDelay: 150,
        isLooped: true,
      },
      [TankStateEnum.Jump]: {
        sprite: spriteJump,
        frames: [51],
        frameDelay: 1000,
        isLooped: true,
      },
      [TankStateEnum.Lean]: {
        sprite: spriteJump,
        frames: [51],
        frameDelay: 1000,
        isLooped: true,
      },
    };
  }
}
