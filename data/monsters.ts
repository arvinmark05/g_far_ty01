
import { Monster, MonsterRole } from '../types';

// =================================================================
// 怪物資料庫 - 按區域組織
// 每區域: 3 普通怪 (STANDARD/TANK/RUSHER) + 1 亞種
// =================================================================

export const MONSTERS: Monster[] = [

  // =================================================================
  // 區域 1: 地城迷宮 (Floor 1 - 100)
  // =================================================================
  {
    name: '史萊姆', emoji: '🟢', role: 'STANDARD', floorRange: [1, 100],
    hp: 78, atk: 21, def: 7, speed: 25, gold: 12, exp: 20,
    description: '身體半透明的凝膠生物，動作緩慢。'
  },
  {
    name: '洞穴蝙蝠', emoji: '🦇', role: 'RUSHER', floorRange: [1, 100],
    hp: 46, atk: 10, def: 3, speed: 45, gold: 15, exp: 25,
    description: '速度極快，在黑暗中襲擊冒險者。'
  },
  {
    name: '鐵皮哥布林', emoji: '👺', role: 'TANK', floorRange: [1, 100],
    hp: 156, atk: 16, def: 20, speed: 20, gold: 20, exp: 30,
    description: '偷了鍋蓋當盾牌的哥布林，很耐打。'
  },
  // --- 亞種 ---
  {
    name: '劇毒史萊姆', emoji: '🟣', role: 'STANDARD', floorRange: [1, 100], isSubSpecies: true,
    hp: 234, atk: 13, def: 10, speed: 60, gold: 30, exp: 45,
    onHitEffect: { applyStatus: 'poison', statusChance: 0.90 },
    description: '變異的紫色史萊姆，體內含有劇毒酸液。'
  },

  // =================================================================
  // 區域 2: 陰森森林 (Floor 101 - 200)
  // =================================================================
  {
    name: '骷髏兵', emoji: '💀', role: 'STANDARD', floorRange: [101, 200],
    hp: 180, atk: 35, def: 25, speed: 30, gold: 45, exp: 55,
    description: '死而不僵的戰士，骨骼堅硬。'
  },
  {
    name: '狂暴野狼', emoji: '🐺', role: 'RUSHER', floorRange: [101, 200],
    hp: 120, atk: 20, def: 10, speed: 45, gold: 50, exp: 65,
    onHitEffect: { applyStatus: 'bleed', statusChance: 0.25 },
    description: '森林深處的掠食者，獠牙鋒利。'
  },
  {
    name: '殭屍蘑菇', emoji: '🍄', role: 'TANK', floorRange: [101, 200],
    hp: 300, atk: 25, def: 40, speed: 15, gold: 40, exp: 60,
    onHitEffect: { applyStatus: 'poison', statusChance: 1.0 },
    description: '被孢子感染的巨大蘑菇，皮膚充滿彈性。'
  },
  // --- 亞種 ---
  {
    name: '寒霜座狼', emoji: '❄️', role: 'RUSHER', floorRange: [101, 200], isSubSpecies: true,
    hp: 240, atk: 12, def: 15, speed: 45, gold: 70, exp: 90,
    onHitEffect: { applyStatus: 'frozen', statusChance: 0.90 },
    description: '適應了極寒氣候的狼，呼出的氣息能凍結獵物。'
  },

  // =================================================================
  // 區域 3: 礦山山脈 (Floor 201 - 300)
  // =================================================================
  {
    name: '獸人戰士', emoji: '🐗', role: 'STANDARD', floorRange: [201, 300],
    hp: 450, atk: 70, def: 50, speed: 35, gold: 80, exp: 100,
    onHitEffect: { applySelfBuff: 'counter_stance', selfBuffChance: 0.25 },
    description: '力大無窮的蠻族戰士。'
  },
  {
    name: '熔岩精靈', emoji: '🔥', role: 'RUSHER', floorRange: [201, 300],
    hp: 250, atk: 50, def: 20, speed: 55, gold: 90, exp: 120,
    onHitEffect: { applyStatus: 'burn', statusChance: 1.0 },
    description: '從岩漿中誕生的火焰生物。'
  },
  {
    name: '岩石巨像', emoji: '🗿', role: 'TANK', floorRange: [201, 300],
    hp: 800, atk: 50, def: 120, speed: 10, gold: 70, exp: 110,
    onHitEffect: { applyStatus: 'stun', statusChance: 0.55 },
    description: '由堅硬礦石構成的魔法生物，幾乎刀槍不入。'
  },
  // --- 亞種 ---
  {
    name: '熔岩巨像', emoji: '🌋', role: 'TANK', floorRange: [201, 300], isSubSpecies: true,
    hp: 2400, atk: 50, def: 150, speed: 8, gold: 120, exp: 180,
    onHitEffect: { applyStatus: 'burn', statusChance: 0.95 },
    description: '核心是流動的岩漿，攻擊它的人會被灼傷。'
  },

  // =================================================================
  // 區域 4: 舊文明遺跡 (Floor 301 - 400)
  // =================================================================
  {
    name: '遺跡守衛', emoji: '🤖', role: 'STANDARD', floorRange: [301, 400],
    hp: 1000, atk: 120, def: 80, speed: 40, gold: 150, exp: 200,
    onHitEffect: { applySelfBuff: 'counter_stance', selfBuffChance: 0.25 },
    description: '古代文明留下的自動防衛機械。'
  },
  {
    name: '詛咒魔導書', emoji: '📖', role: 'RUSHER', floorRange: [301, 400],
    hp: 600, atk: 60, def: 40, speed: 60, gold: 180, exp: 250,
    onHitEffect: { applyStatus: 'stun', statusChance: 0.35 },
    description: '記載著禁忌魔法的書本，會發射強力光束。'
  },
  {
    name: '寶箱怪', emoji: '📦', role: 'TANK', floorRange: [301, 400],
    hp: 1800, atk: 90, def: 150, speed: 20, gold: 300, exp: 280,
    onHitEffect: { applyStatus: 'bleed', statusChance: 0.40 },
    description: '偽裝成寶物的陷阱，外殼異常堅硬。'
  },
  // --- 亞種 ---
  {
    name: '超載守衛', emoji: '⚡', role: 'RUSHER', floorRange: [301, 400], isSubSpecies: true,
    hp: 1200, atk: 50, def: 60, speed: 65, gold: 250, exp: 350,
    onHitEffect: { applyStatus: 'stun', statusChance: 0.25 },
    description: '動力爐失控的古代機械，速度快得驚人。'
  },

  // =================================================================
  // 區域 5: 黑暗荒漠 (Floor 401 - 500)
  // =================================================================
  {
    name: '夢魘', emoji: '😈', role: 'STANDARD', floorRange: [401, 500],
    hp: 2500, atk: 220, def: 180, speed: 45, gold: 400, exp: 500,
    onHitEffect: { applyStatus: 'poison', statusChance: 0.30 },
    description: '來自深淵的惡意實體化。'
  },
  {
    name: '暗影魔', emoji: '🥷', role: 'RUSHER', floorRange: [401, 500],
    hp: 1500, atk: 120, def: 50, speed: 80, gold: 450, exp: 600,
    onHitEffect: { applyStatus: 'bleed', statusChance: 0.40 },
    description: '隱藏在風沙中的殺手，一擊致命。'
  },
  {
    name: '巨型蚯蚓', emoji: '🪱', role: 'TANK', floorRange: [401, 500],
    hp: 4500, atk: 180, def: 300, speed: 20, gold: 350, exp: 550,
    description: '吞噬一切的沙漠巨獸，皮厚肉粗。'
  },
  // --- 亞種 ---
  {
    name: '虛空夢魘', emoji: '👻', role: 'STANDARD', floorRange: [401, 500], isSubSpecies: true,
    hp: 3000, atk: 250, def: 100, speed: 50, gold: 600, exp: 800,
    onHitEffect: { applySelfBuff: 'evasion_stance', selfBuffChance: 1.0 },
    description: '介於存在與不存在之間，物理攻擊難以命中。'
  }
];

