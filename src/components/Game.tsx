import {type GameObj, type KAPLAYCtx } from "kaplay";
import character from "./Character";
import console from "./Console";
import projectile from "./Projectile";

const selectedPlayer= "player2" as string;
const allowedStates = ["idle", "stunned", "right", "left", "up", "down", "throw", "grenade",
                       "block", "deflect"] as string[];
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

    // ceiling
    k.add([
      k.pos(0, 0),
      k.rect(k.width(), 1),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "ceiling"
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
            "dash": {from: 96, to: 103, loop: false, speed: 30},
            "walk-left": {from: 4, to: 2, loop: false},
            "walk-right": {from: 2, to: 4, loop: false},
            "crouch": {from:72, to: 76, loop: false},
            "uncrouch": {from:76, to: 72, loop: false},
            "jump": {from:108, to: 117, loop: false},
            "throw":{from:77, to: 82, loop:false},
            "throw-grenade":{from:77, to: 82, loop:false},
            "hurt":{from:104, to: 106, loop:false},
            "hurt-end":{from:106, to: 104, loop:false},
            "death":{from:83, to: 94, loop:false},
            "block":{from:28, to: 30, loop:false, speed: 10},
            "deflect":{from:28, to: 30, loop:false, speed: 25}
        }
    });
    // load font
    k.loadFont("dogica", "./fonts/dogica.woff")
    k.loadFont("dogica-bold", "./fonts/dogicabold.woff")

    // background
    k.add([k.sprite("bg"), k.pos(0,-300), k.scale(1,0.9)]);

}


export function updateGame(k: KAPLAYCtx) : void{

  // player
  k.onCollide("character", "projectile", (character: GameObj, proj: GameObj) => {
    if (character.state !== "stunned" && !character.isBlocking && !character.isDeflecting){
        character.hurt(THROW_DMG);
        proj.destroy();
    }
    else{
      if (character.isDeflecting){
        const deflectedAngle = proj.angle - 180 as number; 
        proj.speed *= 1.5;
        proj.use(k.move(k.Vec2.fromAngle(deflectedAngle), proj.speed));
      }
      else{
        proj.destroy();
      }
    }




  });


  // grenade
  k.onCollide("grenade", "solid", async(grenade: GameObj) => {
    await projectile.spawnGrenadeShrapnel(k,grenade.pos);
    k.destroy(grenade);

  });



}

export default function initGame(k : KAPLAYCtx) : void
{

    k.setGravity(2000)

    initAssets(k);
    initFieldCollision(k);
    
    console.initConsole(k,selectedPlayer,allowedStates);

    const player1 = character.initPlayer(k, "player1", 100, allowedStates, false, k.RIGHT);
    const player2 = character.initPlayer(k, "player2", 1820, allowedStates, true, k.LEFT);

    character.playerUpdate(k, player1);
    character.playerUpdate(k, player2);







    k.debug.inspect = true;
}