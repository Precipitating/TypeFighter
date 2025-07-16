import type { Vec2, KAPLAYCtx, GameObj, Collision, Tag, Game } from "kaplay";
import { fetchWords } from "./randomWord";
import { k } from "../App";
import { getStateCallbacks, Room } from "colyseus.js";
import {
  GRENADE_SHRAPNEL_COUNT,
  SHRAPNEL_SPREAD,
  BASE_TEXT_LENGTH,
  GRENADE_BOUNCE_SOUND_LIST,
} from "../../../globals";
import type {
  MyRoomState,
  Projectile,
} from "../../../server/src/rooms/schema/MyRoomState";

const GRENADE_LAUNCH_FORCE = 500;
const GRENADE_SPEED = 1000;

function spawnWordBullet(
  room: Room<MyRoomState>,
  projectileSchema: Projectile
): GameObj {
  if (room.sessionId == projectileSchema.ownerSessionId) {
    room.send("populateWordList");
  }
  const wordToUse = room.state.wordList[room.state.wordList.length - 1];
  room.send("reduceWordList");
  const bullet = k.add([
    k.text(wordToUse, {
      font: projectileSchema.fontType,
      size: 20,
    }),
    k.color(projectileSchema.r, projectileSchema.g, projectileSchema.b),
    k.area({ collisionIgnore: [...projectileSchema.ignoreList] }),
    k.pos(projectileSchema.spawnPosX, projectileSchema.spawnPosY),
    k.anchor("center"),
    k.rotate(projectileSchema.angle),
    k.offscreen(),
    projectileSchema.projectileType,
    "projectile",
    {
      speed: projectileSchema.speed,
      sessionId: projectileSchema.ownerSessionId,
      dir: k.vec2(projectileSchema.dirX, projectileSchema.dirY),
      knockBackForce: projectileSchema.knockBackForce,
      damage: projectileSchema.damage,
      projectileOwner: projectileSchema.objectOwner,
      schemaId: projectileSchema.objectUniqueId,
      bounce: projectileSchema.bounce,

      add(this: GameObj) {
        this.onCollide("solid", (solid: GameObj, col: Collision) => {
          if (this.bounce > 0 && solid && col) {
            if (room.sessionId === this.sessionId) {
              const reflect = this.dir.reflect(col.normal);
              room.send("projectileBounce", {
                schemaId: this.schemaId,
                reflectX: reflect.x,
                reflectY: reflect.y,
              });
            }
          } else {
            if (room.sessionId === this.sessionId && this.bounce === 0) {
              console.log("0 bounce, delete proj");
              room.send("destroyProjectile", {
                schemaId: this.schemaId,
              });
            }
          }
        });
      },

      update(this: GameObj) {
        if (this.isOffScreen()) {
          room.send("destroyProjectile", {
            schemaId: this.schemaId,
          });
        }

        if (projectileSchema.seeking) {
          const enemyTag =
            this.projectileOwner === "player1" ? "player2" : "player1";
          if (k.get(enemyTag).length > 0) {
            const enemy = k.get(enemyTag)[0];
            const enemyDir = k.vec2(enemy.pos.x, enemy.pos.y - 100).sub(this.pos).unit();
            this.dir = enemyDir;
          } else {
            room.send("destroyProjectile", {
              schemaId: this.schemaId,
            });
          }
        }
        this.move(k.vec2(this.dir).scale(this.speed));
      },
    },
  ]);

  return bullet;
}

function spawnGrenade(room: Room<MyRoomState>, projectileSchema: Projectile) {
  if (room.sessionId == projectileSchema.ownerSessionId) {
    room.send("populateWordList");
  }
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
      schemaId: projectileSchema.objectUniqueId,
      sessionId: projectileSchema.ownerSessionId,
      add(this: GameObj) {
        this.jump(GRENADE_LAUNCH_FORCE);
        this.applyImpulse(
          k
            .vec2(projectileSchema.dirX, projectileSchema.dirY)
            .scale(GRENADE_SPEED)
        );

        this.onCollide("solid", async (_: GameObj) => {
          k.play(k.choose(GRENADE_BOUNCE_SOUND_LIST));
          this.wait(this.cookTime, async () => {
            room.send("destroyProjectile", {
              schemaId: projectileSchema.objectUniqueId,
            });
            spawnGrenadeShrapnel(room, projectileSchema, this);
          });
        });
      },
    },
  ]);

  return grenade;
}

async function spawnMine(
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
      schemaId: projectileSchema.objectUniqueId,
      add(this: GameObj) {
        this.onFall(async () => {
          await spawnGrenadeShrapnel(room, projectileSchema, this);
          room.send("destroyProjectile", {
            schemaId: projectileSchema.objectUniqueId,
          });
        });
      },
    },
  ]);

  return mine;
}

async function spawnGrenadeShrapnel(
  room: Room<MyRoomState>,
  projectileSchema: Projectile,
  ownerObj: GameObj
) {
  if (room.sessionId == projectileSchema.ownerSessionId) {
    room.send("populateWordList");
  }
  k.play("grenadedetonate");
  const fetchWordList = room.state.wordList.slice(-GRENADE_SHRAPNEL_COUNT);
  room.send("spliceWordList", { amount: -GRENADE_SHRAPNEL_COUNT });

  if (room.sessionId == projectileSchema.ownerSessionId) {
    for (let i = 0; i < GRENADE_SHRAPNEL_COUNT; ++i) {
      const angle_ = (i / GRENADE_SHRAPNEL_COUNT) * SHRAPNEL_SPREAD;
      const dir = k.Vec2.fromAngle(angle_);

      room.send("spawnProjectile", {
        projectileType: "shrapnel",
        spawnPosX: ownerObj.pos.x,
        spawnPosY: ownerObj.pos.y,
        dirX: dir.x,
        dirY: dir.y,
        projectileOwner: projectileSchema.objectOwner,
        sessionId: room.sessionId,
        damage: 5,
        seeking: false,
        knockBackForce: 500,
        speed: 500,
        bounce: 5,
        angle: angle_,
      });
    }
  }
}

export default {
  spawnWordBullet,
  spawnGrenade,
  spawnMine,
  spawnGrenadeShrapnel,
};
