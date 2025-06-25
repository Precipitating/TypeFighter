import type { Vec2, KAPLAYCtx } from "kaplay";
import { fetchWord, fetchWords } from "./RandomWord";

const BULLET_SPEED = 300 as number;
const GRENADE_LAUNCH_FORCE = 1000 as number;
const GRENADE_SPEED = 500 as number;
const SHRAPNEL_SPEED = 300 as number;
const SHRAPNEL_SPREAD = 360 as number;
const GRENADE_SHRAPNEL_COUNT = 10 as number;

async function spawnWordBullet(k: KAPLAYCtx, pos : Vec2, dir : Vec2){
    const randomWord = await fetchWord() as string;
    const bullet = k.add([
        k.text(randomWord, {
            font: "dogica",
            size: 20
        }),
        k.area(),
        k.pos(pos),
        k.anchor("center"),
        k.move(dir, BULLET_SPEED),
        k.offscreen({ destroy: true }),
        "wordBullet",
        "projectile"
    ]);

    return bullet;
}



function spawnGrenade(k: KAPLAYCtx, pos : Vec2, dir : Vec2){
    const grenade = k.add([
        k.rect(25,25, {radius: 20}),
        k.color(1,255,1),
        k.body(),
        k.area(),
        k.pos(pos),
        k.anchor("center"),
        k.move(dir, GRENADE_SPEED ),
        k.offscreen({ destroy: true }),
        "grenade",
        "projectile"
    ]);

    grenade.jump(GRENADE_LAUNCH_FORCE);

    return grenade;

}


async function spawnGrenadeShrapnel(k: KAPLAYCtx, pos : Vec2){
    const randomWord = await fetchWords(GRENADE_SHRAPNEL_COUNT) as string[];
    console.log(randomWord);

    for (let i = 0; i < GRENADE_SHRAPNEL_COUNT; ++i){
        const angle = (i / GRENADE_SHRAPNEL_COUNT) * SHRAPNEL_SPREAD;
        const dir = k.Vec2.fromAngle(angle);

        k.add([
            k.text(randomWord[i], {font: "dogica-bold", size: 20}),
            k.color(k.rand(k.rgb(255, 200, 255))),
            k.area(),
            k.pos(pos),
            k.anchor("center"),
            k.move(dir, SHRAPNEL_SPEED ),
            k.offscreen({ destroy: true }),
            "shrapnel",
            "projectile",
        ]);


    
    }



}


export default{
    spawnWordBullet,
    spawnGrenade,
    spawnGrenadeShrapnel
}