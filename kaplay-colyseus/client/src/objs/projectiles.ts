import type { Vec2, KAPLAYCtx, GameObj, Collision, Tag, Game } from "kaplay";
import { fetchWords } from "./randomWord";
import { k } from "../App";
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
  if (wordList.length === 0 || wordList.length < GRENADE_SHRAPNEL_COUNT) {
    wordList = (await fetchWords()) as string[];

    if (wordList.length === 0) {
      console.error("wordList empty, API call failed.");
      return;
    }
  }
}

function spawnWordBullet(
  pos: Vec2,
  dir: Vec2,
  owner: string,
  seeking: boolean
): GameObj {
  populateWordList();
  const bullet = k.add([
    k.text(wordList.pop(), {
      font: "dogica-bold",
      size: 20,
    }),
    k.color(k.rand(k.rgb(255, 255, 255))),
    k.area({ collisionIgnore: ["localPlayer"] }),
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
        if (seeking) {
          const enemyTag = owner === "player1" ? "player2" : "player1";
          if (k.get(enemyTag).length > 0) {
            const enemy = k.get(enemyTag)[0];
            const enemyDir = enemy.pos.sub(this.pos).unit();
            this.vel = enemyDir;
          }
          else{
            this.destroy();
          }
        }
        this.move(this.vel.scale(this.speed));
      },
    },
  ]);

  return bullet;
}

function spawnGrenade(pos: Vec2, dir: Vec2) {
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
      add(this: GameObj) {
        this.jump(GRENADE_LAUNCH_FORCE);
        this.applyImpulse(dir.scale(GRENADE_SPEED));

        this.onCollide("solid", async (_: GameObj) => {
          this.wait(this.cookTime, async () => {
            await spawnGrenadeShrapnel(this.pos);
            k.destroy(this);
          });
        });
      },
    },
  ]);

}

function spawnMine(pos: Vec2, owner: string) {
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
      add(this: GameObj){
        this.onFall(()=>{
          spawnGrenadeShrapnel(this.pos);
          this.destroy();
        })
      }
    },
  ]);

}

async function spawnGrenadeShrapnel(pos: Vec2) {
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
        add(this: GameObj){
          this.onCollide("solid",(solid: GameObj, col: Collision) =>{
            if (this.bounce > 0 && solid && col){
              const reflect = this.vel.reflect(col.normal);
              this.vel = reflect;
              --this.bounce;
            }
            else{
              this.destroy();
            }
            
          });
        }
      },
    ]);
  }
}

export default {
  spawnWordBullet,
  spawnGrenade,
  spawnMine,
  spawnGrenadeShrapnel,
  populateWordList,
};
