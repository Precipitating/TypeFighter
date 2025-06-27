import type { Vec2, KAPLAYCtx } from "kaplay";
import { fetchWord, fetchWords } from "./RandomWord";

const BULLET_SPEED = 300 as number;
const GRENADE_LAUNCH_FORCE = 500 as number;
const GRENADE_SPEED = 600 as number;
const SHRAPNEL_SPEED = 500 as number;
const SHRAPNEL_SPREAD = 360 as number;
const GRENADE_SHRAPNEL_COUNT = 10 as number;

async function spawnWordBullet(k: KAPLAYCtx, pos : Vec2, dir : Vec2){
    const randomWord = await fetchWord() as string;
    const bullet = k.add([
        k.text(randomWord, {
            font: "dogica-bold",
            size: 20
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
            vel: dir,
            bounce: 0
        }
    ]);

    return bullet;
}



function spawnGrenade(k: KAPLAYCtx, pos : Vec2, dir : Vec2){
    const grenade = k.add([
        k.circle(10),
        k.outline(1),
        k.color(1,255,1),
        k.body(),
        k.area(),
        k.pos(pos),
        k.anchor("center"),
       // k.move(dir, GRENADE_SPEED ),
        "grenade",
        {
            bounce: 0
        }
    ]);

    grenade.jump(GRENADE_LAUNCH_FORCE);
    // movement impulse
    grenade.applyImpulse(dir.scale(GRENADE_SPEED));

    return grenade;

}


async function spawnGrenadeShrapnel(k: KAPLAYCtx, pos : Vec2){
    const randomWord = await fetchWords(GRENADE_SHRAPNEL_COUNT) as string[];
    console.log(randomWord);

    for (let i = 0; i < GRENADE_SHRAPNEL_COUNT; ++i){
        const angle = (i / GRENADE_SHRAPNEL_COUNT) * SHRAPNEL_SPREAD as number;
        const dir = k.Vec2.fromAngle(angle) as Vec2;

        k.add([
            k.text(randomWord[i], {font: "dogica-bold", size: 20}),
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
                vel: dir as Vec2
            }
        ]);


    
    }



}


export default{
    spawnWordBullet,
    spawnGrenade,
    spawnGrenadeShrapnel
}