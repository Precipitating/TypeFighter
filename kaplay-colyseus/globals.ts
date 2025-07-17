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
  "hurt",
  "stand-up"
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
export const PLATFORM_ANIM_DURATION = { min: 5, max: 10 };
export const PLATFORM_MOVE_X = { min: 200, max: GAME_WIDTH - 100 };
export const PLATFORM_MOVE_Y = { min: 100, max: 800 };
export const PLATFORM_X = { min: 100, max: GAME_WIDTH };
export const PLATFORM_Y = { min: 300, max: 500 };
export const PLATFORM_COUNT = getRandomInt(3, 6);
export const PLATFORM_DIST_APART = 250;


// pickups
export const VALID_PICKUP_SPAWN_LOCATION_X = {min: 100, max: GAME_WIDTH - 100};
export const VALID_PICKUP_SPAWN_LOCATION_Y = {min: 50, max: GAME_HEIGHT - 300};
export const PICKUP_SPAWN_TIME = {min: 10000, max: 20000};
export const PICKUP_TYPES = ["grenade", "healthPack", "mine", "seekingProjectile", "shield"];
export const HEALTH_PACK_HEAL_VAL = 20;
export const PICKUP_DESPAWN_TIME = {min: 15000, max: 20000}; // ms
export const SHIELD_ACTIVE_TIME = 7000; // ms

// text
export const FONT_TYPES = ["happy", "dogica", "frog", "froginvert"];
export const BASE_TEXT_LENGTH = 5;

// client
export const MOVEMENT_CORRECTION_SPEED = 20;


// throw
export const THROW_ANGLE_OFFSET = 120;
export const DEFAULT_WORD_THROW_SPEED = 500;
export const DEFAULT_WORD_THROW_KNOCKBACK = 300;
export const PLAYER_PROJECTILE_SPAWN_OFFSET = {x: 200, y: 150 };


// sound
export const HURT_SOUND_LIST = ["hurt1", "hurt2", "hurt3"];
export const THROW_SOUND_LIST = ["throw1", "throw2", "throw3","throw4"];
export const GRENADE_BOUNCE_SOUND_LIST = ["grenadebounce1", "grenadebounce2"];
export const MUSIC_LIST = ["theme1", "theme2"];
export const WALK_SOUND_LIST = ["footstep1", "footstep2"];

// player
export const DEFAULT_WORD_BULLET_DAMAGE = 10;
export const DEFAULT_GRENADE_COOLDOWN = 3;
export const DEFAULT_AIR_STUN_TIME = 1;
export const DEFAULT_THROW_COOLDOWN = 0.5;
export const DEFAULT_BLOCK_TIME = 1;
export const DEFAULT_DEFLECT_TIME = 0.5;
export const DEFAULT_JUMP_STRENGTH = 2700;
export const DEFAULT_LEAP_STRENGTH = 1700;
export const DEFAULT_SPEED = 300;


