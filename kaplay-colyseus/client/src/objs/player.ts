import type { Collision, GameObj, TimerController, Vec2 } from "kaplay";
import type {
  MyRoomState,
  Player,
} from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";
import { Room } from "colyseus.js";
import {
  allowedStates,
  DEFAULT_WORD_BULLET_DAMAGE,
  DEFAULT_WORD_THROW_KNOCKBACK,
  DEFAULT_WORD_THROW_SPEED,
  FALLING_FAILSAFE_TIMER,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_PROJECTILE_SPAWN_OFFSET,
  THROW_ANGLE_OFFSET,
  THROW_SOUND_LIST,
  WALK_SOUND_LIST,
} from "../../../globals";
import { pickupHandler } from "./pickups";
import { getClientServerTime } from "../scenes/lobby";

function resetState(
  player: GameObj,
  room: Room<MyRoomState>,
  playerSchema: Player
) {
  if (playerSchema.hp <= 50 && playerSchema.hp > 0) {
    player.play("injured");
  } else {
    player.play("idle");
  }
  if (playerSchema.isCrouched) {
    if (playerSchema.sessionId === room.sessionId) {
      room.send("updatePlayerState", { key: "isCrouched", value: false });
    }
    player.area.shape = new k.Rect(k.vec2(0, 0), 30, 70);
  }
  if (playerSchema.sessionId === room.sessionId) {
    room.send("updatePlayerState", { key: "canExecuteCommands", value: true });
  }

  if (!playerSchema.isShielded) {
    if (playerSchema.sessionId === room.sessionId) {
      room.send("updatePlayerState", { key: "canBeDamaged", value: true });
    }
  }
}
function sendStateIfLocal(
  player: GameObj,
  room: Room<MyRoomState>,
  playerSchema: Player,
  cmd: string
) {
  if (playerSchema.sessionId === room.sessionId) {
    room.send("state", { cmd });
  }
}

function playerMovementStates(
  room: Room<MyRoomState>,
  player: GameObj,
  playerSchema: Player
) {
  // movement state
  player.onStateEnter("left", () => {
    if (player.isGrounded()) {
      k.debug.log("LEFT");
      k.play(k.choose(WALK_SOUND_LIST));
      if (playerSchema.sessionId === room.sessionId) {
        room.send("updatePlayerState", { key: "dirX", value: -1 });
        room.send("updatePlayerState", { key: "dirY", value: 0 });
      }

      player.applyImpulse(k.vec2(-1, 0).scale(playerSchema.speed));
      player.play("walk-left");
    }
  });

  player.onStateEnter("right", () => {
    if (player.isGrounded()) {
      k.play(k.choose(WALK_SOUND_LIST));
      if (playerSchema.sessionId === room.sessionId) {
        room.send("updatePlayerState", { key: "dirX", value: 1 });
        room.send("updatePlayerState", { key: "dirY", value: 0 });
      }

      player.applyImpulse(k.vec2(1, 0).scale(playerSchema.speed));
      player.play("walk-right");
    }
  });

  player.onStateEnter("jump", async () => {
    if (player.isGrounded()) {
      k.play("jump");
      player.jump(playerSchema.jumpStrength);
      player.play("jump");
    }
  });

  player.onStateEnter("jump right", async () => {
    if (player.isGrounded()) {
      k.play("jump");
      if (playerSchema.sessionId === room.sessionId) {
        room.send("updatePlayerState", { key: "dirX", value: 1 });
        room.send("updatePlayerState", { key: "dirY", value: 0 });
      }

      player.jump(playerSchema.leapStrength);
      player.applyImpulse(k.vec2(1, 0).scale(playerSchema.leapStrength));
      player.play("jump");
    }
  });

  player.onStateEnter("jump left", async () => {
    if (player.isGrounded()) {
      k.play("jump");
      if (playerSchema.sessionId === room.sessionId) {
        room.send("updatePlayerState", { key: "dirX", value: -1 });
        room.send("updatePlayerState", { key: "dirY", value: 0 });
      }

      player.jump(playerSchema.leapStrength);
      player.applyImpulse(k.vec2(-1, 0).scale(playerSchema.leapStrength));
      player.play("jump");
    }
  });

  player.onStateEnter("down", () => {
    const platform = player.curPlatform();
    if (platform && platform.has("platformEffector")) {
      platform.platformIgnore.add(player);
    }
    sendStateIfLocal(player, room, playerSchema, "idle");
  });

  player.onStateEnter("crouch", async () => {
    if (playerSchema.isCrouched) {
      player.play("crouched");
      return;
    }
    if (player.isGrounded()) {
      player.area.shape = new k.Rect(k.vec2(0, 0), 30, 30);
      player.play("crouch");
    }
  });
  player.onStateEnter("uncrouch", () => {
    if (player.isGrounded()) {
      player.play("uncrouch");
    }
  });

  player.onStateTransition("crouch", "idle", () => {
    if (playerSchema.sessionId === room.sessionId) {
      room.send("updatePlayerState", { key: "isCrouched", value: false });
    }

    k.debug.log(playerSchema.isCrouched);
  });
}

