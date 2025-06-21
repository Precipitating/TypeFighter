import kaplay from "kaplay"

const canvas = document.getElementById("game") as HTMLCanvasElement;

export default function initKaplay()
{
  return kaplay({
    width: 1920,
    height: 1080,
    letterbox: true,
    global: false,
    debug: true,
    debugKey: "f1",
    pixelDensity: devicePixelRatio,
    canvas: canvas,
  });
}
