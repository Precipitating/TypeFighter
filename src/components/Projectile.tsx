import type { Vec2, KAPLAYCtx } from "kaplay";
import {fetchWords } from "./RandomWord";

const BULLET_SPEED = 300;
const GRENADE_LAUNCH_FORCE= 500;
const GRENADE_SPEED= 1000;
const SHRAPNEL_SPEED = 500;
const SHRAPNEL_SPREAD = 360;
const GRENADE_SHRAPNEL_COUNT = 10;
let wordList : string[] = [];



async function populateWordList() : Promise<void>{
    if (wordList.length == 0 || wordList.length < GRENADE_SHRAPNEL_COUNT){
        wordList = await fetchWords() as string[];
        
        if (wordList.length == 0){
            console.error("wordList empty, API call failed.");
            return;
        }
    }

}

async function spawnWordBullet(k: KAPLAYCtx, pos : Vec2, dir : Vec2){
    populateWordList();
    k.add([
      k.text(wordList.pop(), {
        font: "dogica-bold",
        size: 20,
      }),
      k.color(k.rand(k.rgb(255, 50, 150))),
      k.area(),
      k.pos(pos),
      k.anchor("center"),
      k.offscreen({ destroy: true }),
      "wordBullet",
      "projectile",
      {
        speed: BULLET_SPEED,
        vel: dir as Vec2,
        knockBackForce: 100,
        damage: 10
      },
    ]);
}



function spawnGrenade(k: KAPLAYCtx, pos : Vec2, dir : Vec2){
    populateWordList();
    const grenade = k.add([
        k.circle(10),
        k.outline(3),
        k.color(1,255,1),
        k.body({damping: 1}),
        k.area({restitution: 0.5}),
        k.timer(),
        k.pos(pos),
        k.anchor("center"),
        "grenade",
        {
            cookTime: 1.5
        }
    ]);

    grenade.jump(GRENADE_LAUNCH_FORCE);
    // movement impulse
    grenade.applyImpulse(dir.scale(GRENADE_SPEED));

    return grenade;

}


async function spawnGrenadeShrapnel(k: KAPLAYCtx, pos : Vec2){
    const fetchWordList = wordList.splice(-GRENADE_SHRAPNEL_COUNT);

    for (let i = 0; i < GRENADE_SHRAPNEL_COUNT; ++i){
        const angle = (i / GRENADE_SHRAPNEL_COUNT) * SHRAPNEL_SPREAD as number;
        const dir = k.Vec2.fromAngle(angle) as Vec2;

        k.add([
            k.text(fetchWordList[i], {font: "dogica-bold", size: 20}),
            k.color(k.rand(k.rgb(255, 50, 255))),
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
                damage: 25
            }
        ]);


    
    }



}


export default{
    spawnWordBullet,
    spawnGrenade,
    spawnGrenadeShrapnel,
    populateWordList
}