import { type GameObj, type KAPLAYCtx } from "kaplay";
import projectile from "./Projectile";

function playerUpdate(k: KAPLAYCtx, player: GameObj) {
// damaged
  player.onDeath(() => {
    player.play("death");
    player.untag("character");
    player.tag("dead");
  });

  player.onHurt(() => {
    if (player.hp() > 0) {
      console.log("hurt");
      player.play("hurt", { pingpong: true });
    }
  });

  player.onGround(() => {
    if (player.hp() > 0) {
      player.enterState("idle");
    }
  });

  player.onStateEnter("stunned", async () => {
    player.wait(player.stunTime, () => {
      player.enterState("idle");
    });
  });

  // attacks
  player.onStateEnter("throw", async () => {
    if (player.isGrounded()) {
      if (player.canThrow) {
        player.canThrow = false;
        player.play("throw");
      } else {
        player.enterState("idle");
      }
    }
  });

  player.onStateEnter("grenade", () => {
    if (player.isGrounded() && player.canGrenade) {
      player.canGrenade = false;
      player.play("throw-grenade");
    } else {
      player.enterState("idle");
    }
  });
  player.onStateUpdate("right", () => {
    if (player.isGrounded()) {
      player.direction.x = 0;
      player.direction.y = 0;
      player.direction.x = 1;

      if (player.direction.eq(k.vec2(1, 0))) {
        player.move(player.direction.scale(player.speed));
        player.play("walk-right");
      }
    }
  });

  // defensive
  player.onStateEnter("block", async () => {
    player.play("block");
  });

  player.onStateEnter("deflect", async () => {
    player.play("deflect");

  });
  // movement
  player.onStateUpdate("left", () => {
    if (player.isGrounded()) {
      player.direction.x = 0;
      player.direction.y = 0;
      player.direction.x = -1;

      if (player.direction.eq(k.vec2(-1, 0))) {
        player.move(player.direction.scale(player.speed));
        player.play("walk-left");
      }
    }
  });

  player.onStateEnter("up", async () => {
    if (player.isGrounded()) {
      player.jump(1200);
      player.play("jump");
    }
  });

  player.onStateEnter("down", async () => {
    if (player.isGrounded()) {
      player.use(k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 30) }));
      player.play("crouch");
    }
  });

  // idle
  player.onStateEnter("idle", async () => {
    player.play("idle");
  });

  // animation
  player.onAnimEnd(async (anim: string) => {
    switch (anim) {
      case "crouch":
        player.play("uncrouch");
        break;
      case "uncrouch":
        player.use(k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70) }));
        player.enterState("idle");
        break;
      case "throw":
        const playerDir = player.is("player1") ? k.vec2(1, 0) : k.vec2(-1, 0);
        const spawnPos = player.is("player1")
          ? k.vec2(player.pos.x + 250, player.pos.y - 200)
          : k.vec2(player.pos.x - 250, player.pos.y - 200);
        projectile.spawnWordBullet(k, spawnPos, playerDir);
        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        player.enterState("idle");
        break;
      case "throw-grenade":
        const playerDirNade = player.is("player1")
          ? k.vec2(1, 0)
          : k.vec2(-1, 0);
        const spawnPosNade = player.is("player1")
          ? k.vec2(player.pos.x + 200, player.pos.y - 300)
          : k.vec2(player.pos.x - 200, player.pos.y - 300);
        projectile.spawnGrenade(k, spawnPosNade, playerDirNade);
        player.wait(player.grenadeCooldown, () => {
          player.canGrenade = true;
        });
        player.enterState("idle");
        break;
      case "hurt":
        player.use(k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70) }));
        player.enterState("stunned");
        break;
      case "block":
        player.isBlocking = true;
        player.wait(player.blockTime, () => {
          player.isBlocking = false;
          player.enterState("idle");
        });      
        break;
    case "deflect":
        player.isDeflecting = true;
        player.wait(player.deflectTime, () => {
        player.isDeflecting = false;
        player.enterState("idle");
        }); 
        break;
      case "dash":
      case "walk-left":
      case "walk-right":
        player.enterState("idle");
        break;
    }
  });
}

function initPlayer(
  k: KAPLAYCtx,
  tag: "player1" | "player2",
  posX: number,
  allowedStates: string[],
  flipX = false,
  dir = k.RIGHT
) {
  const player = k.add([
    k.sprite("character", {
      anim: "idle",
      flipX,
    }),
    k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70) }),
    k.body({ mass: 1 }),
    k.anchor("bot"),
    k.pos(posX, 500),
    k.scale(4),
    k.health(100),
    k.timer(),
    k.state("idle", allowedStates),
    "character",
    tag,
    {
      speed: 8000,
      direction: dir,
      canThrow: true,
      canGrenade: true,
      isBlocking: false,
      isDeflecting: false,
      grenadeCooldown: 3,
      throwCooldown: 0.5,
      stunTime: 0.5,
      blockTime: 1,
      deflectTime: 0.5
    }
  ]);
  return player;
}

export default {
  initPlayer,
  playerUpdate,
};
