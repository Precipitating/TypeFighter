import type { Collision, Game, GameObj, TimerController, Vec2 } from "kaplay";
import type {
  MyRoomState,
  Player,
} from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";
import { Room } from "colyseus.js";
import { allowedStates, GAME_HEIGHT, GAME_WIDTH } from "../../../globals";
import projectile from "./projectiles";
import { pickupHandler } from "./pickups";

function resetState(player: GameObj) {
  if (player.hp <= 50 && player.hp > 0) {
    player.play("injured");
  } else {
    player.play("idle");
    if (player.crouched) {
      player.crouched = false;
    }
  }

  player.canExecuteCommands = true;
  player.canBeDamaged = true;
}
function sendStateIfLocal(
  player: GameObj,
  room: Room<MyRoomState>,
  cmd: string
) {
  if (player.sessionId === room.sessionId) {
    room.send("state", { cmd, sessionId: player.sessionId });
  }
}

function playerUpdate(
  room: Room<MyRoomState>,
  player: GameObj,
  playerState: Player
) {
  // events
  player.onDeath(() => {
    player.canExecuteCommands = false;
    player.play("death");
    player.untag("character");
    player.tag("dead");
  });

  player.onHurt(() => {
    sendStateIfLocal(player, room, "hurt");
  });

  player.onStateEnter("hurt", () => {
    player.canExecuteCommands = false;
    if (player.hp > 0) {
      let inAir = !player.isGrounded();
      if (inAir) {
        console.log("hurt air");
        player.enterState("air-knockback");
        sendStateIfLocal(player, room, "air-knockback");
      } else {
        console.log("hurt ground");
        player.play("hurt", { pingpong: true });
      }
    }
  });

  player.onGround(() => {
    if (player.hp > 0) {
      switch (player.state) {
        case "jump":
        case "falling":
          player.play("landing");
          break;
      }
    }
  });

  player.onFall(() => {
    player.canExecuteCommands = false;
    player.wait(0.1, () => {
      if (player.state !== "air-knockback" && player.state !== "falling") {
        sendStateIfLocal(player, room, "falling");
      }
    });
  });

  player.onFallOff(() => {
    player.canExecuteCommands = false;
    if (player.state !== "air-knockback" && player.state !== "falling") {
      sendStateIfLocal(player, room, "falling");
    }
  });

  // states
  player.onStateEnter("throw", async () => {
    if (player.isGrounded()) {
      if (player.canThrow) {
        player.canThrow = false;
        player.play("throw");
      } else {
        sendStateIfLocal(player, room, "idle");
      }
    }
  });

  player.onStateEnter("throw up", async () => {
    if (player.isGrounded()) {
      if (player.canThrow) {
        player.canThrow = false;
        player.play("throw-up");
      } else {
        sendStateIfLocal(player, room, "idle");
      }
    }
  });

  player.onStateEnter("throw down", async () => {
    if (player.isGrounded()) {
      if (player.canThrow) {
        player.canThrow = false;
        player.play("throw-down");
      } else {
        sendStateIfLocal(player, room, "idle");
      }
    }
  });
  player.onStateEnter("grenade", () => {
    if (player.isGrounded() && player.canGrenade && player.grenadeCount > 0) {
      player.canGrenade = false;
      player.play("throw-grenade");
      room.send("reduceQuantity", {
        sessionId: player.sessionId,
        type: "grenade",
        amount: 1,
      });
    } else {
      sendStateIfLocal(player, room, "idle");
    }
  });

  player.onStateEnter("deploy mine", async () => {
    if (player.isGrounded() && player.crouched && player.mineCount > 0) {
      player.play("deploy-mine");
      room.send("reduceQuantity", {
        sessionId: player.sessionId,
        type: "mine",
        amount: 1,
      });
    } else {
      sendStateIfLocal(player, room, "crouch");
    }
  });

  player.onStateEnter("air-knockback", async () => {
    player.play("air-knockback");

    const canStandUpLoop: TimerController = k.loop(0.5, () => {
      const ray = k.raycast(
        k.vec2(player.pos.x, player.pos.y - 20),
        k.vec2(0, 40),
        ["character", "projectile"]
      );
      if (ray) {
        k.debug.log(ray.point.dist(player.pos));
        if (ray.point.dist(player.pos) <= 10) {
          player.enterState("stand-up", { loopHandle: canStandUpLoop });
        }
      }
    });
  });

  player.onStateEnter(
    "stand-up",
    async (args: { loopHandle: { cancel: () => void } }) => {
      args.loopHandle.cancel();
      player.stop();
      player.play("lying");
      player.play("stand-up");
      player.wait(player.airStunTime, () => {
        player.enterState("idle");
      });
    }
  );

  // defensive state
  player.onStateEnter("block", async () => {
    player.play("block");
  });

  player.onStateEnter("deflect", async () => {
    player.play("deflect");
  });
  // movement state
  player.onStateEnter("left", () => {
    if (player.isGrounded()) {
      player.direction.x = 0;
      player.direction.y = 0;
      player.direction.x = -1;

      if (player.direction.eq(k.vec2(-1, 0))) {
        player.applyImpulse(player.direction.scale(player.speed));
        player.play("walk-left");
      }
    }
  });

  player.onStateEnter("right", () => {
    if (player.isGrounded()) {
      player.direction.x = 0;
      player.direction.y = 0;
      player.direction.x = 1;
      if (player.direction.eq(k.vec2(1, 0))) {
        player.applyImpulse(player.direction.scale(player.speed));
        player.play("walk-right");
      }
    }
  });

  player.onStateEnter("jump", async () => {
    if (player.isGrounded()) {
      player.jump(player.jumpStrength);
      player.play("jump");
    }
  });

  player.onStateEnter("jump right", async () => {
    if (player.isGrounded()) {
      player.direction.x = 0;
      player.direction.y = 0;
      player.direction.x = 1;
      player.jump(player.leapStrength);
      player.applyImpulse(player.direction.scale(player.leapStrength));
      player.play("jump");
    }
  });

  player.onStateEnter("jump left", async () => {
    if (player.isGrounded()) {
      player.direction.x = 0;
      player.direction.y = 0;
      player.direction.x = -1;
      player.jump(player.leapStrength);
      player.applyImpulse(k.vec2(-1, 0).scale(player.leapStrength));
      player.play("jump");
    }
  });

  player.onStateEnter("crouch", async () => {
    if (player.crouched) {
      player.play("crouched");
      return;
    }
    if (player.isGrounded()) {
      player.use(k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 30) }));
      player.play("crouch");
    }
  });
  player.onStateEnter("uncrouch", () => {
    if (player.isGrounded()) {
      player.play("uncrouch");
    }
  });

  player.onStateEnter("falling", async () => {
    if (player.isFalling()) {
      player.play("fall");
    }
  });

  player.onStateEnter("down", () => {
    const platform = player.curPlatform();
    if (platform && platform.has("platformEffector")) {
      platform.platformIgnore.add(player);
    }
    sendStateIfLocal(player, room, "idle");
  });

  // idle
  player.onStateEnter("idle", () => {
    resetState(player);
  });

  player.onStateTransition("crouch", "idle", () => {
    player.crouched = false;
  });

  // animation
  player.onAnimStart(async (anim: string) => {
    switch (anim) {
      case "hurt":
        player.canBeDamaged = false;
        break;
      case "air-knockback":
        player.canBeDamaged = false;
        break;
    }
  });

  player.onAnimEnd(async (anim: string) => {
    switch (anim) {
      case "crouch":
        player.crouched = true;
        player.canExecuteCommands = true;
        break;
      case "uncrouch":
        player.crouched = false;
        player.use(k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70) }));
        sendStateIfLocal(player, room, "idle");
        break;
      case "throw":
        const playerDir = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPos = playerDir.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 200, player.pos.y - 150)
          : k.vec2(player.pos.x - 200, player.pos.y - 150);

        if (player.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "wordBullet",
            spawnPosX: spawnPos.x,
            spawnPosY: spawnPos.y,
            dirX: playerDir.x,
            dirY: playerDir.y,
            projectileOwner: player.team,
            sessionId: room.sessionId,
            damage: 10,
            seeking: false,
            knockBackForce: 300,
            speed: 500,
            bounce: 0,
            ignoreList: [player.team],
          });
        }

        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        sendStateIfLocal(player, room, "idle");
        break;
      case "throw-up":
        const baseDir = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const throwDirUp = baseDir.add(k.Vec2.fromAngle(-90)).unit();
        const spawnPosThrowUp = baseDir.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 200, player.pos.y - 150)
          : k.vec2(player.pos.x - 200, player.pos.y - 150);
        if (player.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "wordBullet",
            spawnPosX: spawnPosThrowUp.x,
            spawnPosY: spawnPosThrowUp.y,
            dirX: throwDirUp.x,
            dirY: throwDirUp.y,
            projectileOwner: player.team,
            sessionId: room.sessionId,
            damage: 10,
            seeking: false,
            knockBackForce: 300,
            speed: 500,
            bounce: 0,
            ignoreList: ["localPlayer"],
          });
        }
        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        sendStateIfLocal(player, room, "idle");
        break;
      case "throw-down":
        const baseDirDown = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const throwDirDown = baseDirDown.add(k.Vec2.fromAngle(90)).unit();
        const spawnPosThrowDown = baseDirDown.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 200, player.pos.y - 150)
          : k.vec2(player.pos.x - 200, player.pos.y - 150);
        if (player.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "wordBullet",
            spawnPosX: spawnPosThrowDown.x,
            spawnPosY: spawnPosThrowDown.y,
            dirX: throwDirDown.x,
            dirY: throwDirDown.y,
            projectileOwner: player.team,
            sessionId: room.sessionId,
            damage: 10,
            seeking: false,
            knockBackForce: 300,
            speed: 500,
            bounce: 0,
            ignoreList: ["localPlayer"],
          });
        }
        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        sendStateIfLocal(player, room, "idle");
        break;
      case "throw-grenade":
        const playerDirNade = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPosNade = playerDirNade.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 100, player.pos.y - 200)
          : k.vec2(player.pos.x - 100, player.pos.y - 200);
        if (player.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "grenade",
            spawnPosX: spawnPosNade.x,
            spawnPosY: spawnPosNade.y,
            dirX: playerDirNade.x,
            dirY: playerDirNade.y,
            sessionId: room.sessionId,
            projectileOwner: player.team,
            seeking: false,
          });
        }

        player.wait(player.grenadeCooldown, () => {
          player.canGrenade = true;
        });
        sendStateIfLocal(player, room, "idle");
        break;
      case "hurt":
        player.use(
          k.area({
            shape: new k.Rect(k.vec2(0, 0), 30, 70),
            collisionIgnore: ["character"],
          })
        );
        resetState(player);
        break;
      case "block":
        player.isBlocking = true;
        player.wait(player.blockTime, () => {
          player.isBlocking = false;
          sendStateIfLocal(player, room, "idle");
        });
        break;
      case "deflect":
        player.isDeflecting = true;
        player.wait(player.deflectTime, () => {
          player.isDeflecting = false;
          sendStateIfLocal(player, room, "idle");
        });
        break;
      case "deploy-mine":
        const playerDirMine = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPosMine = playerDirMine.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 100, player.pos.y - 10)
          : k.vec2(player.pos.x - 100, player.pos.y - 10);
        if (player.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "mine",
            spawnPosX: spawnPosMine.x,
            spawnPosY: spawnPosMine.y,
            dirX: playerDirMine.x,
            dirY: playerDirMine.y,
            sessionId: room.sessionId,
            projectileOwner: player.team,
            seeking: false,
          });
        }
        sendStateIfLocal(player, room, "crouch");
        break;
      case "death":
        if (room.sessionId === player.sessionId) {
          const winner = `${
            playerState.team === "player1" ? "player 2" : "player1"
          } has won. \n You are disconnected.`;

          k.add([
            k.text(winner, { font: "dogica-bold", size: 80 }),
            k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
            k.anchor("center"),
          ]);

          room.send("dead");
        }
        break;
      case "dash":
      case "walk-left":
      case "walk-right":
      case "landing":
        sendStateIfLocal(player, room, "idle");
        break;
    }
  });

  // collision
  player.onCollide("pickup", (pickup: GameObj) => {
    for (const tag in pickupHandler) {
      if (pickup.is(tag)) {
        pickupHandler[tag](pickup, player, room);
        break;
      }
    }
  });

  player.onCollide("mine", (mine: GameObj) => {
    if (!player.is(mine.deployer)) {
      mine.jump();
    }
  });

  player.onCollide(
    "projectile",
    (proj: GameObj, col: Collision | undefined) => {
      const shouldHit =
        player.canBeDamaged &&
        !player.isBlocking &&
        !player.isDeflecting &&
        col;

      const shouldDeflect = player.isDeflecting && col;

      if (shouldHit) {
        player.applyImpulse(proj.dir.scale(proj.knockBackForce));
        room.send("hit", {
          damage: proj.damage,
          receiver: player.sessionId,
        });

        room.send("destroyProjectile", {
          schemaId: proj.schemaId,
        });

        k.debug.log("Projectile -> Player -> Normal Hit");
        return;
      }

      if (shouldDeflect) {
        const reflect = proj.dir.reflect(col.normal);

        room.send("projectileBounce", {
          schemaId: proj.schemaId,
          reflectX: reflect.x,
          reflectY: reflect.y,
          speed: proj.speed * 1.5,
          isDeflect: true,
        });

        return;
      }
      k.debug.log("Projectile -> Player -> No hit, no deflect, delete");
      room.send("destroyProjectile", {
        schemaId: proj.schemaId,
      });
    }
  );
}

