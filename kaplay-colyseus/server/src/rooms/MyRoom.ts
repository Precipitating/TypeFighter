import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";
import { GAME_HEIGHT, GAME_WIDTH } from "../../../globals";

export class MyRoom extends Room {
  maxClients = 2;
  state = new MyRoomState();

    teamPlayersCount(team: "player1" | "player2" = "player1") {   
        return [...this.state.players.values()].filter(p => p.team == team).length; 
    }

  onCreate (options: any) {
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.x = message.x;
      player.y = message.y;

    });

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });


    this.onMessage("hit", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.hp -= message.damage;

    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.team = this.teamPlayersCount() % 2 ? "player2" : "player1";
    player.x = player.team == "player1" ? 100 : 1820;
    player.y = 840;
    player.sessionId = client.sessionId;
    // get a random avatar for the player
    //player.avatar = avatars[Math.floor(Math.random() * avatars.length)];

    this.state.players.set(client.sessionId, player);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
