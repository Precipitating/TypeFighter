import type { Game, GameObj } from "kaplay";
import type {
  MyRoomState,
  Platform,
} from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";
import { Room } from "colyseus.js";
import { getClientServerTime } from "../scenes/lobby";

function spawnPlatform(room: Room<MyRoomState>, platformSchema: Platform) {
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
      time: 0,
      animDuration: platformSchema.platformAnimateDuration,
      animStartPos: k.vec2(platformSchema.startX, platformSchema.startY),
      animEndPos: k.vec2(
        platformSchema.horizontalOrVertical
          ? platformSchema.xMovement
          : platformSchema.startX,
        !platformSchema.horizontalOrVertical
          ? platformSchema.yMovement
          : platformSchema.startY
      ),
        canMove: platformSchema.canMove,
      fixedUpdate(this: GameObj) {
        if (this.canMove && this.animDuration > 0) {
          const t = (getClientServerTime() % this.animDuration) / this.animDuration;
          const pingPongT = t < 0.5 ? t * 2 : (1 - t) * 2;
          this.pos = k.lerp(this.animStartPos, this.animEndPos, pingPongT);

        }
      },
    },
  ]);


  return platform;
}
export default {
  spawnPlatform,
};
