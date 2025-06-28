import { type Vec2, type GameObj, type KAPLAYCtx } from "kaplay";
import projectile from "./Projectile";

function playerUpdate(k: KAPLAYCtx, player: GameObj) {
// events
  player.onDeath(() => {
    player.canExecuteCommands = false;
    player.play("death");
    player.untag("character");
    player.tag("dead");
  });

  player.onHurt(() => {
    player.canExecuteCommands = false;
    if (player.hp > 0) {
      if (player.isFalling() || player.isJumping()){
        console.log("hurt air");
        player.enterState("air-knockback");
      }
      else{
        console.log("hurt normal");
        player.play("hurt", { pingpong: true });
      }

    }
  });

  player.onGround(() => {
    if (player.hp > 0) {
      switch (player.state)
      {
        case "up":
        case "fall":
          player.play("landing");
          break;
        case "air-knockback":
          player.stop();
          player.play("lying");
          player.wait(player.airStunTime, () => {
            player.play("standup");
         });
          break;
        default:
          player.enterState("idle");
          break;
      }
    
    }
  });

  player.onFall(()=>{
    player.canExecuteCommands = false;
    if (player.state !== "air-knockback"){
      player.enterState("falling");
    }


  });

  player.onFallOff(()=>{
    console.log("fall off platform");
    player.canExecuteCommands = false;
    if (player.state !== "air-knockback"){
      player.enterState("falling");
    }


  });



  // states
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
      player.jump(player.jumpStrength);
      player.play("jump");
    }
  });

  player.onStateEnter("crouch", async () => {
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
    if (player.isFalling()){
      player.play("fall");
      console.log("fallin");

    }
    
  });

  player.onStateEnter("down", () => {
    const platform = player.curPlatform();
    if (platform && platform.has("platformEffector")){
      platform.platformIgnore.add(player);
    }
    player.enterState("idle");
    
  });

  // idle
  player.onStateEnter("idle", () => {
    player.play("idle");
    player.canExecuteCommands = true;
    player.canBeDamaged = true;
  });

  player.onStateTransition("crouch", "idle", () =>{
    player.crouched = false;
  });

  // animation

  player.onAnimStart(async(anim: string) => {
    switch (anim){
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
        player.enterState("idle");
        break;
      case "throw":
        const playerDir = player.flipX ? k.vec2(-1, 0) : (k.vec2(1, 0) as Vec2);
        const spawnPos = playerDir.eq(k.vec2(1, 0))
          ? k.vec2(player.pos.x + 200, player.pos.y - 150)
          : k.vec2(player.pos.x - 200, player.pos.y - 150);
        projectile.spawnWordBullet(k, spawnPos, playerDir);
        player.wait(player.throwCooldown, () => {
          player.canThrow = true;
        });
        player.enterState("idle");
        break;
      case "throw-grenade":
        const playerDirNade = player.flipX
          ? k.vec2(-1, 0)
          : (k.vec2(1, 0) as Vec2);
        const spawnPosNade = playerDirNade.eq(k.vec2(-1, 0))
          ? k.vec2(player.pos.x - 100, player.pos.y - 200)
          : (k.vec2(player.pos.x + 100, player.pos.y - 200) as Vec2);

        projectile.spawnGrenade(k, spawnPosNade, playerDirNade);
        player.wait(player.grenadeCooldown, () => {
          player.canGrenade = true;
        });
        player.enterState("idle");
        break;
      case "hurt":
        player.use(k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70) }));
        player.wait(player.stunTime, () => {
          player.enterState("idle");
        });
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
      case "standup":
        player.enterState("idle");
        break;
      case "dash":
      case "walk-left":
      case "walk-right":
      case "landing":
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
  dir = k.RIGHT,
  col = k.color(255,255,255)
) {
  const player = k.add([
    k.sprite("character", {
      anim: "idle",
      flipX,
    }),
    k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70), collisionIgnore:["player1", "player2"] }),
    k.body({damping: 3}),
    k.anchor("bot"),
    k.pos(posX, 500),
    k.scale(3),
    col,
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
      throwCooldown: 1,
      stunTime: 0.5,
      airStunTime: 1,
      blockTime: 1,
      deflectTime: 0.5,
      crouched: false,
      canExecuteCommands: true,
      canBeDamaged: true,
      jumpStrength: 2700,
    }
  ]);
  return player;
}

export default {
  initPlayer,
  playerUpdate,
};
