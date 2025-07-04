import type { GameObj } from "kaplay";
import type { MyRoomState } from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";
import { Room } from "colyseus.js";

function spawnPlatform(
  x: number,
  y: number,
  scale: number,
  canMove: boolean,
  room: Room<MyRoomState>
) {
  const platform = k.add([
    k.scale(scale),
    k.sprite("platform"),
    k.pos(x, y),
    k.color(k.rand(k.rgb(255, 255, 255))),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.platformEffector({ ignoreSides: [k.UP, k.LEFT, k.RIGHT] }),
    k.animate(),
    "solid",
    "platform",
  ]);

  const platforms = k.get("platform");

  const distCheck = (): void => {
    platforms.forEach((curr: GameObj) => {
      if (curr !== platform) {
        const dist = platform.pos.dist(curr.pos);
        if (dist < 250 * scale) {
          k.debug.log("too close");
          const randX = k.randi(100, k.width());
          const randY = k.randi(250, 500);
          k.debug.log(`old pos: ${x}x, ${y}y. New: ${randX}x, ${randY}y`);
          platform.pos = k.vec2(randX, randY);
          distCheck();
        }
      }
    });
  };
  distCheck();

  if (canMove) {
    // animate up or down
    const horizontalOrVertical = k.rand(0, 1) < 0.5;
    const randX = k.randi(100, k.width() - 100);
    const randY = k.randi(100, 800);
    platform.animate(
      "pos",
      [
        platform.pos,
        k.vec2(
          horizontalOrVertical ? randX : platform.pos.x,
          !horizontalOrVertical ? randY : platform.pos.y
        ),
      ],
      {
        duration: k.randi(3, 10),
        direction: "ping-pong",
      }
    );
  }
}

function spawn(room: Room<MyRoomState>) {
  k.loadSprite("platform", "./assets/platform.png");
  for (let index = 0; index < k.randi(3, 6); ++index) {
    spawnPlatform(
      k.randi(100, k.width()),
      k.randi(300, 500),
      k.rand(0.5, 1.5),
      k.rand(0, 1) < 0.5 ? true : false,
      room
    );
  }
}

export default {
  spawn,
};
