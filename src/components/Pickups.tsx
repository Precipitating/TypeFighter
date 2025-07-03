import type { KAPLAYCtx, GameObj } from "kaplay";
import projectile from "./Projectile";

const spawnTimeMin = 5;
const spawnTimeMax = 20;
const healthPackHeal = 30;

type ItemConfig = {
  tags: string[];
  lifespan: number;
  getComponents: (k: KAPLAYCtx) => any[];
};

const itemConfigs: Record<string, ItemConfig> = {
  grenade: {
    tags: ["pickup", "grenadePickup"],
    lifespan: 20,
    getComponents: (k) => [k.circle(10), k.color(k.GREEN), k.outline(3)],
  },
  healthPack: {
    tags: ["pickup", "healthPickup"],
    lifespan: 20,
    getComponents: (k) => [
      k.rect(70, 50),
      k.color(k.RED),
      k.outline(3),
      {
        // add cross
        add() {
          this.add([k.rect(10, 40), k.pos(30, 5), k.color(k.WHITE)]);
          this.add([k.rect(45, 10), k.pos(13, 20), k.color(k.WHITE)]);
        },
      },
    ],
  },
  mine: {
    tags: ["pickup", "minePickup"],
    lifespan: 20,
    getComponents: (k) => [k.sprite("mine"), k.scale(2)],
  },
  seekingProjectile: {
    tags: ["pickup", "seekingPickup"],
    lifespan: 20,
    getComponents: (k) => [
      k.text("seeking bullet", {
        font: "Comic Sans MS",
        size: 20,
      }),
      k.color(255, 215, 0),
    ],
  },
};

function spawnRandomItem(k: KAPLAYCtx): void {
  k.loop(k.rand(spawnTimeMin, spawnTimeMax), () => {
    const randomX = k.rand(100, k.width() - 100);
    const randomY = k.rand(50, k.height() - 300);

    const randomItem = k.choose(Object.keys(itemConfigs));
    const config = itemConfigs[randomItem];

    spawnItemFromConfig(k, randomX, randomY, config);
  });
}

function spawnItemFromConfig(
  k: KAPLAYCtx,
  x: number,
  y: number,
  config: ItemConfig
): void {
  const item = k.add([
    k.pos(x, y),
    k.area({ collisionIgnore: ["solid"] }),
    k.lifespan(config.lifespan, { fade: 0.5 }),
    k.opacity(1),
    k.animate({ relative: true }),
    ...(config.tags ?? []),
    ...config.getComponents(k),
  ]);

  // floating anim
  item.animate("pos", [k.vec2(0,10), k.vec2(0,-10)], {
    duration: 1,
    direction: "ping-pong"
  });
}

export const pickupHandler: Record<string, (k: KAPLAYCtx, item: GameObj, player: GameObj) => void> = {
  grenadePickup: function(_, item, player) {
    ++player.grenadeCount;
    item.destroy();
  },
  healthPickup: function(_, item, player) {
    player.hp += healthPackHeal;
    item.destroy();
  },
  minePickup: function(_, item, player){
    ++player.mineCount;
    item.destroy();
  },
  seekingPickup: function(k, item, player){
    const proj = projectile.spawnWordBullet(k, item.pos, k.vec2(1,0), player.is("player1") ? "player1" : "player2");
    proj.tag("seeking");
    item.destroy();

  }
};

export default {
  spawnRandomItem,
};
