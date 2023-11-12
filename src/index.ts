import { UserIO } from "./io";
import { property } from "./lib";
import {
  SpriteAnimation,
  SpriteAnimationPlayer,
  SpriteSettings,
} from "./sprite/sprite";
import { frameRange, getFrameCoordinate } from "./sprite/utils";
declare var window: any;

const gameImages = {};

function startGame(imgs) {
  const tankImg = imgs[0].img;

  const tankImageHandle = createTransparentSprite(tankImg);

  const canvas = window.document.getElementById("canvas");
  canvas.width = 720;
  canvas.height = 480;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#eee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  UserIO.init();

  const loc = { x: 0, y: 0 };
  //drawSprite(ctx, tankImageHandle, loc);

  const projectileSprite: SpriteSettings = {
    handle: tankImageHandle,
    offsetY: 830,
    offsetX: 27,
    padY: 0,
    padX: 0,
    framesPerRow: 9,
    frameH: 52,
    frameW: 52,
  };

  const TankSprite_1: SpriteSettings = {
    handle: tankImageHandle,
    offsetY: 30,
    offsetX: 0,
    padY: 1,
    padX: 3,
    framesPerRow: 6,
    frameH: 58,
    frameW: 72,
  };

  const TankSprite_Jump: SpriteSettings = {
    ...TankSprite_1,
    padY: 3,
  };

  const TankSprite_Shooting: SpriteSettings = {
    ...TankSprite_1,
    offsetX: 2,
    offsetY: 12,
    padY: 0,
    padX: 0,
    frameH: 62,
    frameW: 74,
  };

  const minY = 250;

  const stateAnimations: Record<string, SpriteAnimation> = {
    driving: {
      sprite: TankSprite_1,
      frames: frameRange(6, 11),
      frameDelay: 100,
      isLooped: true,
    },

    shooting: {
      sprite: TankSprite_Shooting,
      frames: frameRange(36, 45),
      frameDelay: 60,
      isLooped: false,
    },
    idle: {
      sprite: TankSprite_1,
      frames: frameRange(0, 3),
      frameDelay: 150,
      isLooped: true,
    },
    jump: {
      sprite: TankSprite_Jump,
      frames: [51],
      frameDelay: 1000,
      isLooped: true,
    },
    lean: {
      sprite: TankSprite_Jump,
      frames: [51],
      frameDelay: 1000,
      isLooped: true,
    },
  };

  const TankEntity: {
    spritePlayer: SpriteAnimationPlayer;
    pos: {
      x: number;
      y: number;
    };
    speed: {
      y: number;
      x: number;
    };
    spriteDir: number;
  } = {
    spritePlayer: new SpriteAnimationPlayer(stateAnimations.idle),
    pos: { x: 300, y: 250 },
    spriteDir: 1,
    speed: {
      y: 0,
      x: 0,
    },
  };

  let activeAnimation: any;
  let currentState = "idle";

  const nextState = (stateName: string, action: string) => {
    const states = {
      idle: {
        drive: "driving",
        jump: "jump",
        shoot: "shooting",
      },
      shooting: {
        animation_end: "idle",
      },
      jump: {
        drive: "lean",
        land: "idle",
      },
      driving: {
        stop: "idle",
        jump: "jump",
      },
      lean: {
        stop: "jump",
        land: "driving",
      },
    };

    return states[stateName][action];
  };

  let projectile = null;

  let iteration = 0;

  let timeToFrameChange = 0;

  const setNewState = (state: string) => {
    currentState = state;
    activeAnimation = stateAnimations[state];
    TankEntity.spritePlayer.setAnimation(stateAnimations[state]);
  };

  const emitAction = (action: string) => {
    const newStateFound = nextState(currentState, action);
    if (newStateFound) {
      setNewState(newStateFound);
    }
  };

  setNewState("idle");

  let lastTime = 0;
  window.requestAnimationFrame((x) => animate(x));

  function animate(t: number) {
    iteration++;
    const delta = t - lastTime;
    lastTime = t;

    timeToFrameChange -= delta;

    let needRedraw = false;

    // State processsing
    switch (currentState) {
      case "idle":
        if (UserIO.keyPressed("KeyA")) {
          TankEntity.spriteDir = -1;
          emitAction("drive");
        } else if (UserIO.keyPressed("KeyD")) {
          TankEntity.spriteDir = 1;
          emitAction("drive");
        } else if (UserIO.keyWasPressed("Space")) {
          // emitAction("shoot");
          // needRedraw = true;
        } else if (UserIO.keyWasPressed("KeyW")) {
          TankEntity.speed.y = -10;
          TankEntity.pos.y -= 20;
          emitAction("jump");
          needRedraw = true;
        }
        break;

      case "driving":
        if (!UserIO.keyPressed("KeyA") && !UserIO.keyPressed("KeyD")) {
          TankEntity.speed.x = 0;
          emitAction("stop");
        } else {
          if (UserIO.keyPressed("KeyW")) {
            TankEntity.speed.y = -10;
            TankEntity.pos.y -= 20;
            emitAction("jump");
            needRedraw = true;
          }

          needRedraw = true;
          if (UserIO.keyPressed("KeyD")) {
            TankEntity.spriteDir = 1;
          }
          if (UserIO.keyPressed("KeyA")) {
            TankEntity.spriteDir = -1;
          }
          const speed = 50; // 100px per second
          const pxDistance = speed / delta;
          TankEntity.speed.x = pxDistance * TankEntity.spriteDir;
        }
        break;

      case "jump":
        if (TankEntity.pos.y === 250) {
          emitAction("land");
        }
        if (UserIO.keyPressed("KeyA")) {
          TankEntity.spriteDir = -1;
          emitAction("drive");
        } else if (UserIO.keyPressed("KeyD")) {
          TankEntity.spriteDir = 1;
          emitAction("drive");
        }
        break;

      case "lean":
        if (TankEntity.pos.y === 250) {
          TankEntity.speed.x = 0;
          emitAction("land");
          break;
        }
        if (!UserIO.keyPressed("KeyA") && !UserIO.keyPressed("KeyD")) {
          TankEntity.speed.x = 0;
          emitAction("stop");
        } else {
          needRedraw = true;
          if (UserIO.keyPressed("KeyD")) {
            TankEntity.spriteDir = 1;
          }
          if (UserIO.keyPressed("KeyA")) {
            TankEntity.spriteDir = -1;
          }
          const speed = 35; // 100px per second
          const pxDistance = speed / delta;
          TankEntity.speed.x = pxDistance * TankEntity.spriteDir;
        }
        break;

      case "shooting":
        const animationIndex = TankEntity.spritePlayer.getFrameIndex();

        if (
          animationIndex === 4 &&
          TankEntity.spritePlayer.timeToFrame() <= 0
        ) {
          // Create Projectile in the middle of animation
          console.log("BANG");

          TankEntity.pos.x -= TankEntity.spriteDir * 5;

          projectile = {
            origin: {
              x: TankEntity.pos.x + 45 * TankEntity.spriteDir,
              y: TankEntity.pos.y - 30,
            },
            maxFrame: 20,
            frame: 6,
          };
        }
    }

    if (projectile) {
      projectile.frame++;
      if (projectile.frame >= projectile.maxFrame) {
        projectile = null;
        needRedraw = true;
      } else {
      }
    }

    if (TankEntity.spritePlayer.tick(delta)) {
      needRedraw = true;
    }

    // recalculate physic

    // Applied force
    if (TankEntity.speed.x !== 0) {
      TankEntity.pos.x += TankEntity.speed.x;
    }

    // Gravity
    if (TankEntity.speed.y !== 0) {
      TankEntity.pos.y += TankEntity.speed.y;
      TankEntity.speed.y += 0.3;

      // Landed
      if (TankEntity.pos.y >= 250) {
        TankEntity.pos.y = 250;
        TankEntity.speed.y = 0;
      }

      needRedraw = true;
    }

    if (needRedraw) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      TankEntity.spritePlayer.drawFrame(
        ctx,
        TankEntity.pos,
        TankEntity.spriteDir !== -1
      );

      if (projectile) {
        // drawAnimationFrame(
        //   ctx,
        //   projectileSprite,
        //   projectile.frame,
        //   projectile.origin
        // );
      }
    }

    UserIO.afterTick();
    window.requestAnimationFrame(animate);
  }
}

function createTransparentSprite(image: any) {
  const cnv = window.document.createElement("canvas");
  cnv.width = image.width;
  cnv.height = image.height;
  const ctx = cnv.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, cnv.width, cnv.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
      data[i + 3] = 0;
    }

    if (data[i] < 2 && data[i + 1] === 128 && data[i + 2] < 2) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return cnv;
}

function loadImages(images, loadedCallback) {
  var imgs = [];

  for (var i = 0; i < images.length; i++) {
    var sourceImage = images[i];
    var img = new window.Image();
    var name = sourceImage.name;
    img.onload = loaderFactory(name, imgs, images, loadedCallback);
    img.src = sourceImage.path;
  }
}

function loaderFactory(name, imgs, images, loadedCallback) {
  return function () {
    imgs.push({
      name: name,
      img: this,
    });

    if (imgs.length == images.length) {
      loadedCallback(imgs);
    }
  };
}

loadImages(
  [
    // {name:'tileset', path:'/assets/spritesheet.png'},
    { name: "tank", path: "/assets/tank.png" },
  ],
  startGame
);
