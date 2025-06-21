import initKaplay from "./KaplayWindow"

export default function initGame()
{
    const k = initKaplay()

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

    // background
    k.add([k.sprite("bg"), k.pos(0,-80), k.scale(1,0.9)]);


    // player left
    const player = k.add([
        k.sprite("character", {anim: "idle"}),
        k.area({shape: new k.Rect(k.vec2(-5,30), 30, 80)}),
        k.body({ isStatic: true }),
        k.anchor("center"),
        k.pos(100,720),
        k.scale(4),
        "player",
        {
            speed: 800,
            direction: k.vec2(0,0)

        }
    ]);
    
    k.debug.inspect = true;
    player.onUpdate(() => {
        player.direction.x = 0;
        player.direction.y = 0;

        if (k.isKeyDown("left")) player.direction.x = -1;
        if (k.isKeyDown("right")) player.direction.x = 1;

        player.move(player.direction.scale(player.speed));


    });

    // player right

        const player2 = k.add([
        k.sprite("character", {anim: "idle"}),
        k.area({shape: new k.Rect(k.vec2(5,30), 30, 80)}),
        k.body({ isStatic: true }),
        k.anchor("center"),
        k.pos(1820,720),
        k.scale(4),
        "player",
        {
            speed: 800,
            direction: k.vec2(-1,0)

        }
    ])

    player2.flipX = true;
    
    player2.onUpdate(() => {
        player.direction.x = -1;
        player.direction.y = 0;

    });
}