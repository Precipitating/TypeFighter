import {type GameObj, type KAPLAYCtx } from "kaplay";
import initKaplay from "./KaplayWindow"

const selectedPlayer= "player1" as string;
const allowedStates = ["idle", "right", "left", "up", "down"] as string[];

function updateConsole(k: KAPLAYCtx, textInput: GameObj): void
{
    textInput.onUpdate(() => {
        
        if (k.isKeyPressed("enter")) {
            const player = k.get(selectedPlayer)[0];

            if (allowedStates.includes(textInput.typedText) && player.state == "idle"){

                player.enterState(textInput.typedText);
            }
            textInput.text = "";
            textInput.typedText = "";

        }
        
    })

    
}
function initConsole(k: KAPLAYCtx): void
{
    // add console bg
    k.add([
      k.pos(k.width() / 2, k.height() - 107),
      k.rect(k.width(), 215),
      k.color(1,1,1),
      k.anchor("center")

    ]);
    k.add([
      k.pos(k.width() / 2, k.height() - 108),
      k.rect(1870, 180, { radius: 40 }),
      k.color(1, 1, 1),
      k.anchor("center"),
      k.outline(4, k.GREEN),
    ]);

    k.add([
        k.text(">", {font: "dogica-bold"}),
        k.pos(90, k.height() - 70),
        k.anchor("left"),
        k.color(1,255,1)

    ]);

    // text input
    const textInput = k.add([
        k.text("", {font: "dogica", size: 30}),
        k.textInput(true, 10),
        k.pos(130, k.height() - 72),
        k.anchor("left"),
        k.color(1,255,1)

    ]);

    updateConsole(k, textInput);



    


}

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
    k.loadSprite("character", "./charactersheet.png",{
        sliceY: 10,
        sliceX: 12,
        anims: {
            "idle": 48, 
            "dash": {from: 96, to: 103, loop: false, speed: 30},
            "walk-left": {from: 4, to: 2, loop: false},
            "walk-right": {from: 2, to: 4, loop: false},
            "crouch": {from:72, to: 76, loop: false, speed: 20},
            "uncrouch": {from:76, to: 72, loop: false, speed: 20},
            "jump": {from:108, to: 117, loop: false}
        }
    });
    // load font
    k.loadFont("dogica", "./fonts/dogica.woff")
    k.loadFont("dogica-bold", "./fonts/dogicabold.woff")

    // background
    k.add([k.sprite("bg"), k.pos(0,-300), k.scale(1,0.9)]);

}

function playerUpdate(k: KAPLAYCtx, player: GameObj){


    player.onGround(()=>{

        player.enterState("idle");

    })
    
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
        if (player.isGrounded()){
            player.use(k.area({shape: new k.Rect(k.vec2(0,0), 30, 30)}));
            player.play("crouch");

        }


    });

    // idle
     player.onStateEnter("idle", async() => {
        player.direction.x = 0;
        player.direction.y = 0;
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
            case "dash":
            case "walk-left":
            case "walk-right":
                player.enterState("idle");
                break;

            
        }



        

    });



}

function initPlayer1(k: KAPLAYCtx)
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

function initPlayer2(k: KAPLAYCtx)
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


export default function initGame() : void
{
    const k = initKaplay();

    k.setGravity(2000)

    initAssets(k);
    initFieldCollision(k);
    initConsole(k);

    const player1 = initPlayer1(k);
    const player2 = initPlayer2(k);
    playerUpdate(k, player1);
    playerUpdate(k, player2);


    k.debug.inspect = true;
}