import type { Collision, Game, GameObj, Vec2 } from "kaplay";
import type {
  MyRoomState,
  Player,
} from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";
import { Room } from "colyseus.js";
import { allowedStates } from "../../../globals";
import projectile from "./projectiles";
import { pickupHandler } from "./pickups";

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
    room.send("dead", {winner: `${playerState.team === "player1" ? "player 2" : "player1"}`});
  });

  player.onHurt(() => {
    player.canExecuteCommands = false;
    if (player.hp > 0) {
      if (player.isFalling() || player.isJumping()) {
        console.log("hurt air");
        room.send("state", {cmd:"air-knockback"});
      } else {
        console.log("hurt normal");
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
          k.debug.log("landed");
          break;
        case "air-knockback":
          player.stop();
          player.play("lying");
          player.wait(player.airStunTime, () => {
            player.play("standup");
          });
          break;
        default:
          room.send("state",{cmd:"idle"});;
          break;
      }
    }
  });

  player.onFall(() => {
    player.canExecuteCommands = false;
    player.wait(0.1, () => {
      if (player.state !== "air-knockback" || player.state !== "falling") {
        room.send("state", {cmd:"falling"});
        k.debug.log("onFall executed");
      }
    });
  });

  player.onFallOff(() => {
    k.debug.log("fall off platform");
    player.canExecuteCommands = false;
    if (player.state !== "air-knockback" || player.state !== "falling") {
      room.send("state", {cmd:"falling"});
    }
  });

  // states
  player.onStateEnter("throw", async () => {
    if (player.isGrounded()) {
      if (player.canThrow) {
        player.canThrow = false;
        player.play("throw");
      } else {
        room.send("state",{cmd:"idle"});;
      }
    }
  });

  player.onStateEnter("throw up", async () => {
    if (player.isGrounded()) {
      if (player.canThrow) {
        player.canThrow = false;
        player.play("throw-up");
      } else {
        room.send("state",{cmd:"idle"});;
      }
    }
  });

  player.onStateEnter("throw down", async () => {
    if (player.isGrounded()) {
      if (player.canThrow) {
        player.canThrow = false;
        player.play("throw-down");
      } else {
        room.send("state",{cmd:"idle"});;
      }
    }
  });
  player.onStateEnter("grenade", () => {
    if (player.isGrounded() && player.canGrenade && player.grenadeCount > 0) {
      player.canGrenade = false;
      player.play("throw-grenade");
      --player.grenadeCount;
    } else {
      room.send("state",{cmd:"idle"});;
    }
  });

  player.onStateEnter("deploy mine", async () => {
    if (player.isGrounded() && player.crouched && player.mineCount > 0) {
      player.play("deploy-mine");
      --player.mineCount;
    } else {
      room.send("state", {cmd:"crouch"});
    }
  });

  player.onStateEnter("air-knockback", async () => {
    player.play("air-knockback");
  });

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
    k.debug.log(player.isGrounded());
    if (player.isGrounded()) {
      player.direction.x = 0;
      player.direction.y = 0;
      player.direction.x = 1;
      k.debug.log(player.direction);
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
      k.debug.log("fallin");
    }
  });

  player.onStateEnter("down", () => {
    const platform = player.curPlatform();
    if (platform && platform.has("platformEffector")) {
      platform.platformIgnore.add(player);
    }
    room.send("state",{cmd:"idle"});;
  });

  // idle
  player.onStateEnter("idle", () => {
    if (player.hp <= 50 && player.hp > 0) {
      player.play("injured");
    } else {
      player.play("idle");
    }

    player.canExecuteCommands = true;
    player.canBeDamaged = true;
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
        room.send("state",{cmd:"idle"});;
        break;
      case "throw":
        const playerDir = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPos = playerDir.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 200, player.pos.y - 150)
          : k.vec2(player.pos.x - 200, player.pos.y - 150);
        projectile.spawnWordBullet(
          spawnPos,
          playerDir,
          player.team === "player1" ? "player1" : "player2",
          false
        );
        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        room.send("state", {cmd:"idle"});
        break;
      case "throw-up":
        const baseDir = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const throwDirUp = baseDir.add(k.Vec2.fromAngle(-90)).unit();
        const spawnPosThrowUp = baseDir.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 200, player.pos.y - 150)
          : k.vec2(player.pos.x - 200, player.pos.y - 150);
        projectile.spawnWordBullet(
          spawnPosThrowUp,
          throwDirUp,
          player.team === "player1" ? "player1" : "player2",
          false
        );
        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        room.send("state", {cmd:"idle"});
        break;
      case "throw-down":
        const baseDirDown = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const throwDirDown = baseDirDown.add(k.Vec2.fromAngle(90)).unit();
        const spawnPosThrowDown = baseDirDown.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 200, player.pos.y - 150)
          : k.vec2(player.pos.x - 200, player.pos.y - 150);
        projectile.spawnWordBullet(
          spawnPosThrowDown,
          throwDirDown,
          player.team === "player1" ? "player1" : "player2",
          false
        );
        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        room.send("state", {cmd:"idle"});
        break;
      case "throw-grenade":
        const playerDirNade = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPosNade = playerDirNade.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 100, player.pos.y - 200)
          : k.vec2(player.pos.x - 100, player.pos.y - 200);
        projectile.spawnGrenade(spawnPosNade, playerDirNade);
        player.wait(player.grenadeCooldown, () => {
          player.canGrenade = true;
        });
        room.send("state", {cmd:"idle"});
        break;
      case "hurt":
        player.use(k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70) }));
        room.send("state", {cmd:"idle"});
        break;
      case "block":
        player.isBlocking = true;
        player.wait(player.blockTime, () => {
          player.isBlocking = false;
          room.send("state", {cmd:"idle"});
        });
        break;
      case "deflect":
        player.isDeflecting = true;
        player.wait(player.deflectTime, () => {
          player.isDeflecting = false;
          room.send("state", {cmd:"idle"});
        });
        break;
      case "deploy-mine":
        const playerDirMine = player.flipX ? k.vec2(-1, 0) : k.vec2(1, 0);
        const spawnPosMine = playerDirMine.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 100, player.pos.y - 10)
          : k.vec2(player.pos.x - 100, player.pos.y - 10);
        projectile.spawnMine(spawnPosMine, player.team);
        room.send("state", {cmd:"crouch"});
        break;
      case "dash":
      case "walk-left":
      case "walk-right":
      case "landing":
      case "standup":
        room.send("state", {cmd:"idle"});
        break;
    }
  });

  // collision
  player.onCollide("pickup", (pickup: GameObj) => {
    for (const tag in pickupHandler) {
      if (pickup.is(tag)) {
        pickupHandler[tag](pickup, player);
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
      if (
        player.canBeDamaged &&
        !player.isBlocking &&
        !player.isDeflecting &&
        col
      ) {
        player.hp -= proj.damage;
        player.applyImpulse(proj.vel.scale(proj.knockBackForce));
        proj.destroy();
      } else {
        if (player.isDeflecting) {
          if (col) {
            const reflect = proj.vel.reflect(col.normal);
            proj.speed *= 1.5;
            proj.vel = reflect;
          }
        } else {
          proj.destroy();
        }
      }
    }
  );
}

export default (room: Room<MyRoomState>, playerState: Player) => [
  k.sprite("character", {
    anim: "idle",
    flipX: playerState.team === "player2" ? true : false,
  }),
  k.area({
    shape: new k.Rect(k.vec2(0, 0), 30, 70),
    collisionIgnore: ["character"],
  }),
  k.body({ damping: 3 }),
  k.anchor("bot"),
  k.pos(playerState.x, playerState.y),
  k.scale(3),
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
    grenadeCount: 1,
    mineCount: 0,
    sessionId: playerState.sessionId,
    team: playerState.team,
    startPos: k.vec2(playerState.x, playerState.y),

    add(this: GameObj) {
      if (playerState.sessionId === room.sessionId)
        onLocalPlayerCreated(room, this);
      playerUpdate(room, this, playerState);
    },
    update(this: GameObj) {
      const serverPlayerPos = { x: playerState.x, y: playerState.y };
      const dist = k
        .vec2(this.pos.x, this.pos.y)
        .dist(k.vec2(serverPlayerPos.x, serverPlayerPos.y));
      if (dist > 1) {
        room.send("move", { x: this.pos.x, y: this.pos.y });
      }
    },
  },
];

function onLocalPlayerCreated(room: Room<MyRoomState>, playerObj: GameObj) {
  playerObj.tag("localPlayer");



  
}
