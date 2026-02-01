
import { Monster } from '../types';
import { MONSTERS, BOSS_MONSTERS, ELITE_MONSTERS } from '../data/monsters';

/**
 * 判斷是否為菁英樓層 (個位數為 9，但不包含 99, 199, 299... 休息營地，且排除新手區 1-29)
 */
function isEliteFloor(floor: number): boolean {
    // 1-29 為新手區，不出現菁英
    if (floor < 30) return false;
    const unitDigit = floor % 10;
    const isCampFloor = floor % 100 === 99; // 99, 199, 299... 是營地
    return unitDigit === 9 && !isCampFloor;
}

/**
 * 根據樓層生成怪物
 * - BOSS 層: 固定生成 BOSS
 * - x9 樓層 (非營地): 固定生成區域菁英
 * - 其他樓層: 一般怪物，有機率出現亞種
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

    // 檢查是否為菁英層 (x9 樓層，非營地)
    if (isEliteFloor(floor)) {
        // 獲取此樓層可出現的菁英怪物
        const availableElites = ELITE_MONSTERS.filter(m => {
            if (!m.floorRange) return false;
            return floor >= m.floorRange[0] && floor <= m.floorRange[1];
        });

        if (availableElites.length > 0) {
            // 隨機選擇一隻菁英
            const selectedElite = availableElites[Math.floor(Math.random() * availableElites.length)];
            return scaleMonsterToFloor(selectedElite, floor);
        }
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
 * - 1~100樓: 線性成長 (每10層 +8%)
 * - 100+樓: 對數遞減成長，緩和後期壓力
 * - 目標: 500樓約為 4 倍
 */
function scaleMonsterToFloor(monster: Monster, floor: number): Monster {
    let scaleFactor: number;

    if (floor <= 100) {
        // 早期：每10層 +8% (100樓 = 1.8x)
        scaleFactor = 1 + Math.floor(floor / 10) * 0.08;
    } else {
        // 中後期：基礎1.8x + 對數成長
        // 使用 log 函數讓成長逐漸減緩
        // floor 100 → 1.8x, floor 500 → ~4x
        const baseScale = 1.8;
        const overFloor = floor - 100; // 超過100樓的部分
        // log(1 + overFloor/100) 在 overFloor=400 時約為 1.6
        // 1.8 + 1.6 * 1.4 ≈ 4.04
        scaleFactor = baseScale + Math.log(1 + overFloor / 100) * 1.4;
    }

    return {
        ...monster,
        hp: Math.floor(monster.hp * scaleFactor),
        maxHp: Math.floor(monster.hp * scaleFactor),
        atk: Math.floor(monster.atk * scaleFactor),
        def: Math.floor(monster.def * scaleFactor),
        gold: Math.floor(monster.gold * scaleFactor),
        exp: Math.floor(monster.exp * scaleFactor),
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
