import type { Vec2, KAPLAYCtx, GameObj, Collision, Tag } from "kaplay";
import { fetchWords } from "./randomWord";
import { getStateCallbacks, Room } from "colyseus.js";
import type { MyRoomState } from "../../../server/src/rooms/schema/MyRoomState";

const BULLET_SPEED = 300;
const GRENADE_LAUNCH_FORCE = 500;
const GRENADE_SPEED = 1000;
const SHRAPNEL_SPEED = 500;
const SHRAPNEL_SPREAD = 360;
const GRENADE_SHRAPNEL_COUNT = 10;
let wordList: string[] = [];

async function populateWordList(): Promise<void> {
  if (wordList.length == 0 || wordList.length < GRENADE_SHRAPNEL_COUNT) {
    wordList = (await fetchWords()) as string[];

    if (wordList.length == 0) {
      console.error("wordList empty, API call failed.");
      return;
    }
  }
}

function spawnWordBullet(
  k: KAPLAYCtx,
  pos: Vec2,
  dir: Vec2,
  owner: string
): GameObj {
  populateWordList();
  const bullet = k.add([
    k.text(wordList.pop(), {
      font: "dogica-bold",
      size: 20,
    }),
    k.color(k.rand(k.rgb(255, 255, 255))),
    k.area({ collisionIgnore: [owner] }),
    k.pos(pos),
    k.anchor("center"),
    k.offscreen({ destroy: true }),
    "wordBullet",
    "projectile",
    {
      speed: BULLET_SPEED,
      vel: dir,
      knockBackForce: 100,
      damage: 10,
      projectileOwner: owner,

      update(this: GameObj) {
        if (this.is("seeking")) {
          const enemyTag = this.owner == "player1" ? "player2" : "player1";
          if (k.get(enemyTag).length > 0){
            const enemy = k.get(enemyTag)[0];
            const enemyDir = enemy.pos.sub(this.pos).unit();
            this.vel = enemyDir;
          }

        }
        this.move(this.vel.scale(this.speed));
      },
    },
  ]);

  return bullet;
}

function spawnGrenade(k: KAPLAYCtx, pos: Vec2, dir: Vec2) {
  populateWordList();

  const grenade = k.add([
    k.circle(10),
    k.outline(3),
    k.color(1, 255, 1),
    k.body({ damping: 1 }),
    k.area({ restitution: 0.5 }),
    k.timer(),
    k.pos(pos),
    k.anchor("center"),
    "grenade",
    {
      cookTime: 1.5,
    },
  ]);

  grenade.jump(GRENADE_LAUNCH_FORCE);
  // movement impulse
  grenade.applyImpulse(dir.scale(GRENADE_SPEED));

  k.onCollide("grenade", "solid", async (grenade: GameObj) => {
    grenade.wait(grenade.cookTime, async () => {
      await spawnGrenadeShrapnel(k, grenade.pos);
      k.destroy(grenade);
    });
  });

  return grenade;
}

function spawnMine(k: KAPLAYCtx, pos: Vec2, owner: string) {
  const mine = k.add([
    k.scale(2),
    k.sprite("mine"),
    k.body({ jumpForce: 1000 }),
    k.area({ collisionIgnore: [owner] }),
    k.timer(),
    k.pos(pos),
    k.anchor("center"),
    "mine",
    {
      deployer: owner,
    },
  ]);

  mine.onFall(() => {
    spawnGrenadeShrapnel(k, mine.pos);
    mine.destroy();
  });

  return mine;
}

async function spawnGrenadeShrapnel(k: KAPLAYCtx, pos: Vec2) {
  const fetchWordList = wordList.splice(-GRENADE_SHRAPNEL_COUNT);

  for (let i = 0; i < GRENADE_SHRAPNEL_COUNT; ++i) {
    const angle = ((i / GRENADE_SHRAPNEL_COUNT) * SHRAPNEL_SPREAD) as number;
    const dir = k.Vec2.fromAngle(angle);

    k.add([
      k.text(fetchWordList[i], { font: "dogica-bold", size: 20 }),
      k.color(k.rand(k.rgb(255, 255, 255))),
      k.area(),
      k.rotate(angle),
      k.pos(pos),
      k.anchor("center"),
      k.offscreen({ destroy: true }),
      "shrapnel",
      "projectile",
      {
        speed: SHRAPNEL_SPEED as number,
        bounce: 1 as number,
        vel: dir as Vec2,
        knockBackForce: 500,
        damage: 25,
        update(this: GameObj) {
          this.move(this.vel.scale(this.speed));
        },
      },
    ]);

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
}

export default {
  spawnWordBullet,
  spawnGrenade,
  spawnMine,
  spawnGrenadeShrapnel,
  populateWordList,
};
