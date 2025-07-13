import type { GameObj } from "kaplay";
import projectile from "./projectiles";
import { k } from "../App";
import {
  MyRoomState,
  Pickup,
} from "../../../server/src/rooms/schema/MyRoomState";
import { Room } from "colyseus.js";

const spawnTimeMin = 5;
const spawnTimeMax = 20;
const healthPackHeal = 30;

type ItemConfig = {
  tags: string[];
  lifespan: number;
  getComponents: () => any[];
};

const itemConfigs: Record<string, ItemConfig> = {
  grenade: {
    tags: ["pickup", "grenadePickup"],
    lifespan: 20,
    getComponents: () => [k.circle(10), k.color(k.GREEN), k.outline(3)],
  },
  healthPack: {
    tags: ["pickup", "healthPickup"],
    lifespan: 10,
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
    lifespan: 10,
    getComponents: () => [k.sprite("mine"), k.scale(2)],
  },
  seekingProjectile: {
    tags: ["pickup", "seekingPickup"],
    lifespan: 10,
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
    k.lifespan(config.lifespan, { fade: 0.5 }),
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
  },
  healthPickup: function (item, player, room) {
    //player.hp += healthPackHeal;
    room.send("pickupByPlayer", {
      pickupId: item.pickupId,
      pickupType: item.pickupType,
      sessionId: player.sessionId,
    });
  },
  minePickup: function (item, player, room) {
    // ++player.mineCount;
    room.send("pickupByPlayer", {
      pickupId: item.pickupId,
      pickupType: item.pickupType,
      sessionId: player.sessionId,
    });
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
    // add later
    //const proj = projectile.spawnWordBullet(item.pos, k.vec2(1,0), player.team, true);
    //item.destroy();
  },
};

export default {
  spawnRandomItem,
};