function playerDamagedStates(
  room: Room<MyRoomState>,
  player: GameObj,
  playerSchema: Player
) {
  player.onDeath(() => {
    if (room.sessionId === playerSchema.sessionId) {
      room.send("updatePlayerState", {
        key: "canExecuteCommands",
        value: false,
      });
    }

    player.play("death");
    player.untag("character");
    player.tag("dead");
  });

  player.onHurt(() => {
    if (playerSchema.canBeDamaged) {
      sendStateIfLocal(player, room, playerSchema, "hurt");
    }
  });

  player.onStateEnter("hurt", () => {
    if (room.sessionId === playerSchema.sessionId) {
      room.send("updatePlayerState", {
        key: "canExecuteCommands",
        value: false,
      });
      room.send("updatePlayerState", { key: "canBeDamaged", value: false });
    }

    if (playerSchema.hp > 0) {
      let inAir = !player.isGrounded();
      if (inAir) {
        console.log("hurt air");
        sendStateIfLocal(player, room, playerSchema, "air-knockback");
      } else {
        console.log("hurt ground");
        player.play("hurt", { pingpong: true });
      }
    }
  });
}

function playerDefenceStates(
  player: GameObj,
) {
  player.onStateEnter("block", async () => {
    player.play("block");
  });

  player.onStateEnter("deflect", async () => {
    player.play("deflect");
  });
}

function playerAttackStates(
  room: Room<MyRoomState>,
  player: GameObj,
  playerSchema: Player
) {
  player.onStateEnter("throw", () => {
    if (player.isGrounded()) {
      if (playerSchema.canThrow) {
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "canThrow", value: false });
        }
        player.play("throw");
      } else {
        sendStateIfLocal(player, room, playerSchema, "idle");
      }
    }
  });

  player.onStateEnter("throw up", () => {
    if (player.isGrounded()) {
      if (playerSchema.canThrow) {
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "canThrow", value: false });
        }
        player.play("throw-up");
      } else {
        sendStateIfLocal(player, room, playerSchema, "idle");
      }
    }
  });

  player.onStateEnter("throw down", () => {
    if (player.isGrounded()) {
      if (playerSchema.canThrow) {
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "canThrow", value: false });
        }

        player.play("throw-down");
      } else {
        sendStateIfLocal(player, room, playerSchema, "idle");
      }
    }
  });
  player.onStateEnter("grenade", () => {
    if (
      player.isGrounded() &&
      playerSchema.canGrenade &&
      playerSchema.grenadeCount > 0
    ) {
      if (playerSchema.sessionId === room.sessionId) {
        room.send("updatePlayerState", { key: "canGrenade", value: false });
        room.send("reduceQuantity", {
          type: "grenade",
          amount: 1,
        });
      }
      player.play("throw-grenade");
    } else {
      sendStateIfLocal(player, room, playerSchema, "idle");
    }
  });

  player.onStateEnter("deploy mine", () => {
    if (
      player.isGrounded() &&
      playerSchema.isCrouched &&
      playerSchema.mineCount > 0
    ) {
      player.play("deploy-mine");
      if (playerSchema.sessionId === room.sessionId) {
        room.send("reduceQuantity", {
          type: "mine",
          amount: 1,
        });
      }
    } else {
      sendStateIfLocal(player, room, playerSchema, "crouch");
    }
  });
}

