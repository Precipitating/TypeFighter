export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;
export const GRENADE_SHRAPNEL_COUNT = 10;
export const SHRAPNEL_SPREAD = 360;
export const allowedStates = [
  "idle",
  "stunned",
  "right",
  "left",
  "jump",
  "jump left",
  "jump right",
  "down",
  "crouch",
  "uncrouch",
  "throw",
  "throw up",
  "throw down",
  "grenade",
  "block",
  "deflect",
  "falling",
  "air-knockback",
  "deploy mine",
];

export const consoleCommands = [
  "right",
  "left",
  "jump",
  "jump left",
  "jump right",
  "crouch",
  "throw",
  "grenade",
  "throw up",
  "throw down",
  "block",
  "deflect",
  "down",
];
export const validCrouchCommands = ["deploy mine", "uncrouch"];

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function distance2D(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
// platform
export const PLATFORM_SCALE = { min: 0.5, max: 1.5 };
export const PLATFORM_ANIM_DURATION = { min: 3, max: 10 };
export const PLATFORM_MOVE_X = { min: 100, max: GAME_WIDTH - 100 };
export const PLATFORM_MOVE_Y = { min: 100, max: 800 };
export const PLATFORM_X = { min: 100, max: GAME_WIDTH };
export const PLATFORM_Y = { min: 300, max: 500 };
export const PLATFORM_COUNT = getRandomInt(3, 6);
export const PLATFORM_DIST_APART = 250;
