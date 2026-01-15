
import { Monster } from '../types';
import { MONSTERS, BOSS_MONSTERS } from '../data/monsters';

/**
 * 根據樓層生成怪物
 * 亞種出現機率：
 * - 區域前半段 (1-50%): 1%
 * - 區域中段 (51-80%): 5%
 * - 區域後段 (81-100%): 10%
 */
export function getMonsterForFloor(floor: number): Monster {
    // 檢查是否為 BOSS 層
    if (BOSS_MONSTERS[floor]) {
        const boss = BOSS_MONSTERS[floor];
        return {
            ...boss,
            maxHp: boss.hp,
            statusEffects: [],
            buffs: []
        };
    }

    // 獲取此樓層可出現的怪物
    const availableMonsters = MONSTERS.filter(m => {
        if (!m.floorRange) return false;
        return floor >= m.floorRange[0] && floor <= m.floorRange[1];
    });

    if (availableMonsters.length === 0) {
        // 樓層超過 500 使用區域5的怪物
        const region5Monsters = MONSTERS.filter(m => m.floorRange?.[0] === 401);
        return selectMonster(region5Monsters, floor, 401, 500);
    }

    // 確定區域範圍
    const floorRange = availableMonsters[0].floorRange!;
    return selectMonster(availableMonsters, floor, floorRange[0], floorRange[1]);
}

/**
 * 根據機率選擇怪物
 */
function selectMonster(monsters: Monster[], floor: number, rangeStart: number, rangeEnd: number): Monster {
    const normalMonsters = monsters.filter(m => !m.isSubSpecies);
    const subSpeciesMonsters = monsters.filter(m => m.isSubSpecies);

    // 計算亞種出現機率
    const rangeLength = rangeEnd - rangeStart + 1;
    const floorProgress = (floor - rangeStart) / rangeLength;

    let subSpeciesChance: number;
    if (floorProgress <= 0.50) {
        subSpeciesChance = 0.01; // 1%
    } else if (floorProgress <= 0.80) {
        subSpeciesChance = 0.05; // 5%
    } else {
        subSpeciesChance = 0.10; // 10%
    }

    // 決定是否生成亞種
    const isSubSpecies = subSpeciesMonsters.length > 0 && Math.random() < subSpeciesChance;
    const pool = isSubSpecies ? subSpeciesMonsters : normalMonsters;

    // 隨機選擇怪物
    const selectedBase = pool[Math.floor(Math.random() * pool.length)];

    // 套用樓層縮放
    return scaleMonsterToFloor(selectedBase, floor);
}

/**
 * 根據樓層縮放怪物數值
 * 每 10 層增加 10% 基礎數值
 */
function scaleMonsterToFloor(monster: Monster, floor: number): Monster {
    // 計算縮放因子 (每 10 層 +10%)
    const scaleFactor = 1 + Math.floor(floor / 10) * 0.10;

    // 對於區域起始樓層以上的怪物，額外縮放較少
    const rangeStart = monster.floorRange?.[0] || 1;
    const floorDiff = floor - rangeStart;
    const additionalScale = 1 + (floorDiff / 100) * 0.5; // 每超過起始 100 層，再增加 50%

    const finalScale = scaleFactor * additionalScale;

    return {
        ...monster,
        hp: Math.floor(monster.hp * finalScale),
        maxHp: Math.floor(monster.hp * finalScale),
        atk: Math.floor(monster.atk * finalScale),
        def: Math.floor(monster.def * finalScale),
        gold: Math.floor(monster.gold * finalScale),
        exp: Math.floor(monster.exp * finalScale),
        statusEffects: [],
        buffs: []
    };
}

/**
 * 獲取區域名稱
 */
export function getRegionName(floor: number): string {
    if (floor <= 100) return '地城迷宮';
    if (floor <= 200) return '陰森森林';
    if (floor <= 300) return '礦山山脈';
    if (floor <= 400) return '舊文明遺跡';
    return '黑暗荒漠';
}

/**
 * 獲取區域 Emoji
 */
export function getRegionEmoji(floor: number): string {
    if (floor <= 100) return '🏰';
    if (floor <= 200) return '🌲';
    if (floor <= 300) return '⛰️';
    if (floor <= 400) return '🏛️';
    return '🏜️';
}
