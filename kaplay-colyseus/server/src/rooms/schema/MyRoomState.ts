import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") public sessionId: string;
  @type("string") public userId: string;
  @type("string") public name: string;
  @type("number") public x: number = 0;
  @type("number") public y: number = 0;
  @type("string") public state: string = "idle";
  @type("string") public team: "player1" | "player2" = "player1";
  @type("number") public hp: number = 100;
  @type("boolean") public dead: boolean = false;
}

export class Projectile extends Schema {
  @type("number") public x: number = 0;
  @type("number") public y: number = 0;
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") public backgroundID: string = "";
}
