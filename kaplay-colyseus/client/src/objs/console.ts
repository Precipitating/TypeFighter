import { type GameObj} from "kaplay";
import { consoleCommands, validCrouchCommands } from "../../../globals";
import { Room } from "colyseus.js";
import type {
  MyRoomState,
  Player,
} from "../../../server/src/rooms/schema/MyRoomState";
import { k } from "../App";

function handleCommandIfCrouched(
  textInput: GameObj,
  room: Room<MyRoomState>,
  playerSchema: Player
) {
  if (playerSchema.isCrouched) {
    if (validCrouchCommands.includes(textInput.typedText)) {
      room.send("updatePlayerState", {
        key: "canExecuteCommands",
        value: false,
      });
      room.send("state", {
        cmd: textInput.typedText,
      });
    }
    textInput.text = "";
    textInput.typedText = "";
    return true;
  }

  return false;
}

function destroyProjectileCommand(textInput: GameObj, room: Room<MyRoomState>) {
  const projectileList = k.get("projectile");
  projectileList.forEach((proj) => {
    if (proj.text === textInput.typedText) {
      k.play("pop");
      room.send("destroyProjectile", { schemaId: proj.schemaId });
      k.debug.log(proj.schemaId);
    }
  });
}

function handleValidStateCommand(textInput: GameObj, room: Room<MyRoomState>) {
  room.send("updatePlayerState", {
    key: "canExecuteCommands",
    value: false,
  });
  room.send("state", {
    cmd: textInput.typedText,
  });
}

function updateConsole(
  textInput: GameObj,
  room: Room<MyRoomState>,
  playerSchema: Player
): void {
  if (playerSchema.sessionId !== room.sessionId) return;
  if (k.isKeyPressed("enter")) {
    // handle commands if crouched
    if (handleCommandIfCrouched(textInput, room, playerSchema)) {
      return;
    }
    // states
    if (
      consoleCommands.includes(textInput.typedText) &&
      playerSchema.canExecuteCommands
    ) {
      handleValidStateCommand(textInput, room);
    } else {
      // detect word projectiles and destroy if typed
      destroyProjectileCommand(textInput, room);
    }

    textInput.text = "";
    textInput.typedText = "";
  }
}
function initConsole(room: Room<MyRoomState>, playerSchema: Player): void {
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
        updateConsole(this, room, playerSchema);
      },
    },
  ]);
}

export default {
  initConsole,
};
