import type { GameObj, KAPLAYCtx, Collision, AreaComp } from "kaplay";
import character from "./Character";
import gameConsole from "./Console";
import projectile from "./Projectile";
import item from "./Pickups";

const selectedPlayer: string = "player2";
const allowedStates = [
  "idle",
  "stunned",
  "right",
  "left",
  "jump",
  "jump left",
  "jump right",
  "down",
  "crouch",
  "uncrouch",
  "throw",
  "throw up",
  "throw down",
  "grenade",
  "block",
  "deflect",
  "falling",
  "air-knockback",
  "deploy mine",
] as string[];

function spawnPlatform(
  k: KAPLAYCtx,
  x: number,
  y: number,
  scale: number,
  canMove: boolean
) {
  const platform = k.add([
    k.scale(scale),
    k.sprite("platform"),
    k.pos(x, y),
    k.color(k.rand(k.rgb(255, 255, 255))),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.platformEffector({ ignoreSides: [k.UP, k.LEFT, k.RIGHT] }),
    k.animate(),
    "solid",
    "platform",
  ]);

  const platforms = k.get("platform");

  const distCheck = (): void => {
    platforms.forEach((curr: GameObj) => {
      if (curr !== platform) {
        const dist = platform.pos.dist(curr.pos);
        if (dist < 250 * scale) {
          k.debug.log("too close");
          const randX = k.randi(100, k.width());
          const randY = k.randi(250, 500);
          k.debug.log(`old pos: ${x}x, ${y}y. New: ${randX}x, ${randY}y`);
          platform.pos = k.vec2(randX, randY);
          distCheck();
        }
      }
    });
  };
  distCheck();

  if (canMove) {
    // animate up or down
    const horizontalOrVertical = k.rand(0, 1) < 0.5;
    const randX = k.randi(100, k.width() - 100);
    const randY = k.randi(100, 800);
    platform.animate(
      "pos",
      [
        platform.pos,
        k.vec2(
          horizontalOrVertical ? randX : platform.pos.x,
          !horizontalOrVertical ? randY : platform.pos.y
        ),
      ],
      {
        duration: k.randi(3, 10),
        direction: "ping-pong",
      }
    );
  }
}

function initFieldCollision(k: KAPLAYCtx): void {
  // add ground
  k.add([
    k.pos(0, 840),
    k.rect(k.width(), 40),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "solid",
    "floor",
  ]);

  // walls
  k.add([
    k.pos(0, 0),
    k.rect(1, k.height()),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "solid",
    "wall-left",
  ]);

  k.add([
    k.pos(1920, 0),
    k.rect(1, k.height()),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "solid",
    "wall-right",
  ]);
}
function initAssets(k: KAPLAYCtx): void {
  // load assets
  const randomBG: string = k.randi(1, 8).toString();
  k.loadSprite("bg", `./bgs/${randomBG}.png`);
  k.loadSprite("mine", "./mine.png");
  k.loadSprite("platform", "./platform.png");
  k.loadSprite("character", "./charactersheet.png", {
    sliceY: 10,
    sliceX: 12,
    anims: {
      idle: 48,
      fall: 114,
      lying: 94,
      injured: 32,
      crouched: 76,
      dash: { from: 96, to: 103, loop: false, speed: 30 },
      "walk-left": { from: 4, to: 2, loop: false },
      "walk-right": { from: 2, to: 4, loop: false },
      crouch: { from: 72, to: 76, loop: false },
      uncrouch: { from: 76, to: 72, loop: false },
      jump: { from: 108, to: 114, loop: false, speed: 20 },
      throw: { from: 77, to: 82, loop: false },
      "throw-up": { from: 77, to: 81, loop: false },
      "throw-down": { from: 77, to: 82, loop: false },
      "throw-grenade": { from: 77, to: 82, loop: false },
      hurt: { from: 104, to: 106, loop: false, speed: 20 },
      "hurt-end": { from: 106, to: 104, loop: false },
      death: { from: 83, to: 94, loop: false },
      block: { from: 28, to: 30, loop: false, speed: 15 },
      deflect: { from: 28, to: 30, loop: false, speed: 25 },
      landing: { from: 72, to: 77, loop: false, speed: 15 },
      "air-knockback": { from: 89, to: 93, loop: false },
      standup: { from: 94, to: 84, loop: false },
      "deploy-mine": { from: 67, to: 70, loop: false },
    },
  });
  // load font
  k.loadFont("dogica", "./fonts/dogica.woff");
  k.loadFont("dogica-bold", "./fonts/dogicabold.woff");

  // background
  k.add([k.sprite("bg"), k.pos(0, -300), k.scale(1, 0.9)]);
}

export function updateGame(k: KAPLAYCtx): void {

  k.onUpdate("projectile", (proj: GameObj) => {

    if (proj.is("seeking")){
      const enemyTag = proj.owner == "player1" ? "player2" : "player1";
      const enemy = k.get(enemyTag)[0];
      const enemyDir = enemy.pos.sub(proj.pos).unit();

      proj.vel = enemyDir;
    }


    proj.move(proj.vel.scale(proj.speed));
  });


  // player
  k.onCollide(
    "character",
    "projectile",
    (character: GameObj, proj: GameObj, collision: Collision | undefined) => {
      if (
        character.canBeDamaged &&
        !character.isBlocking &&
        !character.isDeflecting &&
        collision
      ) {
        character.hp -= proj.damage;
        character.applyImpulse(proj.vel.scale(proj.knockBackForce));
        proj.destroy();
      } else {
        if (character.isDeflecting) {
          if (collision) {
            const reflect = proj.vel.reflect(collision.normal);
            proj.speed *= 1.5;
            proj.vel = reflect;
          }
        } else {
          proj.destroy();
        }
      }
    }
  );

  // grenade
  k.onCollide("grenade", "solid", async (grenade: GameObj) => {
    grenade.wait(grenade.cookTime, async () => {
      await projectile.spawnGrenadeShrapnel(k, grenade.pos);

      k.destroy(grenade);
    });
  });
  // shrapnel
  k.onCollide(
    "shrapnel",
    "solid",
    (proj: GameObj, solid: GameObj, collision: Collision | undefined) => {
      if (proj.bounce > 0 && solid && collision) {
        const reflect = proj.vel.reflect(collision.normal);
        proj.vel = reflect;
        --proj.bounce;
      } else {
        k.destroy(proj);
      }
    }
  );
}

export default async function initGame(k: KAPLAYCtx): Promise<void> {
  k.setGravity(2000);
  initAssets(k);
  initFieldCollision(k);
  gameConsole.initConsole(k, selectedPlayer);

  await projectile.populateWordList();

  const player1 = character.initPlayer(
    k,
    "player1",
    100,
    allowedStates,
    false,
    k.RIGHT,
    k.color(1, 255, 1)
  );
  const player2 = character.initPlayer(
    k,
    "player2",
    1820,
    allowedStates,
    true,
    k.LEFT,
    k.color(255, 1, 1)
  );

  // platforms
  for (let index = 0; index < k.randi(3, 6); ++index) {
    spawnPlatform(
      k,
      k.randi(100, k.width()),
      k.randi(300, 500),
      k.rand(0.5, 1.5),
      k.rand(0,1) < 0.5 ? true : false
    );
  }

  character.playerUpdate(k, player1);
  character.playerUpdate(k, player2);

  // initiate random item spawning
  item.spawnRandomItem(k);

  k.debug.inspect = true;
}