function playerCollisionStates(
  room: Room<MyRoomState>,
  player: GameObj,
  playerSchema: Player
) {
  // collision
  player.onCollide("pickup", (pickup: GameObj) => {
    for (const tag in pickupHandler) {
      if (pickup.is(tag)) {
        pickupHandler[tag](pickup, playerSchema, room);
        break;
      }
    }
  });

  player.onCollide("mine", (mine: GameObj) => {
    if (!player.is(mine.deployer)) {
      k.play("minetrip");
      mine.jump();
    }
  });

  player.onCollide(
    "projectile",
    (proj: GameObj, col: Collision | undefined) => {
      const shouldDeflect = playerSchema.isDeflecting && col;
      const shouldHit =
        playerSchema.canBeDamaged &&
        !playerSchema.isBlocking &&
        !playerSchema.isDeflecting &&
        col;

      if (shouldDeflect) {
        k.play("deflect");
        const reflect = proj.dir.reflect(col.normal);
        if (playerSchema.sessionId === room.sessionId) {
          room.send("projectileBounce", {
            schemaId: proj.schemaId,
            reflectX: reflect.x,
            reflectY: reflect.y,
            speed: proj.speed * 1.5,
            isDeflect: true,
          });
        }
        return;
      }

      if (shouldHit) {
        k.play("hit");
        player.applyImpulse(proj.dir.scale(proj.knockBackForce));
        if (playerSchema.sessionId === room.sessionId) {
          room.send("hit", {
            damage: proj.damage,
            impulse: proj.dir.scale(proj.knockBackForce),
          });
          room.send("destroyProjectile", { schemaId: proj.schemaId });
        }

        proj.destroy();

        k.debug.log("Projectile -> Player -> Normal Hit");
        return;
      }

      if (playerSchema.isBlocking) {
        k.play("block");
      }

      k.debug.log("Projectile -> Player -> No hit, no deflect, delete");
      if (playerSchema.sessionId === room.sessionId) {
        room.send("destroyProjectile", { schemaId: proj.schemaId });
      }

      proj.destroy();
    }
  );
}

