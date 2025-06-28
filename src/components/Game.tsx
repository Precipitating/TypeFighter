import {type GameObj, type KAPLAYCtx, type Vec2, type Collision } from "kaplay";
import character from "./Character";
import gameConsole from "./Console";
import projectile from "./Projectile";

const selectedPlayer= "player2" as string;
const allowedStates = ["idle", "stunned", "right", "left", "up", "down", "crouch", "uncrouch", "throw", "grenade",
                       "block", "deflect", "falling", "air-knockback" ] as string[];
const THROW_DMG = 10 as number;


function initFieldCollision(k: KAPLAYCtx) : void
{
    // add ground
    k.add([
      k.pos(0, 840),
      k.rect(k.width(), 40),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "floor"

    ]);

    // walls
    k.add([
      k.pos(0, 0),
      k.rect(1, k.height()),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "wall-left"

    ]);

    k.add([
      k.pos(1920, 0),
      k.rect(1, k.height()),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "wall-right"
    ]);

    //platforms
    k.add([
      k.pos(k.width() / 2, 500),
      k.rect(k.width() * 0.2, 10),
      k.anchor("center"),
      k.area(),
      k.body({ isStatic: true }),
      k.color(k.RED),
      k.platformEffector({ignoreSides: [k.UP, k.LEFT, k.RIGHT]}),
      "solid",
      "platform"

    ]);
    k.add([
      k.pos(k.width() * 0.2, 340),
      k.rect(k.width() * 0.2, 10),
      k.anchor("center"),
      k.area(),
      k.body({ isStatic: true }),
      k.color(k.GREEN),
      k.platformEffector({ignoreSides: [k.UP, k.LEFT, k.RIGHT]}),
      "solid",
      "platform"

    ]);
    k.add([
      k.pos(k.width() * 0.8, 340),
      k.rect(k.width() * 0.2, 10),
      k.anchor("center"),
      k.area(),
      k.body({ isStatic: true }),
      k.color(k.GREEN),
      k.platformEffector({ignoreSides: [k.UP, k.LEFT, k.RIGHT]}),
      "solid",
      "platform"

    ]);

}
function initAssets(k : KAPLAYCtx) : void
{
    // load assets
    k.loadSprite("bg", "./origbig.png")
    k.loadSprite("character", "./charactersheet.png",{
        sliceY: 10,
        sliceX: 12,
        anims: {
            "idle": 48,
            "fall": 114,
            "lying": 94,
            "dash": {from: 96, to: 103, loop: false, speed: 30},
            "walk-left": {from: 4, to: 2, loop: false},
            "walk-right": {from: 2, to: 4, loop: false},
            "crouch": {from:72, to: 76, loop: false},
            "uncrouch": {from:76, to: 72, loop: false},
            "jump": {from:108, to: 114, loop: false, speed: 20},
            "throw":{from:77, to: 82, loop:false},
            "throw-grenade":{from:77, to: 82, loop:false},
            "hurt":{from:104, to: 106, loop:false},
            "hurt-end":{from:106, to: 104, loop:false},
            "death":{from:83, to: 94, loop:false},
            "block":{from:28, to: 30, loop:false, speed: 15},
            "deflect":{from:28, to: 30, loop:false, speed: 25},
            "landing":{from:72, to: 77, loop: false, speed: 15},
            "air-knockback":{from: 89, to: 93, loop:false},
            "standup":{from: 94, to: 84, loop:false},
        }
    });
    // load font
    k.loadFont("dogica", "./fonts/dogica.woff")
    k.loadFont("dogica-bold", "./fonts/dogicabold.woff")

    // background
    k.add([k.sprite("bg"), k.pos(0,-300), k.scale(1,0.9)]);

}


export function updateGame(k: KAPLAYCtx) : void{

  k.onUpdate("projectile", (proj: GameObj) => {
    proj.move(proj.vel.scale(proj.speed));
  })

  // player
  k.onCollide("character", "projectile", (character: GameObj, proj: GameObj, collision : Collision | undefined) => {
    if (character.canBeDamaged && !character.isBlocking && !character.isDeflecting && collision){
        character.hp -= THROW_DMG;
        character.applyImpulse(proj.vel.scale(proj.knockBackForce));
        proj.destroy();
    }
    else{
      if (character.isDeflecting){
        if (collision){
          const reflect = proj.vel.reflect(collision.normal);
          proj.speed *= 1.5;
          proj.vel = reflect;
          
        }  
      }
      else{
        proj.destroy();
      }
    }




  });


  // grenade
  k.onCollide("grenade", "solid", async(grenade: GameObj) => {
    grenade.wait(grenade.cookTime, async() => {
      await projectile.spawnGrenadeShrapnel(k,grenade.pos);

      k.destroy(grenade);
    });


  });

  k.onCollide("shrapnel", "solid", (proj: GameObj, solid: GameObj, collision : Collision | undefined) => {
    if (proj.bounce > 0 && solid && collision) {
      const reflect = proj.vel.reflect(collision.normal);
      proj.vel = reflect;
      --proj.bounce;
    }
  else{
    k.destroy(proj);
  }

  });



}

export default async function initGame(k : KAPLAYCtx) : Promise<void>
{
    k.setGravity(2000);
    initAssets(k);
    initFieldCollision(k);
    gameConsole.initConsole(k,selectedPlayer,allowedStates);

    await projectile.populateWordList();

    const player1 = character.initPlayer(k, "player1", 100, allowedStates, false, k.RIGHT, k.color(1,255,1));
    const player2 = character.initPlayer(k, "player2", 1820, allowedStates, true, k.LEFT, k.color(255,1,1));

    character.playerUpdate(k, player1);
    character.playerUpdate(k, player2);

    k.debug.inspect = true;
}