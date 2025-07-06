import type { Vec2, KAPLAYCtx, GameObj, Collision, Tag, Game } from "kaplay";
import { fetchWords } from "./randomWord";
import { k } from "../App";
import { getStateCallbacks, Room } from "colyseus.js";
import type {
  MyRoomState,
  Projectile,
} from "../../../server/src/rooms/schema/MyRoomState";

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
  room: Room<MyRoomState>,
  projectileSchema : Projectile
): GameObj {
  const bullet = k.add([
    k.text(wordList.pop(), {
      font: "dogica-bold",
      size: 20,
    }),
    k.color(k.rand(k.rgb(255, 255, 255))),
    k.area({ collisionIgnore: ["localPlayer"] }),
    k.pos(projectileSchema.spawnPosX, projectileSchema.spawnPosY),
    k.anchor("center"),
    k.offscreen({ destroy: true }),
    "wordBullet",
    "projectile",
    {
      speed: BULLET_SPEED,
      sessionID: projectileSchema.ownerSessionId,
      vel: k.vec2(projectileSchema.dirX, projectileSchema.dirY),
      knockBackForce: 100,
      damage: projectileSchema.damage,
      projectileOwner: projectileSchema.objectOwner,

      update(this: GameObj) {
        if (projectileSchema.seeking) {
          const enemyTag = projectileSchema.objectOwner === "player1" ? "player2" : "player1";
          if (k.get(enemyTag).length > 0) {
            const enemy = k.get(enemyTag)[0];
            const enemyDir = enemy.pos.sub(this.pos).unit();
            this.vel = enemyDir;
          } else {
            room.send("destroyProjectile", { schemaId: projectileSchema.objectUniqueID });
          }
        }

        this.move(this.vel.scale(this.speed));
      },
    },
  ]);

  return bullet;
}

function spawnGrenade(
  room: Room<MyRoomState>,
  projectileSchema : Projectile
) {
  populateWordList();

  const grenade = k.add([
    k.circle(10),
    k.outline(3),
    k.color(1, 255, 1),
    k.body({ damping: 1 }),
    k.area({ restitution: 0.5 }),
    k.timer(),
    k.pos(projectileSchema.spawnPosX, projectileSchema.spawnPosY),
    k.anchor("center"),
    "grenade",
    {
      cookTime: 1.5,
      schemaID: projectileSchema.objectUniqueID,
      sessionID: projectileSchema.ownerSessionId,
      add(this: GameObj) {
        this.jump(GRENADE_LAUNCH_FORCE);
        this.applyImpulse(k.vec2(projectileSchema.dirX, projectileSchema.dirY).scale(GRENADE_SPEED));

        this.onCollide("solid", async (_: GameObj) => {
          this.wait(this.cookTime, async () => {
            //await spawnGrenadeShrapnel(this.pos, room);
            room.send("spawnProjectile", {
              projectileType: "shrapnel",
              spawnPosX: this.pos.x,
              spawnPosY: this.pos.y,
              projectileOwner: this.team,
              sessionID: projectileSchema.ownerSessionId,
              seeking: false,
            });
            room.send("destroyProjectile", { schemaId: projectileSchema.objectUniqueID });
            k.destroy(this);
          });
        });
      },
    },
  ]);
}

function spawnMine(
  room: Room<MyRoomState>,
  projectileSchema: Projectile
) {
  const mine = k.add([
    k.scale(2),
    k.sprite("mine"),
    k.body({ jumpForce: 1000 }),
    k.area({ collisionIgnore: [projectileSchema.objectOwner] }),
    k.timer(),
    k.pos(projectileSchema.spawnPosX, projectileSchema.spawnPosY),
    k.anchor("center"),
    "mine",
    {
      deployer: projectileSchema.objectOwner,
      schemaID: projectileSchema.objectUniqueID,
      add(this: GameObj) {
        this.onFall(() => {
          room.send("spawnProjectile", {
            projectileType: "shrapnel",
            posX: this.pos.x,
            posY: this.pos.y,
          });
          room.send("destroyProjectile", { schemaID: projectileSchema.objectUniqueID });
          //spawnGrenadeShrapnel(this.pos, room);
          //this.destroy();
        });
      },
    },
  ]);
}

async function spawnGrenadeShrapnel(
  room: Room<MyRoomState>,
  projectileSchema: Projectile
) {
  const fetchWordList = wordList.splice(-GRENADE_SHRAPNEL_COUNT);

  for (let i = 0; i < GRENADE_SHRAPNEL_COUNT; ++i) {
    const angle = ((i / GRENADE_SHRAPNEL_COUNT) * SHRAPNEL_SPREAD) as number;
    const dir = k.Vec2.fromAngle(angle);

    k.add([
      k.text(fetchWordList[i], { font: "dogica-bold", size: 20 }),
      k.color(k.rand(k.rgb(255, 255, 255))),
      k.area(),
      k.rotate(angle),
      k.pos(projectileSchema.spawnPosX, projectileSchema.spawnPosY),
      k.anchor("center"),
      k.offscreen({ destroy: true }),
      "shrapnel",
      "projectile",
      {
        speed: SHRAPNEL_SPEED as number,
        schemaID: projectileSchema.objectUniqueID,
        bounce: 1 as number,
        vel: dir as Vec2,
        knockBackForce: 500,
        damage: projectileSchema.damage,
        update(this: GameObj) {
          this.move(this.vel.scale(this.speed));
        },
        add(this: GameObj) {
          this.onCollide("solid", (solid: GameObj, col: Collision) => {
            if (this.bounce > 0 && solid && col) {
              const reflect = this.vel.reflect(col.normal);
              this.vel = reflect;
              --this.bounce;
            } else {
               room.send("destroyProjectile", { schemaID: projectileSchema.objectUniqueID });
            }
          });
        },
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
