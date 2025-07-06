import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, Projectile } from "./schema/MyRoomState";
import { GAME_HEIGHT, GAME_WIDTH } from "../../../globals";

export class MyRoom extends Room {
  maxClients = 2;
  private projectileId = 1;
  state = new MyRoomState();

  teamPlayersCount(team: "player1" | "player2" = "player1") {
    return [...this.state.players.values()].filter((p) => p.team == team)
      .length;
  }

  onCreate(options: any) {
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.x = message.x;
      player.y = message.y;
    });

    this.onMessage("projectileMove", (client, message) => {
      const proj = this.state.projectiles.get(message.schemaID);
      proj.velX = message.velX;
      proj.velY = message.velY;
      proj.speed = message.speed;
    });
    this.onMessage("destroyProjectile", (client, message) => {
      if (this.state.projectiles.has(message.schemaID)){
        this.state.projectiles.delete(message.schemaID);
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
      const player = this.state.players.get(client.sessionId);
      player.state = message.cmd;
    });

    // projectile
    this.onMessage("spawnProjectile", (client, message) => {
      console.log("OI OI");
      const projectile = new Projectile();
      // Unique ID for the projectile
      projectile.objectUniqueID = `proj_${this.projectileId++}`;
      projectile.ownerSessionId = message.sessionID;
      // Type and movement
      projectile.projectileType = message.projectileType;
      projectile.spawnPosX = message.spawnPosX;
      projectile.spawnPosY = message.spawnPosY;
      projectile.dirX = message.dirX ?? 0;
      projectile.dirY = message.dirY ?? 0;
      // Initial velocity and speed
      projectile.velX = message.velX ?? 0;
      projectile.velY = message.velY ?? 0;
      projectile.speed = message.speed ?? 300;
      // Meta
      projectile.damage = message.damage ?? 0;
      projectile.objectOwner = message.projectileOwner;
      projectile.seeking = message.seeking ?? false;
      // Add to schema
      this.state.projectiles.set(projectile.objectUniqueID, projectile);
      console.log("projectile set");
    });

    // set bg ONCE
    if (this.state.backgroundID == "") {
      console.log("Selected background:", this.state.backgroundID);
      this.state.backgroundID = Math.floor(Math.random() * 7 + 1).toString();
    }
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