function playerAnimEnd(
  room: Room<MyRoomState>,
  player: GameObj,
  playerSchema: Player
) {
  player.onAnimEnd(async (anim: string) => {
    switch (anim) {
      case "crouch":
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "isCrouched", value: true });
          room.send("updatePlayerState", {
            key: "canExecuteCommands",
            value: true,
          });
        }
        break;
      case "uncrouch":
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "isCrouched", value: false });
        }
        player.area.shape = new k.Rect(k.vec2(0, 0), 30, 70);
        sendStateIfLocal(player, room, playerSchema, "idle");
        break;
      case "throw":
        const playerDir = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "dirX", value: playerDir.x });
          room.send("updatePlayerState", { key: "dirY", value: playerDir.y });
        }

        const spawnPos = playerDir.eq(k.vec2(1, 0))
          ? k.vec2(playerSchema.x + 200, playerSchema.y - 150)
          : k.vec2(playerSchema.x - 200, playerSchema.y - 150);

        if (playerSchema.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "wordBullet",
            spawnPosX: spawnPos.x,
            spawnPosY: spawnPos.y,
            dirX: playerDir.x,
            dirY: playerDir.y,
            projectileOwner: playerSchema.team,
            sessionId: room.sessionId,
            damage: DEFAULT_WORD_BULLET_DAMAGE,
            seeking: false,
            knockBackForce: DEFAULT_WORD_THROW_KNOCKBACK,
            speed: DEFAULT_WORD_THROW_SPEED,
            bounce: 0,
            ignoreList: [playerSchema.team],
          });
        }
        k.play(k.choose(THROW_SOUND_LIST));

        player.wait(playerSchema.throwCooldown, () => {
          if (playerSchema.sessionId === room.sessionId) {
            room.send("updatePlayerState", { key: "canThrow", value: true });
          }
        });
        sendStateIfLocal(player, room, playerSchema, "idle");
        break;
      case "throw-up":
        const baseDir = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const throwDirUp = baseDir
          .add(k.Vec2.fromAngle(-THROW_ANGLE_OFFSET))
          .unit();
        const spawnPosThrowUp = baseDir.eq(k.vec2(1, 0))
          ? k.vec2(playerSchema.x + 200, playerSchema.y - 150)
          : k.vec2(playerSchema.x - 200, playerSchema.y - 150);
        if (playerSchema.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "wordBullet",
            spawnPosX: spawnPosThrowUp.x,
            spawnPosY: spawnPosThrowUp.y,
            dirX: throwDirUp.x,
            dirY: throwDirUp.y,
            projectileOwner: playerSchema.team,
            sessionId: room.sessionId,
            damage: DEFAULT_WORD_BULLET_DAMAGE,
            seeking: false,
            knockBackForce: DEFAULT_WORD_THROW_KNOCKBACK,
            speed: DEFAULT_WORD_THROW_SPEED,
            bounce: 0,
            ignoreList: [player.team],
          });
          k.play(k.choose(THROW_SOUND_LIST));
        }
        player.wait(playerSchema.throwCooldown, () => {
          if (playerSchema.sessionId === room.sessionId) {
            room.send("updatePlayerState", { key: "canThrow", value: true });
          }
        });
        sendStateIfLocal(player, room, playerSchema, "idle");
        break;
      case "throw-down":
        const baseDirDown = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const throwDirDown = baseDirDown
          .add(k.Vec2.fromAngle(THROW_ANGLE_OFFSET))
          .unit();
        const spawnPosThrowDown = baseDirDown.eq(k.vec2(1, 0))
          ? k.vec2(
              player.pos.x + PLAYER_PROJECTILE_SPAWN_OFFSET.x,
              player.pos.y - PLAYER_PROJECTILE_SPAWN_OFFSET.y
            )
          : k.vec2(
              player.pos.x - PLAYER_PROJECTILE_SPAWN_OFFSET.x,
              player.pos.y - PLAYER_PROJECTILE_SPAWN_OFFSET.y
            );
        if (playerSchema.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "wordBullet",
            spawnPosX: spawnPosThrowDown.x,
            spawnPosY: spawnPosThrowDown.y,
            dirX: throwDirDown.x,
            dirY: throwDirDown.y,
            projectileOwner: playerSchema.team,
            sessionId: room.sessionId,
            damage: DEFAULT_WORD_BULLET_DAMAGE,
            seeking: false,
            knockBackForce: DEFAULT_WORD_THROW_KNOCKBACK,
            speed: DEFAULT_WORD_THROW_SPEED,
            bounce: 0,
            ignoreList: [playerSchema.team],
          });
          k.play(k.choose(THROW_SOUND_LIST));
        }
        player.wait(playerSchema.throwCooldown, () => {
          if (playerSchema.sessionId === room.sessionId) {
            room.send("updatePlayerState", { key: "canThrow", value: true });
          }
        });
        sendStateIfLocal(player, room, playerSchema, "idle");
        break;
      case "throw-grenade":
        const playerDirNade = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPosNade = playerDirNade.eq(k.vec2(1, 0))
          ? k.vec2(playerSchema.x + 100, playerSchema.y - 200)
          : k.vec2(playerSchema.x - 100, playerSchema.y - 200);
        if (playerSchema.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "grenade",
            spawnPosX: spawnPosNade.x,
            spawnPosY: spawnPosNade.y,
            dirX: playerDirNade.x,
            dirY: playerDirNade.y,
            sessionId: room.sessionId,
            projectileOwner: playerSchema.team,
            seeking: false,
          });
          k.play(k.choose(THROW_SOUND_LIST));
        }

        player.wait(playerSchema.grenadeCooldown, () => {
          if (playerSchema.sessionId === room.sessionId) {
            room.send("updatePlayerState", { key: "canGrenade", value: true });
          }
        });
        sendStateIfLocal(player, room, playerSchema, "idle");
        break;
      case "hurt":
        sendStateIfLocal(player, room, playerSchema, "idle");
        break;
      case "block":
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "isBlocking", value: true });
          player.wait(playerSchema.blockTime, () => {
            room.send("updatePlayerState", { key: "isBlocking", value: false });
            sendStateIfLocal(player, room, playerSchema, "idle");
          });
          break;
        }

      case "deflect":
        if (playerSchema.sessionId === room.sessionId) {
          room.send("updatePlayerState", { key: "isDeflecting", value: true });
          player.wait(playerSchema.deflectTime, () => {
            room.send("updatePlayerState", {
              key: "isDeflecting",
              value: false,
            });
            sendStateIfLocal(player, room, playerSchema, "idle");
          });
        }

        break;
      case "deploy-mine":
        k.play("deploymine");
        const playerDirMine = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPosMine = playerDirMine.eq(k.vec2(1, 0))
          ? k.vec2(playerSchema.x + 100, playerSchema.y - 10)
          : k.vec2(playerSchema.x - 100, playerSchema.y - 10);
        if (playerSchema.sessionId === room.sessionId) {
          room.send("spawnProjectile", {
            projectileType: "mine",
            spawnPosX: spawnPosMine.x,
            spawnPosY: spawnPosMine.y,
            dirX: playerDirMine.x,
            dirY: playerDirMine.y,
            sessionId: room.sessionId,
            projectileOwner: playerSchema.team,
            seeking: false,
          });
        }
        sendStateIfLocal(player, room, playerSchema, "crouch");
        break;
      case "death":
        if (room.sessionId === playerSchema.sessionId) {
          const winner = `You died.\n You are disconnected.`;
          k.add([
            k.text(winner, { font: "dogica", size: 80, align: "center" }),
            k.pos(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.4),
            k.anchor("center"),
          ]);
          k.destroyAll("character");
          k.destroyAll("solid");

          if (room.sessionId === playerSchema.sessionId) {
            room.send("dead");
          }
        }
        break;
      case "dash":
      case "walk-left":
      case "walk-right":
      case "landing":
      case "stand-up":
        sendStateIfLocal(player, room, playerSchema, "idle");
        break;
    }
  });
}

