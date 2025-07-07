import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, Projectile } from "./schema/MyRoomState";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GRENADE_SHRAPNEL_COUNT,
} from "../../../globals";
import { fetchWords } from "../../../client/src/objs/randomWord";

export class MyRoom extends Room {
  maxClients = 2;
  private projectileId = 1;
  state = new MyRoomState();

  teamPlayersCount(team: "player1" | "player2" = "player1") {
    return [...this.state.players.values()].filter((p) => p.team == team)
      .length;
  }

  async populateWordList() {
    const wordList = this.state.wordList;
    let wordListToString: string[] = [...wordList];
    if (
      wordListToString.length === 0 ||
      wordListToString.length < GRENADE_SHRAPNEL_COUNT
    ) {
      wordListToString = await fetchWords();
      if (wordListToString.length === 0) {
        console.error("wordList empty, API call failed.");
        return;
      }
      // wordList.splice(0, wordList.length, ...wordListToString);

      wordList.push(...wordListToString);

      console.log("wordList set");
      //console.log(wordList);
    } else {
      console.log("wordList healthy");
    }
  }

  onCreate(options: any) {
    this.onMessage("populateWordList", async (client, message) => {
      this.populateWordList();
    });

    this.onMessage("spliceWordList", (client, message) => {
      const wordList = this.state.wordList;
      console.log(wordList);
      const startIndex = Math.max(0, wordList.length - message.amount);
      wordList.splice(startIndex, message.amount);
    });

    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.x = message.x;
      player.y = message.y;
    });

    this.onMessage("projectileMove", (client, message) => {
      const proj = this.state.projectiles.get(message.schemaId);
      proj.velX = message.velX;
      proj.velY = message.velY;
      proj.speed = message.speed;
    });
    this.onMessage("destroyProjectile", (client, message) => {
      console.log(
        `[Server] Received destroyProjectile from ${client.sessionId} for ${message.schemaId}`
      );
      if (this.state.projectiles.has(message.schemaId)) {
        this.state.projectiles.delete(message.schemaId);
      }
    });

    this.onMessage("dead", (client, message) => {
      //
      // handle "type" message
      //
    });

    this.onMessage("hit", (client, message) => {
      const player = this.state.players.get(message.receiver);
      player.hp -= message.damage;
    });

    this.onMessage("state", (client, message) => {
      console.log("STATE CALLED");
      console.log(message.sessionId);
      const player = this.state.players.get(message.sessionId);
      player.state = message.cmd;
    });

    // projectile
    this.onMessage("spawnProjectile", (client, message) => {
      console.log("Projectile spawn");
      const projectile = new Projectile();
      // Unique ID for the projectile
      projectile.objectUniqueId = `proj_${this.projectileId++}`;
      projectile.ownerSessionId = message.sessionId;
      projectile.projectileType = message.projectileType;
      projectile.spawnPosX = message.spawnPosX;
      projectile.spawnPosY = message.spawnPosY;
      projectile.dirX = message.dirX ?? 0;
      projectile.dirY = message.dirY ?? 0;
      projectile.velX = message.velX ?? 0;
      projectile.velY = message.velY ?? 0;
      projectile.speed = message.speed ?? 300;
      projectile.bounce = message.bounce ?? 0;
      projectile.angle = message.angle ?? 0;
      projectile.damage = message.damage ?? 0;
      projectile.objectOwner = message.projectileOwner;
      projectile.seeking = message.seeking ?? false;
      projectile.ignoreList = message.ignoreList ?? [];
      // Add to schema
      this.state.projectiles.set(projectile.objectUniqueId, projectile);
      console.log("projectile set");
    });

    // set bg ONCE
    if (this.state.backgroundId == "") {
      this.state.backgroundId = Math.floor(Math.random() * 7 + 1).toString();
      console.log("Selected background:", this.state.backgroundId);
    }
    // set word list ONCE
    this.populateWordList();
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.team = this.teamPlayersCount() % 2 ? "player2" : "player1";
    player.x = player.team == "player1" ? 100 : 1820;
    player.y = 840;
    player.hp = 100;
    player.sessionId = client.sessionId;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
