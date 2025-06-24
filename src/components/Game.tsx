import {type KAPLAYCtx } from "kaplay";
import initKaplay from "./KaplayWindow";
import character from "./Character";
import console from "./Console";
import projectile from "./Projectile"



const selectedPlayer= "player1" as string;
const allowedStates = ["idle", "stunned", "right", "left", "up", "down", "throw"] as string[];



function initFieldCollision(k: KAPLAYCtx) : void
{
    // add ground
    k.add([
      k.pos(0, 840),
      k.rect(k.width(), 40),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "floor"

    ]);

    // walls
    k.add([
      k.pos(0, 0),
      k.rect(1, k.height()),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "wall-left"

    ]);

    k.add([
      k.pos(1920, 0),
      k.rect(1, k.height()),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "wall-right"
    ]);

    // ceiling
    k.add([
      k.pos(0, 0),
      k.rect(k.width(), 1),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "ceiling"
    ]);

}
function initAssets(k : KAPLAYCtx) : void
{
    // load assets
    k.loadSprite("bg", "./origbig.png")
    k.loadSprite("character", "./charactersheet2.png",{
        sliceY: 10,
        sliceX: 12,
        anims: {
            "idle": 48, 
            "dash": {from: 96, to: 103, loop: false, speed: 30},
            "walk-left": {from: 4, to: 2, loop: false},
            "walk-right": {from: 2, to: 4, loop: false},
            "crouch": {from:72, to: 76, loop: false, speed: 20},
            "uncrouch": {from:76, to: 72, loop: false, speed: 20},
            "jump": {from:108, to: 117, loop: false},
            "throw":{from:77, to: 82, loop:false},
            "hurt":{from:104, to: 106, loop:false},
            "hurt-end":{from:106, to: 104, loop:false},
        }
    });
    // load font
    k.loadFont("dogica", "./fonts/dogica.woff")
    k.loadFont("dogica-bold", "./fonts/dogicabold.woff")

    // background
    k.add([k.sprite("bg"), k.pos(0,-300), k.scale(1,0.9)]);

}



export default function initGame() : void
{
    const k = initKaplay();

    k.setGravity(2000)

    initAssets(k);
    initFieldCollision(k);
    
    console.initConsole(k,selectedPlayer,allowedStates);

    const player1 = character.initPlayer1(k, allowedStates);
    const player2 = character.initPlayer2(k, allowedStates);
    character.playerUpdate(k, player1);
    character.playerUpdate(k, player2);



    k.debug.inspect = true;
}