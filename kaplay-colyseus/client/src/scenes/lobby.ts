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

export async function createLobbyScene() {
  k.scene("lobby", async (room: Room<MyRoomState>) => {
    const $ = getStateCallbacks(room);
    k.setGravity(2000);
    await projectile.populateWordList();
    k.add(playground());
    platforms.spawn(room);
    pickups.spawnRandomItem();
    console.initConsole(room);
    const spritesBySessionId: Record<string, any> = {};

    // listen when a player is added on server state
    $(room.state).players.onAdd(async (player, sessionId) => {
      const playerObj = createPlayer(room, player);
      spritesBySessionId[sessionId] = playerObj;
      
      $(player).listen("state", (newState, prevState)=>{
        playerObj.enterState(newState);
      })


    });

    // listen when a player is removed from server state
    $(room.state).players.onRemove((player, sessionId) => {
      k.destroy(spritesBySessionId[sessionId]);
    });


    $(room.state).listen("backgroundID", (id: string) =>{
      if (room.state.backgroundID)
        k.loadSprite("bg", `./assets/bgs/${id}.png`);
        k.add([k.sprite("bg"), k.pos(0, -300), k.scale(1, 0.9), k.z(-1)]);
    })
  });
}

function createPlayer(room: Room<MyRoomState>, playerState: Player) {
  return k.add(player(room, playerState));
}
