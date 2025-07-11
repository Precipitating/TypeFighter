import { Room, Client } from "@colyseus/core";
import {
  MyRoomState,
  Pickup,
  Platform,
  Player,
  Projectile,
} from "./schema/MyRoomState";
import {
  GRENADE_SHRAPNEL_COUNT,
  getRandomFloat,
  getRandomInt,
  PLATFORM_SCALE,
  PLATFORM_X,
  PLATFORM_Y,
  PLATFORM_COUNT,
  PLATFORM_MOVE_X,
  PLATFORM_ANIM_DURATION,
  PLATFORM_MOVE_Y,
  PICKUP_SPAWN_TIME,
  VALID_PICKUP_SPAWN_LOCATION_X,
  VALID_PICKUP_SPAWN_LOCATION_Y,
  PICKUP_TYPES,
  HEALTH_PACK_HEAL_VAL,
  FONT_TYPES,
  BASE_TEXT_LENGTH
} from "../../../globals";
import { fetchWords } from "../../../client/src/objs/randomWord";

export class MyRoom extends Room {
  maxClients = 2;
  private projectileId = 0;
  private platformId = 0;
  private pickupId = 0;
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

      wordList.push(...wordListToString);

      console.log("wordList set");
    } else {
      console.log("wordList healthy");
    }
  }

  async populatePlatformSchema() {
    console.log("spawnPlatforms ran in server");
    const currentPlatformList = this.state.platforms;

    for (let i = 0; i < PLATFORM_COUNT; ++i) {
      const currPlatform = new Platform();
      currPlatform.startX = getRandomInt(PLATFORM_X.min, PLATFORM_X.max);
      currPlatform.startY = getRandomInt(PLATFORM_Y.min, PLATFORM_Y.max);
      currPlatform.r = getRandomInt(1, 255);
      currPlatform.g = getRandomInt(1, 255);
      currPlatform.b = getRandomInt(1, 255);
      currPlatform.scale = getRandomFloat(
        PLATFORM_SCALE.min,
        PLATFORM_SCALE.max
      );
      currPlatform.canMove = Math.random() < 0.5 ? false : true;
      currPlatform.objectUniqueId = `platform${this.platformId++}`;

      // correct overlap with existing platforms
      const platformDistCorrector = (): void => {
        currentPlatformList.forEach((platformInMap, id) => {
          if (platformInMap === currPlatform) return;

          const dx = currPlatform.startX - platformInMap.startX;
          const dy = currPlatform.startY - platformInMap.startY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const platformMapRadius = (288 * platformInMap.scale) / 2;
          const currPlatformRadius = (288 * currPlatform.scale) / 2;
          const minDist = platformMapRadius + currPlatformRadius;

          if (dist === 0) {
            currPlatform.startX += (Math.random() - 0.5) * 0.1;
            currPlatform.startY += (Math.random() - 0.5) * 0.1;
          } else if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            currPlatform.startX += nx * overlap;
            currPlatform.startY += ny * overlap;
          }
        });
      };

      // run the correction multiple times for better results
      for (let j = 0; j < 3; j++) {
        platformDistCorrector();
      }

      if (currPlatform.canMove) {
        currPlatform.horizontalOrVertical =
          getRandomFloat(0, 1) < 0.5 ? false : true;
        currPlatform.xMovement = getRandomInt(
          PLATFORM_MOVE_X.min,
          PLATFORM_MOVE_X.max
        );
        currPlatform.yMovement = getRandomInt(
          PLATFORM_MOVE_Y.min,
          PLATFORM_MOVE_Y.max
        );
        currPlatform.platformAnimateDuration = getRandomInt(
          PLATFORM_ANIM_DURATION.min,
          PLATFORM_ANIM_DURATION.max
        );
      }
      currentPlatformList.set(currPlatform.objectUniqueId, currPlatform);
    }
  }

  async spawnPickupItem() {
    const pickupMap = this.state.pickups;
    const delay =
      getRandomInt(PICKUP_SPAWN_TIME.min, PICKUP_SPAWN_TIME.max) * 1000;

    if (this.state) {
      setTimeout(() => {
        if (!this.state) return;
        const pickup = new Pickup();
        pickup.startX = getRandomInt(
          VALID_PICKUP_SPAWN_LOCATION_X.min,
          VALID_PICKUP_SPAWN_LOCATION_X.max
        );
        pickup.startY = getRandomInt(
          VALID_PICKUP_SPAWN_LOCATION_Y.min,
          VALID_PICKUP_SPAWN_LOCATION_Y.max
        );
        pickup.pickupType =
          PICKUP_TYPES[getRandomInt(0, PICKUP_TYPES.length - 1)];
        pickup.objectUniqueId = `pickup_${this.pickupId++}`;
        pickupMap.set(pickup.objectUniqueId, pickup);
        console.log("should call pickup onAdd");
        this.spawnPickupItem();
      }, delay);
    }
  }

  onCreate(options: any) {
    // words
    this.onMessage("populateWordList", async (client, message) => {
      this.populateWordList();
    });

    this.onMessage("spliceWordList", (client, message) => {
      const wordList = this.state.wordList;
      const startIndex = Math.max(0, wordList.length - message.amount);
      wordList.splice(startIndex, message.amount);
    });

    // player
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      // get other player's schema
      let otherPlayer = undefined;
      for (const [sessionId, p] of this.state.players) {
        if (sessionId !== client.sessionId) {
          otherPlayer = p;
          break;
        }
      }
      player.x = message.x;
      player.y = message.y;

      // update flip
      if (otherPlayer) {
        if (player.x - otherPlayer.x < 0 && player.flipped) {
          player.flipped = false;
          otherPlayer.flipped = true;
        } else if (player.x - otherPlayer.x > 0 && !player.flipped) {
          player.flipped = true;
          otherPlayer.flipped = false;
        }
      }
    });

    this.onMessage("reduceQuantity", (client, message) => {
      const player = this.state.players.get(message.sessionId);
      switch (message.type) {
        case "grenade":
          player.grenadeCount -= message.amount;
          break;
        case "mine":
          player.mineCount -= message.amount;
          break;
      }
    });

    this.onMessage("dead", (client, message) => {
      client.leave();

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
    this.onMessage("projectileMove", (client, message) => {
      const proj = this.state.projectiles.get(message.schemaId);
      if (proj) {
        proj.dirX = message.dirX;
        proj.dirY = message.dirY;
        proj.speed = message.speed;
      }
    });

    this.onMessage("projectileBounce", (client, message) => {
      console.log("Projectile server bounce called");
      const proj = this.state.projectiles.get(message.schemaId);
      if (proj) {
        proj.dirX = message.reflectX;
        proj.dirY = message.reflectY;
        proj.speed = message.speed ?? proj.speed;
        ++proj.deflectCount;
        if (!message?.isDeflect) {
          console.log("Bounce reduced");
          --proj.bounce;
        }
      }
    });
    this.onMessage("destroyProjectile", (client, message) => {
      if (this.state.projectiles.has(message.schemaId)) {
        console.log(
          `[Server] Received destroyProjectile from ${client.sessionId} for ${message.schemaId}`
        );

        this.state.projectiles.delete(message.schemaId);
      }
    });

    this.onMessage("reduceWordList", (client, message) => {
      this.state.wordList.pop();
    });

    this.onMessage("spawnProjectile", (client, message) => {
      console.log("Projectile spawn");
      const projectile = new Projectile();
      // Unique ID for the projectile
      projectile.objectUniqueId = `proj_${this.projectileId++}`;
      projectile.ownerSessionId = message.sessionId;
      projectile.projectileType = message.projectileType;
      projectile.fontType = FONT_TYPES[getRandomInt(0, FONT_TYPES.length - 1)];
      projectile.spawnPosX = message.spawnPosX;
      projectile.spawnPosY = message.spawnPosY;
      projectile.dirX = message.dirX ?? 0;
      projectile.dirY = message.dirY ?? 0;
      projectile.speed = message.speed ?? 300;
      projectile.bounce = message.bounce ?? 0;
      projectile.angle = message.angle ?? 0;
      projectile.damage = message.damage ?? 0;
      projectile.objectOwner = message.projectileOwner;
      projectile.seeking = message.seeking ?? false;
      projectile.ignoreList = message.ignoreList ?? [];
      projectile.knockBackForce = message.knockBackForce ?? 0;
      projectile.r = Math.random() < 0.5 ? getRandomInt(0,55) : getRandomInt(200,255) ;
      projectile.g = Math.random() < 0.5 ? getRandomInt(0,55) : getRandomInt(200,255) ;
      projectile.b = Math.random() < 0.5 ? getRandomInt(0,55) : getRandomInt(200,255) ;

      // adjust speed to be based on text length, base text length flies at base speed value
      const wordLength = this.state.wordList[this.state.wordList.length - 1].length;
      projectile.speed = projectile.speed * (BASE_TEXT_LENGTH / wordLength );
      console.log( this.state.wordList);
      
      // Add to schema
      this.state.projectiles.set(projectile.objectUniqueId, projectile);
      console.log("projectile set");
    });

    // background
    if (this.state.backgroundId == "") {
      this.state.backgroundId = Math.floor(Math.random() * 7 + 1).toString();
      console.log("Selected background:", this.state.backgroundId);
    }

    // set word list ONCE
    this.populateWordList();

    // platforms
    this.populatePlatformSchema();

    // PICKUP ITEMS
    this.spawnPickupItem();

    this.onMessage("pickupByPlayer", (client, message) => {
      console.log("pickup called on server");
      const player = this.state.players.get(message.sessionId);
      switch (message.pickupType) {
        case "healthPack":
          console.log("heal on server");
          player.hp += HEALTH_PACK_HEAL_VAL;
          break;
        case "grenade":
          console.log("grenade increment on server");
          ++player.grenadeCount;
          break;
        case "mine":
          console.log("mine increment on server");
          ++player.mineCount;
          break;
      }

      this.state.pickups.delete(message.pickupId);
    });

    // SERVER UPDATE
    let elapsedTime = 0;
    const fixedTimeStep = 1000 / 60;
    this.setSimulationInterval((deltaTime) => {
      elapsedTime += deltaTime;
      while (elapsedTime >= fixedTimeStep) {
        this.state.serverTime += fixedTimeStep / 1000;
        elapsedTime -= fixedTimeStep;
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.team = this.teamPlayersCount() % 2 ? "player2" : "player1";
    player.x = player.team == "player1" ? 100 : 1820;
    player.y = 840;
    player.hp = 100;
    player.sessionId = client.sessionId;
    player.flipped = player.team === "player1" ? false : true;

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
