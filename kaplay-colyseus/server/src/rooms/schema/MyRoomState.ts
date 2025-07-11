import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") public sessionId: string;
  @type("string") public userId: string;
  @type("string") public name: string;
  @type("number") public x: number = 0;
  @type("number") public y: number = 0;
  @type("string") public state: string = "idle";
  @type("string") public team: "player1" | "player2" = "player1";
  @type("number") public hp: number;
  @type("number") public grenadeCount: number = 0;
  @type("number") public mineCount: number = 0;
  @type("boolean") public dead: boolean = false;
  @type("boolean") public flipped: boolean = false;
}

export class Projectile extends Schema {
  @type("string") public projectileType: string = "";
  @type(["string"]) public ignoreList: ArraySchema<string> =
    new ArraySchema<string>();
  @type("number") public spawnPosX: number = 0;
  @type("number") public spawnPosY: number = 0;
  @type("number") public speed: number = 0;
  @type("number") public dirX: number = 0;
  @type("number") public dirY: number = 0;
  @type("string") public objectOwner: string = "";
  @type("string") public ownerSessionId: string = "";
  @type("string") public objectUniqueId: string = "";
  @type("number") public damage: number = 0;
  @type("number") public bounce: number = 0;
  @type("number") public angle: number = 0;
  @type("number") public deflectCount: number = 0;
  @type("number") public knockBackForce: number = 0;
  @type("boolean") public seeking: boolean = false;
}

export class Platform extends Schema {
  @type("string") public platformType: string = "";

  @type("number") public startX: number = 0;
  @type("number") public startY: number = 0;

  @type("number") public r: number = 0;
  @type("number") public g: number = 0;
  @type("number") public b: number = 0;

  @type("number") public scale: number = 0;

  @type("string") public ownerSessionId: string = "";
  @type("string") public objectUniqueId: string = "";

  @type("boolean") public canMove: boolean = false;
  @type("boolean") public horizontalOrVertical: boolean = false;
  @type("number") public xMovement: number = 0;
  @type("number") public yMovement: number = 0;
  @type("number") public platformAnimateDuration: number = 0;
}


export class Pickup extends Schema {
  @type("number") public startX: number = 0;
  @type("number") public startY: number = 0;
  
  @type("string") public objectUniqueId: string = "";

  @type("string") public pickupType: string = "";

  @type("number") public lifespan: number = 0;


}


export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Projectile }) projectiles = new MapSchema<Projectile>();
  @type({ map: Platform }) platforms = new MapSchema<Platform>();
  @type({ map: Pickup }) pickups = new MapSchema<Pickup>();

  @type("string") public backgroundId: string = "";
  @type(["string"]) public wordList: ArraySchema<string> =
    new ArraySchema<string>();
  @type("number") public serverDeltaTime: number = 0;
}
