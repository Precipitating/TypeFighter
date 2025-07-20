import { k } from "../App";

function loadSprites() {
  k.loadSprite("character", "./assets/charactersheet.png", {
    sliceY: 10,
    sliceX: 12,
    anims: {
      idle: 48,
      fall: 114,
      lying: 94,
      injured: 32,
      crouched: 76,
      dash: { from: 96, to: 103, loop: false, speed: 30 },
      "walk-left": { from: 4, to: 2, loop: false },
      "walk-right": { from: 2, to: 4, loop: false },
      crouch: { from: 72, to: 76, loop: false },
      uncrouch: { from: 76, to: 72, loop: false },
      jump: { from: 108, to: 114, loop: false, speed: 20 },
      throw: { from: 77, to: 82, loop: false },
      "throw-up": { from: 77, to: 81, loop: false },
      "throw-down": { from: 77, to: 82, loop: false },
      "throw-grenade": { from: 77, to: 82, loop: false },
      hurt: { from: 104, to: 106, loop: false, speed: 20 },
      "hurt-end": { from: 106, to: 104, loop: false },
      death: { from: 83, to: 94, loop: false },
      block: { from: 28, to: 30, loop: false, speed: 15 },
      deflect: { from: 28, to: 30, loop: false, speed: 25 },
      landing: { from: 72, to: 77, loop: false, speed: 15 },
      "air-knockback": { from: 89, to: 93, loop: false },
      "stand-up": { from: 94, to: 84, loop: false },
      "deploy-mine": { from: 67, to: 70, loop: false },
    },
  });

  k.loadSprite("platform", "./assets/platform.png");
  k.loadSprite("mine", "./assets/mine.png");
}

function loadSounds() {
  k.loadSound("theme1", "./assets/sounds/theme1.mp3");
  k.loadSound("theme2", "./assets/sounds/theme2.mp3");
  k.loadSound("jump", "./assets/sounds/jump.mp3");
  k.loadSound("footstep1", "./assets/sounds/footstep1.mp3");
  k.loadSound("footstep2", "./assets/sounds/footstep2.mp3");
  k.loadSound("hurt1", "./assets/sounds/hurt.ogg");
  k.loadSound("hurt2", "./assets/sounds/hurt2.ogg");
  k.loadSound("hurt3", "./assets/sounds/hurt3.ogg");
  k.loadSound("heal", "./assets/sounds/heal.wav");
  k.loadSound("pickup", "./assets/sounds/pickup.mp3");
  k.loadSound("flop", "./assets/sounds/flop.wav");
  k.loadSound("hit", "./assets/sounds/hit.wav");
  k.loadSound("throw1", "./assets/sounds/throw1.wav");
  k.loadSound("throw2", "./assets/sounds/throw2.wav");
  k.loadSound("throw3", "./assets/sounds/throw3.wav");
  k.loadSound("throw4", "./assets/sounds/throw4.wav");
  k.loadSound("grenadebounce1", "./assets/sounds/grenadebounce1.wav");
  k.loadSound("grenadebounce2", "./assets/sounds/grenadebounce2.wav");
  k.loadSound("grenadedetonate", "./assets/sounds/grenadedetonate.mp3");
  k.loadSound("deploymine", "./assets/sounds/deploymine.wav");
  k.loadSound("minetrip", "./assets/sounds/mineTrip.wav");
  k.loadSound("deflect", "./assets/sounds/deflect.mp3");
  k.loadSound("block", "./assets/sounds/block.mp3");
  k.loadSound("pop", "./assets/sounds/pop.wav");
}

function spawnFloorAndWalls() {
  // Floor
  k.add([
    k.pos(0, 840),
    k.rect(k.width(), 40),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "solid",
    "floor",
  ]);

  // Left wall
  k.add([
    k.pos(0, 0),
    k.rect(1, k.height()),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "solid",
    "wall-left",
  ]);

  // Right wall
  k.add([
    k.pos(1920, 0),
    k.rect(1, k.height()),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "solid",
    "wall-right",
  ]);
}
export default () => {
  spawnFloorAndWalls();
  loadSprites();
  loadSounds();
};
