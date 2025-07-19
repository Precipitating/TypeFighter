import { k } from "../App";
import playground from "../objs/playground";
import { getStateCallbacks, Room } from "colyseus.js";
import {
  Pickup,
  Platform,
  Projectile,
  type MyRoomState,
  type Player,
} from "../../../server/src/rooms/schema/MyRoomState";
import player from "../objs/player";
import ingameConsole from "../objs/console";
import projectile from "../objs/projectiles";
import pickups from "../objs/pickups";
import platform from "../objs/platforms";
import { HURT_SOUND_LIST, MUSIC_LIST } from "../../../globals";

let clientServerTime = 0;

export function getClientServerTime() {
  return clientServerTime;
}

async function HandleProjectilesFromServer(
  $: any,
  room: Room<MyRoomState>,
  spritesByProjId: Record<string, any>
) {
  // projectiles
  $(room.state).projectiles.onAdd(
    async (projectileSchema: Projectile, projId: string) => {
      switch (projectileSchema.projectileType) {
        case "wordBullet":
        case "shrapnel":
          spritesByProjId[projId] = projectile.spawnWordBullet(
            room,
            projectileSchema
          );
          break;
        case "grenade":
          spritesByProjId[projId] = projectile.spawnGrenade(
            room,
            projectileSchema
          );
          break;
        case "mine":
          spritesByProjId[projId] = await projectile.spawnMine(
            room,
            projectileSchema
          );
          break;
      }

      $(projectileSchema).listen("deflectCount", (newX: number, prevX: any) => {
        const proj = spritesByProjId[projId];
        if (newX > 0) {
          if (proj.is("wordBullet")) {
            const lastHitBy =
              proj.projectileOwner === "player1" ? "player2" : "player1";
            proj.collisionIgnore = [lastHitBy];
            k.debug.log(`${proj.collisionIgnore} now owns this projectile`);
            proj.projectileOwner = lastHitBy;
          }
          proj.dir.x = projectileSchema.dirX;
          proj.dir.y = projectileSchema.dirY;
          proj.speed = projectileSchema.speed;
        }
      });

      $(projectileSchema).listen(
        "bounce",
        (newBounceVal: any, oldBounceVal: any) => {
          console.log("Bounce reduction");
          const proj = spritesByProjId[projId];
          if (proj.bounce >= 0) {
            --proj.bounce;
          }
        }
      );
    }
  );

  $(room.state).projectiles.onRemove(
    async (projectileSchema: any, schemaId: string) => {
      //k.debug.log("projectile should be removed from server");
      const projObj = spritesByProjId[schemaId];
      if (projObj) {
        if (projObj.has("text")) {
          await k.tween(
            projObj.textSize,
            1,
            0.25,
            (v) => (projObj.textSize = v),
            k.easings.easeOutElastic
          );
        }
        k.destroy(projObj);
        delete spritesByProjId[schemaId];
      }
    }
  );
}
async function HandlePlayersFromServer(
  $: any,
  room: Room<MyRoomState>,
  spritesBySessionId: Record<string, any>
) {
  // player
  // listen when a player is added on server state
  $(room.state).players.onAdd(async (player: Player, sessionId: string) => {
    const playerObj = createPlayer(room, player);
    spritesBySessionId[sessionId] = playerObj;

    if (room.sessionId === player.sessionId) {
      ingameConsole.initConsole(room, player);
    }

    // handle player state
    $(player).listen("state", (newState: string, prevState: string) => {
      playerObj.enterState(newState);
    });

    $(player).listen("hp", (newHp: number, oldHp: number) => {
      playerObj.hp = newHp;
      if (newHp < oldHp) {
        k.debug.log(newHp);
        k.play(k.choose(HURT_SOUND_LIST));
      } else if (newHp > oldHp) {
        k.play("heal");
      }
    });

    $(player).listen("x", (newX: number, oldX: number) => {
      playerObj.buffer.addSnapshot(newX, player.y, getClientServerTime());
    });
    $(player).listen("y", (newY: number, oldY: number) => {
      playerObj.buffer.addSnapshot(player.x, newY, getClientServerTime());
    });

    $(player).listen(
      "flipped",
      (newFlipState: boolean, oldFlipState: boolean) => {
        playerObj.flipX = newFlipState;
      }
    );

    $(player).listen(
      "grenadeCount",
      (newGrenadeCount: number, oldGrenadeCount: number) => {
        if (newGrenadeCount > oldGrenadeCount) {
          k.play("pickup");
        }
      }
    );

    $(player).listen(
      "mineCount",
      (newMineCount: number, oldMineCount: number) => {
        if (newMineCount > oldMineCount) {
          k.play("pickup");
        }
      }
    );

    $(player).listen(
      "isShielded",
      async (newIsShielded: boolean, oldisShielded: boolean) => {
        if (newIsShielded) {
          if (room.sessionId === player.sessionId) {
            room.send("updatePlayerState", { key: "isShielded", value: true });
            room.send("updatePlayerState", {
              key: "canBeDamaged",
              value: false,
            });
          }

          await k.tween(
            playerObj.color,
            k.rgb(0, 0, 255),
            0.5,
            (v) => (playerObj.color = v),
            k.easings.easeOutQuad
          );
        } else {
          if (room.sessionId === player.sessionId) {
            room.send("updatePlayerState", { key: "isShielded", value: false });
            room.send("updatePlayerState", {
              key: "canBeDamaged",
              value: true,
            });
          }

          await k.tween(
            playerObj.color,
            player.team === "player1" ? k.rgb(1, 255, 1) : k.rgb(255, 1, 1),
            0.5,
            (v) => (playerObj.color = v),
            k.easings.easeOutQuad
          );
        }
      }
    );
  });

  // listen when a player is removed from server state
  $(room.state).players.onRemove(async (player: any, sessionId: string) => {
    const playerObj = spritesBySessionId[sessionId];
    await k.tween(
      playerObj.scale,
      k.vec2(0),
      0.25,
      (v) => (playerObj.scale = v),
      k.easings.easeOutQuad
    );
    k.destroy(spritesBySessionId[sessionId]);
  });
}

