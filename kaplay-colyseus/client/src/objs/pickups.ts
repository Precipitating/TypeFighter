import type { GameObj } from "kaplay";
import projectile from "./projectiles";
import { k } from "../App";
import {
  MyRoomState,
  Pickup,
} from "../../../server/src/rooms/schema/MyRoomState";
import { Room } from "colyseus.js";

type ItemConfig = {
  tags: string[];
  getComponents: () => any[];
};

const itemConfigs: Record<string, ItemConfig> = {
  grenade: {
    tags: ["pickup", "grenadePickup"],
    getComponents: () => [k.circle(10), k.color(k.GREEN), k.outline(3)],
  },
  healthPack: {
    tags: ["pickup", "healthPickup"],
    getComponents: () => [
      k.rect(70, 50),
      k.color(k.RED),
      k.outline(3),
      {
        // add cross
        add() {
          this.add([k.rect(10, 40), k.pos(30, 5), k.color(k.WHITE)]);
          this.add([k.rect(45, 10), k.pos(13, 20), k.color(k.WHITE)]);
        },
      },
    ],
  },
  mine: {
    tags: ["pickup", "minePickup"],
    getComponents: () => [k.sprite("mine"), k.scale(2)],
  },
  seekingProjectile: {
    tags: ["pickup", "seekingPickup"],
    getComponents: () => [
      k.text("seeking bullet", {
        font: "Comic Sans MS",
        size: 20,
      }),
      k.color(255, 215, 0),
    ],
  },
};

function spawnRandomItem(room: Room<MyRoomState>, pickup: Pickup): GameObj {
  const config = itemConfigs[pickup.pickupType];
  const item = spawnItemFromConfig(pickup, config);

  return item;
}

function spawnItemFromConfig(pickup: Pickup, config: ItemConfig): GameObj {
  const item = k.add([
    k.pos(pickup.startX, pickup.startY),
    k.area({ collisionIgnore: ["solid"] }),
    k.opacity(1),
    k.animate({ relative: true }),
    ...(config.tags ?? []),
    ...config.getComponents(),
    {
      pickupId: pickup.objectUniqueId,
      pickupType: pickup.pickupType,
    },
  ]);

  // floating anim
  item.animate("pos", [k.vec2(0, 10), k.vec2(0, -10)], {
    duration: 1,
    direction: "ping-pong",
  });

  return item;
}

export const pickupHandler: Record<
  string,
  (item: GameObj, player: GameObj, room: Room<MyRoomState>) => void
> = {
  grenadePickup: function (item, player, room) {
    //++player.grenadeCount;
    room.send("pickupByPlayer", {
      pickupId: item.pickupId,
      pickupType: item.pickupType,
      sessionId: player.sessionId,
    });
    item.destroy();
  },
  healthPickup: function (item, player, room) {
    //player.hp += healthPackHeal;
    room.send("pickupByPlayer", {
      pickupId: item.pickupId,
      pickupType: item.pickupType,
      sessionId: player.sessionId,
    });
    item.destroy();
  },
  minePickup: function (item, player, room) {
    // ++player.mineCount;
    room.send("pickupByPlayer", {
      pickupId: item.pickupId,
      pickupType: item.pickupType,
      sessionId: player.sessionId,
    });
    item.destroy();
  },
  seekingPickup: function (item, player, room) {
    room.send("pickupByPlayer", {
      pickupId: item.pickupId,
      pickupType: item.pickupType,
      sessionId: player.sessionId,
    });
    if (player.sessionId === room.sessionId) {
      room.send("pickupByPlayer", {
        pickupId: item.pickupId,
        pickupType: item.pickupType,
        sessionId: player.sessionId,
      });
      item.destroy();
      room.send("spawnProjectile", {
        projectileType: "wordBullet",
        spawnPosX: item.pos.x,
        spawnPosY: item.pos.y,
        projectileOwner: player.team,
        sessionId: room.sessionId,
        damage: 10,
        seeking: true,
        knockBackForce: 300,
        speed: 500,
        bounce: 0,
        ignoreList: [player.team],
      });
    }
  },
};

export default {
  spawnRandomItem,
};
