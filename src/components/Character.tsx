import {type GameObj, type KAPLAYCtx } from "kaplay";
import projectile from "./Projectile";

const STUN_TIME_THROW = 0.5 as number;

function playerUpdate(k: KAPLAYCtx, player: GameObj){


    player.onDeath(()=>{
        k.destroy(player);
    })

    player.onHurt(()=>{
        player.play("hurt");

    })


    player.onGround(()=>{

        player.enterState("idle");

    })

    player.onStateEnter("stunned", async() => {
        await k.wait(STUN_TIME_THROW);
        player.enterState("idle");

    });

    player.onStateEnter("throw", async() => {

        if (player.isGrounded()){
            player.play("throw");
        }

    });
    player.onStateUpdate("right", () => {
         if (player.isGrounded()){
            player.direction.x = 0;
            player.direction.y = 0;
            player.direction.x = 1;

            if (player.direction.eq(k.vec2(1,0)))
            {
                player.move(player.direction.scale(player.speed));
                player.play("walk-right");

            }
         }



    });
    player.onStateUpdate("left", () => {
        if (player.isGrounded()){
            player.direction.x = 0;
            player.direction.y = 0;
            player.direction.x = -1;

            if (player.direction.eq(k.vec2(-1,0)))
            {
                player.move(player.direction.scale(player.speed));
                player.play("walk-left");
            
            }

        }

    });


    player.onStateEnter("up", async() => {

        if (player.isGrounded()){
            player.jump(1200);
            player.play("jump");
        }


    });


    player.onStateEnter("down", async() => {
        player.direction.x = 0;
        player.direction.y = 0;

        if (player.isGrounded()){
            player.use(k.area({shape: new k.Rect(k.vec2(0,0), 30, 30)}));
            player.play("crouch");

        }


    });

    // idle
     player.onStateEnter("idle", async() => {
        player.play("idle");

    });
    player.onAnimEnd(async(anim : string) => {

        switch(anim){
            case "crouch":
                player.play("uncrouch");
                break;
            case "uncrouch":
                player.use(k.area({shape: new k.Rect(k.vec2(0,0), 30, 70)}));
                player.enterState("idle");
                break;
            case "throw":               
                const bullet = projectile.spawnWordBullet(k, k.vec2(player.pos.x + 250, player.pos.y - 200), player.direction);
                projectile.wordBulletUpdate(k, await bullet);
                player.enterState("idle");
                break;
            case "hurt":
                player.play("hurt-end");
                player.enterState("stunned");
                break;
            case "dash":
            case "walk-left":
            case "walk-right":
                player.enterState("idle");
                break;

            
        }

    });



}

function initPlayer1(k: KAPLAYCtx, allowedStates: string[])
{
    // player left
    const player = k.add([
        k.sprite("character", {anim: "idle"}),
        k.area({shape: new k.Rect(k.vec2(0,0), 30, 70)}),
        k.body({mass: 1}),
        k.anchor("bot"),
        k.pos(100, 500),
        k.scale(4),
        k.state("idle", allowedStates),
        k.health(100),
        "player1",
        {
            speed: 8000,
            direction: k.RIGHT

        }
    ]);


    
    return player

}

function initPlayer2(k: KAPLAYCtx, allowedStates : string[])
{
    const player2 = k.add([
      k.sprite("character", { anim: "idle", flipX: true, }),
      k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 70) }),
      k.body({ mass: 1 }),
      k.anchor("bot"),
      k.pos(1820, 500),
      k.scale(4),
      k.health(100),
      k.state("idle", allowedStates),
      "player2",
      {
        speed: 8000,
        direction: k.LEFT,
      },
    ]);


    return player2

}

export default{
    initPlayer1,
    initPlayer2,
    playerUpdate
}