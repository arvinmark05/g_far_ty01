
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
    hp: 60, atk: 12, def: 5, speed: 25, gold: 12, exp: 20,
    description: '身體半透明的凝膠生物，動作緩慢。'
  },
  {
    name: '洞穴蝙蝠', emoji: '🦇', role: 'RUSHER', floorRange: [1, 100],
    hp: 35, atk: 6, def: 2, speed: 45, gold: 15, exp: 25,
    description: '速度極快，在黑暗中襲擊冒險者。'
  },
  {
    name: '鐵皮哥布林', emoji: '👺', role: 'TANK', floorRange: [1, 100],
    hp: 120, atk: 8, def: 15, speed: 20, gold: 20, exp: 30,
    description: '偷了鍋蓋當盾牌的哥布林，很耐打。'
  },
  // --- 亞種 ---
  {
    name: '劇毒史萊姆', emoji: '🟣', role: 'STANDARD', floorRange: [1, 100], isSubSpecies: true,
    hp: 90, atk: 18, def: 8, speed: 25, gold: 30, exp: 45,
    onHitEffect: { applyStatus: 'poison', statusChance: 0.50 },
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
    hp: 120, atk: 16, def: 10, speed: 45, gold: 50, exp: 65,
    description: '森林深處的掠食者，獠牙鋒利。'
  },
  {
    name: '殭屍蘑菇', emoji: '🍄', role: 'TANK', floorRange: [101, 200],
    hp: 300, atk: 25, def: 40, speed: 15, gold: 40, exp: 60,
    description: '被孢子感染的巨大蘑菇，皮膚充滿彈性。'
  },
  // --- 亞種 ---
  {
    name: '寒霜座狼', emoji: '❄️', role: 'RUSHER', floorRange: [101, 200], isSubSpecies: true,
    hp: 160, atk: 18, def: 15, speed: 45, gold: 70, exp: 90,
    onHitEffect: { applyStatus: 'frozen', statusChance: 0.30 },
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
    name: '炸藥哥布林', emoji: '🧨', role: 'RUSHER', floorRange: [201, 300],
    hp: 250, atk: 24, def: 20, speed: 55, gold: 90, exp: 120,
    description: '背著危險的紅色火藥桶，必須速戰速決！'
  },
  {
    name: '岩石巨像', emoji: '🗿', role: 'TANK', floorRange: [201, 300],
    hp: 800, atk: 50, def: 120, speed: 10, gold: 70, exp: 110,
    description: '由堅硬礦石構成的魔法生物，幾乎刀槍不入。'
  },
  // --- 亞種 ---
  {
    name: '熔岩巨像', emoji: '🌋', role: 'TANK', floorRange: [201, 300], isSubSpecies: true,
    hp: 1200, atk: 70, def: 150, speed: 8, gold: 120, exp: 180,
    onHitEffect: { applyStatus: 'burn', statusChance: 0.40 },
    description: '核心是流動的岩漿，攻擊它的人會被灼傷。'
  },

  // =================================================================
  // 區域 4: 舊文明遺跡 (Floor 301 - 400)
  // =================================================================
  {
    name: '遺跡守衛', emoji: '🤖', role: 'STANDARD', floorRange: [301, 400],
    hp: 1000, atk: 120, def: 80, speed: 40, gold: 150, exp: 200,
    description: '古代文明留下的自動防衛機械。'
  },
  {
    name: '詛咒魔導書', emoji: '📖', role: 'RUSHER', floorRange: [301, 400],
    hp: 600, atk: 40, def: 40, speed: 60, gold: 180, exp: 250,
    description: '記載著禁忌魔法的書本，會發射強力光束。'
  },
  {
    name: '寶箱怪', emoji: '📦', role: 'TANK', floorRange: [301, 400],
    hp: 1800, atk: 90, def: 150, speed: 20, gold: 300, exp: 280,
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
    name: '暗影惡魔', emoji: '😈', role: 'STANDARD', floorRange: [401, 500],
    hp: 2500, atk: 220, def: 180, speed: 45, gold: 400, exp: 500,
    onHitEffect: { applyStatus: 'poison', statusChance: 0.30 },
    description: '來自深淵的惡意實體化。'
  },
  {
    name: '暗影刺客', emoji: '🥷', role: 'RUSHER', floorRange: [401, 500],
    hp: 1500, atk: 60, def: 50, speed: 80, gold: 450, exp: 600,
    description: '隱藏在風沙中的殺手，一擊致命。'
  },
  {
    name: '巨型沙蟲', emoji: '🪱', role: 'TANK', floorRange: [401, 500],
    hp: 4500, atk: 180, def: 300, speed: 20, gold: 350, exp: 550,
    description: '吞噬一切的沙漠巨獸，皮厚肉粗。'
  },
  // --- 亞種 ---
  {
    name: '虛空夢魘', emoji: '👻', role: 'STANDARD', floorRange: [401, 500], isSubSpecies: true,
    hp: 3000, atk: 250, def: 100, speed: 50, gold: 600, exp: 800,
    onHitEffect: { applyStatus: 'bleed', statusChance: 0.35 },
    description: '介於存在與不存在之間，物理攻擊難以命中。'
  }
];

// =================================================================
// BOSS 怪物 - 每 100 層一個
// =================================================================
export const BOSS_MONSTERS: Record<number, Monster> = {
  100: {
    name: '巨魔領主', emoji: '👹', role: 'BOSS', isBoss: true,
    hp: 800, atk: 60, def: 40, speed: 25, gold: 500, exp: 300,
    description: '統領地城迷宮的巨魔王者。'
  },
  200: {
    name: '死靈法師', emoji: '🧙‍♂️', role: 'BOSS', isBoss: true,
    hp: 1400, atk: 90, def: 70, speed: 35, gold: 1000, exp: 600,
    onHitEffect: { applyStatus: 'poison', statusChance: 0.40 },
    description: '操控亡者的黑暗魔法師。'
  },
  300: {
    name: '遠古巨龍', emoji: '🐲', role: 'BOSS', isBoss: true,
    hp: 2200, atk: 130, def: 110, speed: 30, gold: 2000, exp: 1200,
    onHitEffect: { applyStatus: 'burn', statusChance: 0.50 },
    description: '沉睡千年的火焰巨龍。'
  },
  400: {
    name: '吸血伯爵', emoji: '🧛', role: 'BOSS', isBoss: true,
    hp: 3500, atk: 180, def: 160, speed: 44, gold: 4000, exp: 2000,
    onHitEffect: { applyStatus: 'bleed', statusChance: 0.40 },
    description: '永生的血族貴族，以獵殺冒險者為樂。'
  },
  500: {
    name: '暗影魔王', emoji: '👿', role: 'BOSS', isBoss: true,
    hp: 5500, atk: 250, def: 220, speed: 35, gold: 10000, exp: 5000,
    onHitEffect: { applyStatus: 'poison', statusChance: 0.35 },
    description: '深淵的統治者，一切黑暗的源頭。'
  }
};
