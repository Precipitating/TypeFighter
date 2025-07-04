import { k } from "../App";
import playground from "../objs/playground";
import { getStateCallbacks, Room } from "colyseus.js";
import type {
  MyRoomState,
  Player,
} from "../../../server/src/rooms/schema/MyRoomState";
import player from "../objs/player";
import console from "../objs/console";
import projectile from "../objs/projectiles";
import platforms from "../objs/platforms";
import pickups from "../objs/pickups";

export function createLobbyScene() {
  k.scene("lobby", async (room: Room<MyRoomState>) => {
    const $ = getStateCallbacks(room);
    k.setGravity(2000);
    await projectile.populateWordList();
    k.add(playground());
    console.initConsole(room);
    const spritesBySessionId: Record<string, any> = {};

    // listen when a player is added on server state
    $(room.state).players.onAdd(async (player, sessionId) => {
      spritesBySessionId[sessionId] = await createPlayer(room, player);
      platforms.spawn(room);
      pickups.spawnRandomItem();
    });

    // listen when a player is removed from server state
    $(room.state).players.onRemove((player, sessionId) => {
      k.destroy(spritesBySessionId[sessionId]);
    });
  });
}

async function createPlayer(room: Room<MyRoomState>, playerState: Player) {
  // keep track of player sprites
  await k.loadSprite("character", "./assets/charactersheet.png", {
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

  return k.add(player(room, playerState))
}
