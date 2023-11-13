import {
  PhysicsObject,
  SceneData,
  TankSprite,
  TankStateEnum,
  WorldObject,
} from "./entities/Tank";
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

  let iteration = 0;

  let timeToFrameChange = 0;

  let lastTime = 0;

  const scene: WorldObject[] = [];
  const spawnPool: WorldObject[] = [];

  const spawnObject = (obj: WorldObject) => {
    spawnPool.push(obj);
  };

  const TankEntity = new TankSprite(tankImageHandle, TankStateEnum.Idle);
  TankEntity.setPosition({ x: 300, y: 250 });
  spawnObject(TankEntity);

  const physicsObjects = (): PhysicsObject[] => {
    const objects = (scene as any).filter(
      (obj: WorldObject) => !!obj.worldRules.physics
    );
    return objects as PhysicsObject[];
  };

  const sceneData: SceneData = {
    spawnObject,
  };

  window.requestAnimationFrame((x) => animate(x));
  function animate(t: number) {
    iteration++;
    const delta = t - lastTime;
    lastTime = t;

    timeToFrameChange -= delta;

    let needRedraw = false;

    const _update = (updated: boolean) => {
      needRedraw = needRedraw || updated;
    };

    // Find if there any objects is makred for deletion
    _update(deleteSceneObjects(scene));

    // Add new scene objects
    if (spawnPool.length) {
      scene.push(...spawnPool);
      spawnPool.length = 0;
    }

    // Tick Updates for Entities
    scene.forEach((sceneObj) => {
      _update(sceneObj.tick(delta, UserIO, sceneData));
    });

    // Recalculate physic
    physicsObjects().forEach((worldObj) => {
      _update(applyPhysicsTick(worldObj, delta));
    });

    // Draw a frame is required
    if (needRedraw) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      scene.forEach((entity) => {
        entity.draw(ctx);
      });
    }

    UserIO.afterTick();
    window.requestAnimationFrame(animate);
  }
}

function deleteSceneObjects(scene: WorldObject[]) {
  const forDelete = scene.filter((o) => o.deleteNextTick);
  if (!forDelete.length) {
    return false;
  }
  forDelete.forEach((obj) => {
    // Free resources if needed
    // obj.dispose()
    const index = scene.indexOf(obj);
    scene.splice(index, 1);
  });
  return true;
}

function applyPhysicsTick(entity: PhysicsObject, delta: number) {
  let needRedraw = false;
  // Applied force
  if (entity.speed.x !== 0) {
    entity.pos.x += entity.speed.x;
    needRedraw = true;
  }

  // Gravity
  if (entity.speed.y !== 0) {
    entity.pos.y += entity.speed.y;
    entity.speed.y += 0.3;

    // Landed
    if (entity.pos.y >= 250) {
      entity.pos.y = 250;
      entity.speed.y = 0;
    }
    needRedraw = true;
  }

  return needRedraw;
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
