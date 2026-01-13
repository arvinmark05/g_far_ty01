
import { Monster } from '../types';

// 怪物數據 - 根據層數動態縮放使用
export const MONSTERS: Monster[] = [
  { name: '史萊姆', emoji: '🟢', hp: 60, atk: 12, def: 5, speed: 25, gold: 12, exp: 20 },
  { name: '哥布林', emoji: '👺', hp: 90, atk: 18, def: 10, speed: 32, gold: 25, exp: 35 },
  { name: '骷髏兵', emoji: '💀', hp: 130, atk: 25, def: 18, speed: 30, gold: 40, exp: 50 },
  { name: '獸人', emoji: '🐗', hp: 200, atk: 35, def: 30, speed: 34, gold: 65, exp: 75 },
  { name: '暗影惡魔', emoji: '😈', hp: 350, atk: 55, def: 50, speed: 36, gold: 100, exp: 120 },
  { name: '巨龍', emoji: '🐉', hp: 600, atk: 80, def: 80, speed: 40, gold: 250, exp: 200 }
];

export const BOSS_MONSTERS: Record<number, Monster> = {
  100: { name: '巨魔領主', emoji: '👹', hp: 800, atk: 60, def: 40, speed: 25, gold: 500, exp: 300, isBoss: true },
  200: { name: '死靈法師', emoji: '🧙‍♂️', hp: 1400, atk: 90, def: 70, speed: 35, gold: 1000, exp: 600, isBoss: true },
  300: { name: '遠古巨龍', emoji: '🐲', hp: 2200, atk: 130, def: 110, speed: 30, gold: 2000, exp: 1200, isBoss: true },
  400: { name: '吸血伯爵', emoji: '🧛', hp: 3500, atk: 180, def: 160, speed: 44, gold: 4000, exp: 2000, isBoss: true },
  500: { name: '暗影魔王', emoji: '👿', hp: 5500, atk: 250, def: 220, speed: 35, gold: 10000, exp: 5000, isBoss: true }
};
