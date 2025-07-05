import { k } from "../App";
import type { GameObj } from "kaplay";
import { Room } from "colyseus.js";
import type { MyRoomState } from "../../../server/src/rooms/schema/MyRoomState";

function loadSprites() {
  k.loadSprite("character", "./../assets/charactersheet.png", {
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
      standup: { from: 94, to: 84, loop: false },
      "deploy-mine": { from: 67, to: 70, loop: false },
    },
  });

  k.loadSprite("platform", "./../assets/platform.png");
  k.loadSprite("mine", "./../assets/mine.png");
}

export default () => [
  k.pos(),
  k.z(0),
  {
    add(this: GameObj) {
      // Add floor
      this.add([
        k.pos(0, 840),
        k.rect(k.width(), 40),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "solid",
        "floor",
      ]);

      // Left wall
      this.add([
        k.pos(0, 0),
        k.rect(1, k.height()),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "solid",
        "wall-left",
      ]);

      // Right wall
      this.add([
        k.pos(1920, 0),
        k.rect(1, k.height()),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "solid",
        "wall-right",
      ]);

      loadSprites();
    },
  },
];
