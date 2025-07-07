import { type GameObj, type KAPLAYCtx } from "kaplay";
import { consoleCommands, validCrouchCommands } from "../../../globals";
import { Room } from "colyseus.js";
import type { MyRoomState } from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";

function HandleDirection(currPlayer: GameObj): void {
  const otherPlayerString =
    currPlayer.team === "player1" ? "player2" : "player1";

  const otherPlayer = k.get(otherPlayerString)[0]
    ? k.get(otherPlayerString)[0]
    : null;

  if (otherPlayer && currPlayer) {
    if (currPlayer.pos.x - otherPlayer.pos.x < 0 && currPlayer.flipX) {
      currPlayer.flipX = false;
    } else if (currPlayer.pos.x - otherPlayer.pos.x > 0 && !currPlayer.flipX) {
      currPlayer.flipX = true;
    }
  }
}
function updateConsole(textInput: GameObj, room: Room<MyRoomState>): void {
  if (k.isKeyPressed("enter")) {
    const player = k.get("localPlayer")[0];
    // handle commands if crouched
    if (player.crouched) {
      if (validCrouchCommands.includes(textInput.typedText)) {
        player.canExecuteCommands = false;
        room.send("state", {cmd:textInput.typedText, sessionId: player.sessionId});
      }
      textInput.text = "";
      textInput.typedText = "";
      return;
    }

    // states
    if (
      consoleCommands.includes(textInput.typedText) &&
      player.canExecuteCommands
    ) {
      player.canExecuteCommands = false;
      room.send("state", {cmd:textInput.typedText, sessionId: player.sessionId});
    } else {
      // detect word projectiles and destroy if typed
      const projectileList = k.get("projectile");
      projectileList.forEach((proj) => {
        if (proj.text === textInput.typedText) {
          room.send("destroyProjectile", {schemaId: proj.schemaId});
        }
      });
    }

    // adjust sprite flipping to always face each other
    HandleDirection(player);

    textInput.text = "";
    textInput.typedText = "";
  }
}
function initConsole(room: Room<MyRoomState>): void {
  // add console bg
  k.add([
    k.pos(k.width() / 2, k.height() - 107),
    k.rect(k.width(), 215),
    k.color(1, 1, 1),
    k.anchor("center"),
  ]);
  k.add([
    k.pos(k.width() / 2, k.height() - 108),
    k.rect(1870, 180, { radius: 40 }),
    k.color(1, 1, 1),
    k.anchor("center"),
    k.outline(4, k.GREEN),
  ]);

  k.add([
    k.text(">", { font: "dogica-bold" }),
    k.pos(90, k.height() - 70),
    k.anchor("left"),
    k.color(1, 255, 1),
  ]);

  // text input
  k.add([
    k.text("", { font: "dogica", size: 30 }),
    k.textInput(true, 20),
    k.pos(130, k.height() - 72),
    k.anchor("left"),
    k.color(1, 255, 1),
    {
      update(this: GameObj) {
        updateConsole(this, room);
      },
    },
  ]);
}

export default {
  initConsole,
};
