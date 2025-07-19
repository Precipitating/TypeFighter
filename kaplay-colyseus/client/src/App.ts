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
    debug: false,
    debugKey: "f1",
    pixelDensity: devicePixelRatio
  });

// Create all scenes
await createLobbyScene();

async function main() {
  k.loadFont("dogica", "./assets/fonts/dogica.woff", {outline: 2, filter: 'linear'});
  k.loadHappy();
  k.loadFont("froginvert", "./assets/fonts/froginvert.ttf");
  k.loadFont("frog", "./assets/fonts/frog.ttf");

  
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
