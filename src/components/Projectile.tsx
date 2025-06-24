import type { GameObj, Vec2, KAPLAYCtx } from "kaplay";
import { fetchWord } from "./RandomWord";

const BULLET_SPEED = 300 as number;
const THROW_DMG = 10;

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
    ]);

    return bullet;
}

function wordBulletUpdate(k: KAPLAYCtx, bullet: GameObj){
    bullet.onCollide("player2", (e : GameObj) => {
        if (e.state !== "stunned"){
            e.hurt(THROW_DMG);
            bullet.destroy();
        }


    });

        bullet.onCollide("player1", (e : GameObj) => {
        if (e.state !== "stunned"){
            e.hurt(THROW_DMG);
            bullet.destroy();
        }

    });


}




export default{
    spawnWordBullet,
    wordBulletUpdate
}