import { SpriteHandle } from "./sprite/sprite";
import { Position, Speed2D } from "./sprite/utils";

export interface SceneData {
  spawnObject: (o: WorldObject) => void;
  resources: Record<string, SpriteHandle>;
  worldOffset: Position;
}

export interface WorldObject {
  worldRules: {
    physics: boolean;
    spriteAnimation: boolean;
  };
  deleteNextTick?: boolean;
  tick: (delta: number, userIo: any, scene: SceneData) => boolean;
  draw: (ctx: CanvasRenderingContext2D, worldOffset: Position) => void;
}

export interface PhysicsObject {
  pos: Position;
  speed: Speed2D;
  inAir: boolean;
}

export interface SpriteObject {
  pos: Position;
  speed: Speed2D;
}