function playerRecoveryStates(
  room: Room<MyRoomState>,
  player: GameObj,
  playerSchema: Player
) {
  player.onGround(() => {
    if (playerSchema.hp > 0) {
      switch (playerSchema.state) {
        case "jump":
        case "falling":
          player.play("landing");
          k.play("flop");
          break;
      }
    }
  });

  player.onFall(() => {
    if (
      playerSchema.state !== "air-knockback" &&
      playerSchema.state !== "falling"
    ) {
      if (playerSchema.sessionId === room.sessionId) {
        room.send("updatePlayerState", {
          key: "canExecuteCommands",
          value: false,
        });
      }

      sendStateIfLocal(player, room, playerSchema, "falling");
    }
  });

  player.onFallOff(() => {
    if (
      playerSchema.state !== "air-knockback" &&
      playerSchema.state !== "falling"
    ) {
      if (playerSchema.sessionId === room.sessionId) {
        room.send("updatePlayerState", {
          key: "canExecuteCommands",
          value: false,
        });
      }

      sendStateIfLocal(player, room, playerSchema, "falling");
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
          canStandUpLoop.cancel();
          sendStateIfLocal(player, room, playerSchema, "stand-up");
        }
      } else if (player.curPlatform()) {
        canStandUpLoop.cancel();
        sendStateIfLocal(player, room, playerSchema, "stand-up");
      }
    });
  });

  player.onStateEnter("stand-up", async () => {
    player.stop();
    player.play("lying");
    k.play("flop");

    player.wait(playerSchema.airStunTime, () => {
      player.play("stand-up");
    });

    player.wait(playerSchema.airStunTime * 2, () => {
      sendStateIfLocal(player, room, playerSchema, "idle");
    });
  });

  player.onStateEnter("falling", () => {
    if (player.isFalling()) {
      player.play("fall");
      player.timeInFallState = Date.now();

      k.debug.log(player.timeInFallState);
    }
  });

  player.onStateUpdate("falling", async () => {
    if (player.timeInFallState !== -1) {
      if (Date.now() - player.timeInFallState >= FALLING_FAILSAFE_TIMER) {
        k.debug.log("failsafe activated stand up");
        player.play("landing");
        k.play("flop");
        player.timeinFallState = -1;
      }
    }
  });

  // idle
  player.onStateEnter("idle", () => {
    resetState(player, room, playerSchema);
  });
}
function playerUpdate(
  room: Room<MyRoomState>,
  player: GameObj,
  playerSchema: Player
) {
  playerMovementStates(room, player, playerSchema);
  playerDamagedStates(room, player, playerSchema);
  playerDefenceStates(player);
  playerAttackStates(room, player, playerSchema);
  playerCollisionStates(room, player, playerSchema);
  playerRecoveryStates(room, player, playerSchema);
  playerAnimEnd(room, player, playerSchema);


}
type Snapshot = {
  x: number;
  y: number;
  timestamp: number;
};