// =================================================================
// 區域菁英怪物 (每區域 3 隻，在 x9 樓層固定出現)
// =================================================================
export const ELITE_MONSTERS: Monster[] = [
  // --- 區域 1: 地城菁英 (Floor 1-100) ---
  {
    name: '骨刃戰士', emoji: '⚔️', role: 'STANDARD', floorRange: [1, 100], isElite: true,
    hp: 200, atk: 25, def: 12, speed: 35, gold: 40, exp: 60,
    onHitEffect: { applyStatuses: [{ status: 'bleed', chance: 0.50 }, { status: 'poison', chance: 0.30 }] },
    description: '手持骨製雙刀的精銳戰士。'
  },
  {
    name: '暴食史萊姆王', emoji: '👑', role: 'TANK', floorRange: [1, 100], isElite: true,
    hp: 350, atk: 18, def: 20, speed: 20, gold: 50, exp: 70,
    onHitEffect: { applyStatuses: [{ status: 'poison', chance: 0.40 }], applySelfBuffs: [{ buff: 'fortify', chance: 0.40 }] },
    description: '吞噬了無數同族的巨型史萊姆。'
  },
  {
    name: '陰影刺客', emoji: '🗡️', role: 'RUSHER', floorRange: [1, 100], isElite: true,
    hp: 120, atk: 35, def: 5, speed: 55, gold: 45, exp: 65,
    onHitEffect: { applyStatuses: [{ status: 'poison', chance: 0.60 }, { status: 'bleed', chance: 0.40 }] },
    description: '潛伏在黑暗中的致命殺手。'
  },

  // --- 區域 2: 森林菁英 (Floor 101-200) ---
  {
    name: '腐化樹人', emoji: '🌳', role: 'TANK', floorRange: [101, 200], isElite: true,
    hp: 500, atk: 40, def: 60, speed: 15, gold: 90, exp: 120,
    onHitEffect: { applyStatuses: [{ status: 'poison', chance: 0.70 }, { status: 'frozen', chance: 0.30 }] },
    description: '被黑暗侵蝕的古老樹人。'
  },
  {
    name: '狼人獵手', emoji: '🐕', role: 'RUSHER', floorRange: [101, 200], isElite: true,
    hp: 280, atk: 55, def: 25, speed: 50, gold: 100, exp: 130,
    onHitEffect: { applyStatuses: [{ status: 'bleed', chance: 0.50 }], applySelfBuffs: [{ buff: 'berserk', chance: 0.35 }] },
    description: '滿月之夜變身的獵殺者。'
  },
  {
    name: '亡靈騎兵', emoji: '🐴', role: 'STANDARD', floorRange: [101, 200], isElite: true,
    hp: 380, atk: 48, def: 35, speed: 40, gold: 110, exp: 140,
    onHitEffect: { applyStatuses: [{ status: 'frozen', chance: 0.45 }, { status: 'bleed', chance: 0.35 }] },
    description: '騎著幽靈戰馬的不死騎士。'
  },

  // --- 區域 3: 礦山菁英 (Floor 201-300) ---
  {
    name: '炸藥哥布林', emoji: '🧨', role: 'RUSHER', floorRange: [201, 300], isElite: true,
    hp: 500, atk: 300, def: 40, speed: 10, gold: 180, exp: 220,
    onHitEffect: { applyStatuses: [{ status: 'burn', chance: 1.00 }, { status: 'stun', chance: 0.50 }] },
    description: '背著危險的紅色火藥桶，必須速戰速決！'
  },
  {
    name: '礦工亡魂', emoji: '⛏️', role: 'STANDARD', floorRange: [201, 300], isElite: true,
    hp: 750, atk: 80, def: 70, speed: 35, gold: 160, exp: 200,
    onHitEffect: { applyStatuses: [{ status: 'bleed', chance: 0.45 }], applySelfBuffs: [{ buff: 'counter_stance', chance: 0.50 }] },
    description: '死於礦難的怨靈，徘徊不散。'
  },
  {
    name: '結晶巨人', emoji: '💎', role: 'TANK', floorRange: [201, 300], isElite: true,
    hp: 1200, atk: 65, def: 150, speed: 12, gold: 200, exp: 250,
    onHitEffect: { applyStatuses: [{ status: 'frozen', chance: 0.40 }], applySelfBuffs: [{ buff: 'fortify', chance: 0.60 }] },
    description: '由純淨水晶構成的魔法生物。'
  },

  // --- 區域 4: 遺跡菁英 (Floor 301-400) ---
  {
    name: '失控傀儡', emoji: '🎭', role: 'STANDARD', floorRange: [301, 400], isElite: true,
    hp: 1500, atk: 140, def: 100, speed: 45, gold: 350, exp: 400,
    onHitEffect: { applyStatuses: [{ status: 'stun', chance: 0.40 }, { status: 'bleed', chance: 0.35 }] },
    description: '古代魔法師製作的戰鬥傀儡。'
  },
  {
    name: '時空裂隙', emoji: '🌀', role: 'RUSHER', floorRange: [301, 400], isElite: true,
    hp: 900, atk: 160, def: 60, speed: 70, gold: 400, exp: 450,
    onHitEffect: { applyStatuses: [{ status: 'frozen', chance: 0.45 }], applySelfBuffs: [{ buff: 'haste', chance: 0.70 }] },
    description: '時空扭曲產生的異常現象。'
  },
  {
    name: '護殿石像', emoji: '🗽', role: 'TANK', floorRange: [301, 400], isElite: true,
    hp: 2500, atk: 110, def: 200, speed: 18, gold: 380, exp: 420,
    onHitEffect: { applyStatuses: [{ status: 'stun', chance: 0.35 }], applySelfBuffs: [{ buff: 'counter_stance', chance: 0.45 }, { buff: 'fortify', chance: 0.30 }] },
    description: '守護遺跡入口的巨大石像。'
  },

  // --- 區域 5: 荒漠菁英 (Floor 401-500) ---
  {
    name: '沙漠狩獵者', emoji: '🦂', role: 'RUSHER', floorRange: [401, 500], isElite: true,
    hp: 4000, atk: 280, def: 150, speed: 70, gold: 800, exp: 1200,
    onHitEffect: { applyStatuses: [{ status: 'poison', chance: 0.85 }, { status: 'bleed', chance: 0.60 }] },
    description: '劇毒蠍尾的沙漠殺手。'
  },
  {
    name: '沙暴元素', emoji: '🌪️', role: 'STANDARD', floorRange: [401, 500], isElite: true,
    hp: 5000, atk: 200, def: 200, speed: 50, gold: 750, exp: 1100,
    onHitEffect: { applyStatuses: [{ status: 'burn', chance: 0.50 }, { status: 'frozen', chance: 0.40 }], applySelfBuffs: [{ buff: 'haste', chance: 0.60 }] },
    description: '由沙暴凝聚而成的元素生物。'
  },
  {
    name: '死亡騎士', emoji: '🏇', role: 'TANK', floorRange: [401, 500], isElite: true,
    hp: 6500, atk: 260, def: 280, speed: 35, gold: 900, exp: 1300,
    onHitEffect: { applyStatuses: [{ status: 'bleed', chance: 0.70 }, { status: 'frozen', chance: 0.45 }], applySelfBuffs: [{ buff: 'berserk', chance: 0.35 }] },
    description: '被詛咒的不死騎士。'
  }
];

