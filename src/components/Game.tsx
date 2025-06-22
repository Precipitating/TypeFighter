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
    k.loadSprite("character", "./Walking.png",{
        sliceY: 1,
        sliceX: 12,
        anims: {
            "idle": 2, 
            "walk": {from: 1, to: 11, loop: true}
        }
    });
    // load font
    k.loadFont("dogica", "./fonts/dogica.woff")
    k.loadFont("dogica-bold", "./fonts/dogicabold.woff")

    // background
    k.add([k.sprite("bg"), k.pos(0,-300), k.scale(1,0.9)]);

}

function playerUpdate(k: KAPLAYCtx, player: GameObj){
    
    player.onStateUpdate("right", async() => {
        player.direction.x = 0;
        player.direction.y = 0;
        player.direction.x = 1;

        player.move(player.direction.scale(player.speed));

        await k.wait(0.1);
        player.enterState("idle");


    });
    player.onStateUpdate("left", async() => {
        player.direction.x = 0;
        player.direction.y = 0;
        player.direction.x = -1;

        player.move(player.direction.scale(player.speed));

        await k.wait(0.1);
        player.enterState("idle");


    });


    player.onStateEnter("up", async() => {
        player.jump(1200);
        await k.wait(1);
        player.enterState("idle");

    });


    player.onStateEnter("down", async() => {
        const originalArea = player.area.shape;
        player.use(k.area({shape: new k.Rect(k.vec2(-5,0), 30, 30)}));
        await k.wait(1);
        player.use(k.area({shape: originalArea}));
        player.enterState("idle");

    });


    


}

function initPlayer1(k: KAPLAYCtx)
{
    // player left
    const player = k.add([
        k.sprite("character", {anim: "idle"}),
        k.area({shape: new k.Rect(k.vec2(-5,0), 30, 70)}),
        k.body({mass: 1}),
        k.anchor("bot"),
        k.pos(100, 500),
        k.scale(4),
        k.state("idle", allowedStates),
        k.health(100),
        "player1",
        {
            speed: 800,
            direction: k.RIGHT

        }
    ]);

    playerUpdate(k, player);
    
    return player

}

function initPlayer2(k: KAPLAYCtx)
{
    const player2 = k.add([
      k.sprite("character", { anim: "idle" }),
      k.area({ shape: new k.Rect(k.vec2(5, 0), 30, 70) }),
      k.body({ mass: 1 }),
      k.anchor("bot"),
      k.pos(1820, 500),
      k.scale(4),
      k.health(100),
      k.state("idle", allowedStates),
      "player2",
      {
        speed: 800,
        direction: k.LEFT,
      },
    ]);

    player2.flipX = true;



    playerUpdate(k, player2);

    return player2

}



export default function initGame() : void
{
    const k = initKaplay();

    k.setGravity(2000)

    initAssets(k);
    initFieldCollision(k);
    const player1 = initPlayer1(k);
    const player2 = initPlayer2(k);
    initConsole(k);


    k.debug.inspect = true;
}