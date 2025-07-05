import './index.css';
import kaplay from 'kaplay'
import { colyseusSDK } from "./core/colyseus";
import { createLobbyScene } from './scenes/lobby';
import type { MyRoomState } from '../../server/src/rooms/schema/MyRoomState';

// Initialize kaplay
export const k = kaplay({
    width: 1920,
    height: 1080,
    letterbox: true,
    global: false,
    debug: true,
    debugKey: "f1",
    pixelDensity: devicePixelRatio
  });

// Create all scenes
await createLobbyScene();

async function main() {
  k.loadFont("dogica", "./assets/fonts/dogica.woff");
  k.loadFont("dogica-bold", "./assets/fonts/dogicabold.woff");
  
  const text = k.add([
    k.text("Joining room ..."),
    k.pos(k.center()),
    k.anchor("center")
  ]);

  const room = await colyseusSDK.joinOrCreate<MyRoomState>("my_room", {
    name: "Ka"
  });

  text.text = "Success! sessionId: " + room.sessionId;

  k.go("lobby", room);
}

main();