// =================================================================
// BOSS 怪物 - 每 100 層一個
// =================================================================
export const BOSS_MONSTERS: Record<number, Monster> = {
  100: {
    name: '巨魔領主', emoji: '👹', role: 'BOSS', isBoss: true,
    hp: 800, atk: 60, def: 100, speed: 25, gold: 500, exp: 300,
    description: '統領地城迷宮的巨魔王者。'
  },
  200: {
    name: '死靈法師', emoji: '🧙‍♂️', role: 'BOSS', isBoss: true,
    hp: 1400, atk: 50, def: 60, speed: 70, gold: 1000, exp: 600,
    onHitEffect: {
      applyStatuses: [
        { status: 'poison', chance: 0.95 },
        { status: 'bleed', chance: 0.85 }
      ]
    },
    description: '操控亡者的黑暗魔法師。'
  },
  300: {
    name: '遠古巨龍', emoji: '🐲', role: 'BOSS', isBoss: true,
    hp: 6666, atk: 200, def: 250, speed: 20, gold: 2000, exp: 1800,
    onHitEffect: { applyStatus: 'burn', statusChance: 1.00 },
    description: '沉睡千年的火焰巨龍。'
  },
  400: {
    name: '吸血伯爵', emoji: '🧛', role: 'BOSS', isBoss: true,
    hp: 11111, atk: 222, def: 160, speed: 88, gold: 4000, exp: 4800,
    onHitEffect: { applyStatus: 'bleed', statusChance: 1.00 },
    description: '永生的血族貴族，以獵殺冒險者為樂。'
  },
  500: {
    name: '暗影魔王', emoji: '👿', role: 'BOSS', isBoss: true,
    hp: 44444, atk: 200, def: 300, speed: 66, gold: 10000, exp: 10000,
    onHitEffect: {
      applyStatuses: [
        { status: 'poison', chance: 0.95 },
        { status: 'burn', chance: 0.90 },
        { status: 'bleed', chance: 0.85 }
      ]
    },
    description: '深淵的統治者，一切黑暗的源頭。'
  }
};
