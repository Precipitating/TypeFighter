import type { GameObj } from "kaplay";
import type { MyRoomState, Platform } from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";
import { Room } from "colyseus.js";

function spawnPlatform(
  room: Room<MyRoomState>,
  platformSchema: Platform
) {
  const platform = k.add([
    k.scale(platformSchema.scale),
    k.sprite("platform"),
    k.pos(platformSchema.startX, platformSchema.startY),
    k.color(platformSchema.r, platformSchema.g, platformSchema.b),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.platformEffector({ ignoreSides: [k.UP, k.LEFT, k.RIGHT] }),
    k.animate(),
    "solid",
    "platform",
    {
      platformId: platformSchema.objectUniqueId,

    }
  ]);

  if (platformSchema.canMove) {
    // animate up or down
    const horizontalOrVertical = platformSchema.horizontalOrVertical;
    const randX = platformSchema.xMovement
    const randY = platformSchema.yMovement
    platform.animate(
      "pos",
      [
        k.vec2(platformSchema.startX, platformSchema.startY),
        k.vec2(
          horizontalOrVertical ? randX : platformSchema.startX,
          !horizontalOrVertical ? randY : platformSchema.startY
        ),
      ],
      {
        duration: platformSchema.platformAnimateSpeed,
        direction: "ping-pong",
      }
    );
  }
  return platform;
}
export default {
  spawnPlatform,
};