async function HandlePlatformsFromServer(
  $: any,
  room: Room<MyRoomState>,
  spritesByPlatformId: Record<string, any>
) {
  $(room.state).platforms.onAdd((platformSchema: Platform, sessionId: any) => {
    const currPlatform = platform.spawnPlatform(room, platformSchema);
    spritesByPlatformId[currPlatform.platformId] = currPlatform;
  });
}

async function HandlePickupsFromServer(
  $: any,
  room: Room<MyRoomState>,
  spritesByPickupId: Record<string, any>
) {
  $(room.state).pickups.onAdd((pickupSchema: Pickup, sessionId: any) => {
    if (spritesByPickupId[pickupSchema.objectUniqueId]) return;

    k.debug.log(
      `Spawn pickup ${pickupSchema.pickupType} at ${pickupSchema.startX}, ${pickupSchema.startY}`
    );
    const currPickup = pickups.spawnRandomItem(room, pickupSchema);
    spritesByPickupId[currPickup.pickupId] = currPickup;
  });

  $(room.state).pickups.onRemove(
    async (pickupSchema: any, schemaId: string) => {
      k.debug.log("pickup should be deleted");
      const pickupObj = spritesByPickupId[schemaId];

      if (pickupObj) {
        k.destroy(pickupObj);
        delete spritesByPickupId[schemaId];
      }
    }
  );
}

export async function createLobbyScene() {
  k.scene("lobby", async (room: Room<MyRoomState>) => {
    const $ = getStateCallbacks(room);
    k.setGravity(2000);
    playground();
    // theme
    k.play(k.choose(MUSIC_LIST), { loop: true, volume: 0.1 });
    const spritesBySessionId: Record<string, any> = {};
    const spritesByProjId: Record<string, any> = {};
    const spritesByPlatformId: Record<string, any> = {};
    const spritesByPickupId: Record<string, any> = {};

    HandleProjectilesFromServer($, room, spritesByProjId);
    HandlePlayersFromServer($, room, spritesBySessionId);
    HandlePlatformsFromServer($, room, spritesByPlatformId);
    HandlePickupsFromServer($, room, spritesByPickupId);

    // get a global background
    $(room.state).listen("backgroundId", (newBG, oldBG) => {
      if (room.state.backgroundId) {
        k.loadSprite("bg", `./assets/bgs/${room.state.backgroundId}.png`);
        k.add([k.sprite("bg"), k.pos(0, -300), k.scale(1, 0.9), k.z(-1)]);
      }
    });
    // set the initial values
    room.onStateChange((state) => {
      if (!clientServerTime && room.state.serverTime) {
        clientServerTime = room.state.serverTime;
      }
    });

    // Smooth serverTime update loop
    k.onUpdate(() => {
      if (!room || !room.state) return;
      const target = room.state.serverTime;
      const diff = target - clientServerTime;

      // Interpolation factor: smooth and stable
      clientServerTime += diff * 0.1;
    });
  });
}

function createPlayer(room: Room<MyRoomState>, playerSchema: Player) {
  return k.add(player(room, playerSchema));
}