export default (room: Room<MyRoomState>, playerState: Player) => [
  k.sprite("character", {
    anim: "idle",
    flipX: playerState.flipped,
  }),
  k.area({
    shape: new k.Rect(k.vec2(0, 0), 30, 70),
    collisionIgnore: ["character"],
  }),
  k.body({ damping: 3 }),
  k.anchor("bot"),
  k.pos(playerState.x, playerState.y),
  k.scale(0),
  k.color(playerState.team === "player1" ? k.rgb(1, 255, 1) : k.rgb(255, 1, 1)),
  k.health(playerState.hp, playerState.hp),
  k.timer(),
  k.state("idle", allowedStates),
  k.z(9999),
  "character",
  playerState.team,
  {
    speed: 300,
    direction: playerState.team === "player1" ? k.vec2(1, 0) : k.vec2(-1, 0),
    canThrow: true,
    canGrenade: true,
    isBlocking: false,
    isDeflecting: false,
    grenadeCooldown: 3,
    throwCooldown: 0.5,
    airStunTime: 1,
    blockTime: 1,
    deflectTime: 0.5,
    crouched: false,
    canExecuteCommands: true,
    canBeDamaged: true,
    jumpStrength: 2700,
    leapStrength: 1700,
    grenadeCount: playerState.grenadeCount,
    mineCount: playerState.mineCount,
    sessionId: playerState.sessionId,
    team: playerState.team,
    startPos: k.vec2(playerState.x, playerState.y),

    add(this: GameObj) {
      k.tween(
        this.scale,
        k.vec2(3),
        0.25,
        (v) => (this.scale = v),
        k.easings.easeOutBack
      );
      if (playerState.sessionId === room.sessionId)
        onLocalPlayerCreated(room, this);
      playerUpdate(room, this, playerState);
    },
    update(this: GameObj) {
      const serverPlayerPos = k.vec2(playerState.x, playerState.y);
      if (
        !vectorsAreClose(
          this.pos,
          k.vec2(serverPlayerPos.x, serverPlayerPos.y),
          1
        )
      ) {
        if (room.sessionId === playerState.sessionId) {
          room.send("move", { x: this.pos.x, y: this.pos.y });
        }
      }

      // sync client positions
      if (room.sessionId !== this.sessionId) {
        if (
          !vectorsAreClose(
            this.pos,
            k.vec2(serverPlayerPos.x, serverPlayerPos.y),
            5
          )
        ) {
          if ((room.sessionId !== playerState.sessionId)) {
            this.pos.x = k.lerp(this.pos.x, serverPlayerPos.x, k.dt());
            this.pos.y = k.lerp(this.pos.y, serverPlayerPos.y, k.dt());
          }
        }
      }
    },
  },
];

function onLocalPlayerCreated(room: Room<MyRoomState>, playerObj: GameObj) {
  playerObj.tag("localPlayer");
}

function vectorsAreClose(v1: Vec2, v2: Vec2, tolerance = 0.5): boolean {
  return v1.dist(v2) <= tolerance;
}
