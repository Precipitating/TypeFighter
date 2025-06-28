import {type GameObj, type KAPLAYCtx } from "kaplay";


const consoleCommands = ["right", "left", "up", "crouch", "uncrouch", "throw", "grenade",
                         "block", "deflect", "down"] as string[];



                         
function HandleDirection(currPlayer : GameObj, otherPlayer : GameObj) : void{
    if ((currPlayer.pos.x - otherPlayer.pos.x < 0) && (currPlayer.flipX)){
        currPlayer.flipX = false;
    }
    else if ((currPlayer.pos.x - otherPlayer.pos.x > 0) && (!currPlayer.flipX)){
        currPlayer.flipX = true;
    }

    

}
function updateConsole(k: KAPLAYCtx, textInput: GameObj, selectedPlayer: string): void
{
    textInput.onUpdate(() => {
        
        if (k.isKeyPressed("enter")) {
            const player = k.get(selectedPlayer)[0] as GameObj;
            const otherPlayerString = (selectedPlayer == "player1") ? "player2" : "player1" as string;
            const otherPlayer = k.get(otherPlayerString)[0] as GameObj;
   
            // states
            if (consoleCommands.includes(textInput.typedText) && player.canExecuteCommands){
                if (player.crouched && textInput.typedText != "uncrouch"){
                    return;
                }
                player.canExecuteCommands = false;
                player.enterState(textInput.typedText);
                //k.get("player1")[0].enterState("throw");
            }
            else
            {
                // detect word projectiles and destroy if typed
                const projectileList = k.get("projectile");
                projectileList.forEach((proj) => {
                    if (proj.text == textInput.typedText){
                        k.destroy(proj);
                    }
                })


            }
            
            // adjust sprite flipping to always face each other
            HandleDirection(player, otherPlayer);
            HandleDirection(otherPlayer, player);
             
            textInput.text = "";
            textInput.typedText = "";

        }
        
    })

 
}
function initConsole(k: KAPLAYCtx, selectedPlayer: string, allowedStates: string[]): void
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
        k.textInput(true, 20),
        k.pos(130, k.height() - 72),
        k.anchor("left"),
        k.color(1,255,1)

    ]);

    updateConsole(k, textInput, selectedPlayer);
}

export default {
    updateConsole,
    initConsole
}
