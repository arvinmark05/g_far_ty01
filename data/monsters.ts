
import { Monster } from '../types';

export const MONSTERS: Monster[] = [
  { name: '史萊姆', emoji: '🟢', hp: 30, atk: 8, speed: 5, gold: 10, exp: 15 },
  { name: '哥布林', emoji: '👺', hp: 50, atk: 12, speed: 7, gold: 20, exp: 25 },
  { name: '骷髏兵', emoji: '💀', hp: 70, atk: 15, speed: 6, gold: 30, exp: 35 },
  { name: '獸人', emoji: '🐗', hp: 100, atk: 20, speed: 8, gold: 50, exp: 50 },
  { name: '暗影惡魔', emoji: '😈', hp: 150, atk: 30, speed: 10, gold: 80, exp: 75 },
  { name: '巨龍', emoji: '🐉', hp: 300, atk: 50, speed: 12, gold: 200, exp: 150 }
];

export const BOSS_MONSTERS: Record<number, Monster> = {
  100: { name: '巨魔領主', emoji: '👹', hp: 600, atk: 50, speed: 12, gold: 500, exp: 300, isBoss: true },
  200: { name: '死靈法師', emoji: '🧙‍♂️', hp: 1000, atk: 70, speed: 15, gold: 1000, exp: 600, isBoss: true },
  300: { name: '遠古巨龍', emoji: '🐲', hp: 2000, atk: 100, speed: 18, gold: 2000, exp: 1200, isBoss: true },
  400: { name: '吸血伯爵', emoji: '🧛', hp: 3500, atk: 140, speed: 22, gold: 4000, exp: 2000, isBoss: true },
  500: { name: '暗影魔王', emoji: '👿', hp: 6666, atk: 180, speed: 25, gold: 10000, exp: 5000, isBoss: true }
};
