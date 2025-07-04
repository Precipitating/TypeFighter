import { k } from "../App";
import type { GameObj } from "kaplay";

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
      const randomBG: string = k.randi(1, 8).toString();
      k.loadSprite("bg", `./assets/bgs/${randomBG}.png`);
      k.add([k.sprite("bg"), k.pos(0, -300), k.scale(1, 0.9)]);

      k.loadSprite("mine", "./assets/mine.png");
      k.loadSprite("platform", "./assets/platform.png");
    },
  },
];
