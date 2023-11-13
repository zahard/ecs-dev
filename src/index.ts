import { TankSprite, TankStateEnum } from "./entities/Tank";
import { PhysicsObject, SceneData, WorldObject } from "./world";
import { UserIO } from "./io";

declare var window: any;

const gameImages = {};

const floorLevel = 200;

function startGame(assets: any) {
  const tankImg = assets["tank"];

  console.log(assets["level_1"].width, assets["level_1"].height);

  const tankImageHandle = createTransparentSprite(tankImg);

  const canvas = window.document.getElementById("canvas");
  canvas.width = 480;
  canvas.height = 240;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  UserIO.init();

  let lastTime = 0;
  let gamePaused = false;

  const scene: WorldObject[] = [];
  const spawnPool: WorldObject[] = [];

  const worldW = 480;
  let worldX = 0;

  const spawnObject = (obj: WorldObject) => {
    spawnPool.push(obj);
  };

  const TankEntity = new TankSprite(tankImageHandle, TankStateEnum.Idle);
  TankEntity.setPosition({ x: 100, y: floorLevel });
  spawnObject(TankEntity);

  const Player = TankEntity;

  const physicsObjects = (): PhysicsObject[] => {
    const objects = (scene as any).filter(
      (obj: WorldObject) => !!obj.worldRules.physics
    );
    return objects as PhysicsObject[];
  };

  const sceneData: SceneData = {
    spawnObject,
    resources: {
      tank: tankImageHandle,
    },
    worldOffset: {
      x: worldX,
      y: 0,
    },
  };

  window.requestAnimationFrame((x) => animate(x));
  function animate(t: number) {
    const delta = t - lastTime;
    lastTime = t;

    if (UserIO.keyWasPressed("Escape")) {
      gamePaused = !gamePaused;
    }

    if (gamePaused) {
      UserIO.afterTick();
      window.requestAnimationFrame(animate);
      return;
    }

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

    const playerX = Player.pos.x;
    if (playerX > worldW / 2) {
      worldX = playerX - worldW / 2;
    }
    sceneData.worldOffset.x = worldX;

    // Draw a frame is required
    if (needRedraw) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        assets.level_1,
        worldX,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      scene.forEach((entity) => {
        entity.draw(ctx, { x: worldX, y: 0 });
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
    entity.speed.y += 0.4;

    // Landed
    if (entity.pos.y >= floorLevel) {
      entity.pos.y = floorLevel;
      entity.speed.y = 0;
      entity.inAir = false;
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
    ((i) => {
      var sourceImage = images[i];
      var img = new window.Image();
      var name = sourceImage.name;
      img.onload = loaderFactory(name, imgs, images, loadedCallback);
      img.src = sourceImage.path;
    })(i);
  }
}

function loaderFactory(name, imgs, images, loadedCallback) {
  return function () {
    imgs.push({
      name: name,
      img: this,
    });

    if (imgs.length == images.length) {
      const map = {};
      imgs.forEach((imageData) => (map[imageData.name] = imageData.img));
      loadedCallback(map);
    }
  };
}

loadImages(
  [
    { name: "tank", path: "assets/tank.png" },
    { name: "level_1", path: "assets/level_1.png" },
  ],
  startGame
);