export class InterpolationBuffer {
  private snapshots: Snapshot[] = [];

  addSnapshot(x: number, y: number, timestamp: number) {
    this.snapshots.push({ x, y, timestamp });

    // Remove snapshots older than 100ms to keep the buffer lean
    const cutoff = getClientServerTime() - 0.5;
    this.snapshots = this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  interpolate(renderTime: number): { x: number; y: number } | null {
    if (this.snapshots.length < 2) return null;

    let older: Snapshot | undefined;
    let newer: Snapshot | undefined;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      const a = this.snapshots[i];
      const b = this.snapshots[i + 1];

      if (a.timestamp <= renderTime && b.timestamp >= renderTime) {
        older = a;
        newer = b;
        break;
      }
    }

    // Handle edge cases: too old or too new
    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    if (!older || !newer) {
      if (!older || !newer) {
        return { x: last.x, y: last.y }; // safer fallback
      }
    }

    const duration = newer.timestamp - older.timestamp;
    const tRaw = (renderTime - older.timestamp) / duration;
    const t = Math.max(0, Math.min(1, tRaw)); // Clamp between 0 and 1

    const x = older.x + (newer.x - older.x) * t;
    const y = older.y + (newer.y - older.y) * t;

    return { x, y };
  }
}

export default (room: Room<MyRoomState>, playerSchema: Player) => [
  k.sprite("character", {
    anim: "idle",
    flipX: playerSchema.flipped,
  }),
  k.area({
    shape: new k.Rect(k.vec2(0, 0), 30, 70),
    collisionIgnore: ["character"],
  }),
  k.body({ damping: 3 }),
  k.anchor("bot"),
  k.pos(playerSchema.x, playerSchema.y),
  k.scale(0),
  k.color(
    playerSchema.team === "player1" ? k.rgb(1, 255, 1) : k.rgb(255, 1, 1)
  ),
  k.health(playerSchema.hp, playerSchema.hp),
  k.timer(),
  k.state("idle", allowedStates),
  k.z(9999),
  "character",
  playerSchema.team,
  {
    isCorrectingMovement: false,
    buffer: new InterpolationBuffer(),
    timeInFallState: -1,

    add(this: GameObj) {
      k.tween(
        this.scale,
        k.vec2(3),
        0.25,
        (v) => (this.scale = v),
        k.easings.easeOutBack
      );
      if (playerSchema.sessionId === room.sessionId)
        onLocalPlayerCreated(room, this);
      playerUpdate(room, this, playerSchema);

      if (playerSchema.team === "player1") {
        room.send("updatePlayerState", { key: "dirX", value: 1 });
        room.send("updatePlayerState", { key: "dirY", value: 0 });
      } else {
        room.send("updatePlayerState", { key: "dirX", value: -1 });
        room.send("updatePlayerState", { key: "dirY", value: 0 });
      }
    },
    update(this: GameObj) {
      // client position to server syncing
      const serverPlayerPos = k.vec2(playerSchema.x, playerSchema.y);
      if (!vectorsAreClose(this.pos, serverPlayerPos, 0.5)) {
        if (room.sessionId === playerSchema.sessionId) {
          room.send("move", { x: this.pos.x, y: this.pos.y });
        }
      }

      // interpolate other player's position.
      if (room.sessionId !== playerSchema.sessionId) {
        const renderTime = getClientServerTime() - 0.1;
        const interp = this.buffer.interpolate(renderTime);

        if (interp) {
          this.pos.x = interp.x;
          this.pos.y = interp.y;
        }

        if (this.state !== playerSchema.state) {
          this.enterState(playerSchema.state);
          console.log("state corrected");
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
