
import { PlayerStats, Item } from '../types';
import { EQUIPMENT, MATERIALS } from '../data/items';
import { AFFIXES } from '../data/affixes';

// ============================================
// 經驗值曲線公式 (Curvilinear Scaling)
// 設計目標: Lv.150 的需求量約為舊公式的 2 倍 (約 27,000)
// 高壓區延後至 Lv.100 以上
// ============================================
export const expToLevel = (level: number): number => {
    // 階段一: Lv. 1 - 100
    // 平滑的二次曲線
    // Lv.1 ≈ 51, Lv.60 ≈ 4,000, Lv.100 ≈ 9,040
    if (level <= 100) {
        const curve = 0.8 * Math.pow(level, 2) + 10 * level + 40;
        return Math.round(curve);
    }

    // 階段二: Lv. 101+
    // 高需求挑戰階段
    // Lv.150 ≈ 27,540
    const base = 9040; // Lv.100 的基礎值
    const diff = level - 100;
    // 繼承斜率 170 確保曲線銜接處平滑，4 * diff^2 提供後期的高壓
    const curve = base + (170 * diff) + (4 * Math.pow(diff, 2));
    return Math.round(curve);
};

// Helper: 產生裝備顯示名稱
// 格式: +N Prefix1 Prefix2 Name [Slots]
export const getItemDisplayName = (item: Item): string => {
    if (!item) return '';
    let name = item.name;

    // 詞綴前綴
    if (item.affixes && item.affixes.length > 0) {
        const affixNames = item.affixes.map(id => AFFIXES[id]?.name || '').join(' ');
        if (affixNames) name = `${affixNames} ${name}`;
    }

    // 強化等級前綴
    if (item.refineLevel && item.refineLevel > 0) {
        name = `+${item.refineLevel} ${name}`;
    }

    // 插槽後綴
    if (item.slots !== undefined && item.slots > 0) {
        name = `${name} [${item.slots}]`;
    }

    return name;
};

// 計算強化後的基礎數值
export const getRefinedStat = (baseVal: number | undefined, level: number | undefined): number => {
    if (!baseVal) return 0;
    if (!level) return baseVal;
    // 每一級 +10%
    return Math.floor(baseVal * (1 + level * 0.1));
};

// ============================================
// 屬性修正曲線 (Soft Cap System)
// 0-20: +2.5%/點, 21-40: +1.5%/點, 41-60: +0.5%/點, 60+: +0.1%/點
// ============================================
export const getStatCorrection = (points: number): number => {
    if (points <= 0) return 0;
    let correction = 0;

    // Tier 1: 0-20 points (+2.5% per point)
    const tier1 = Math.min(points, 20);
    correction += tier1 * 0.025;

    // Tier 2: 21-40 points (+1.5% per point)
    const tier2 = Math.min(Math.max(points - 20, 0), 20);
    correction += tier2 * 0.015;

    // Tier 3: 41-60 points (+0.5% per point) [Soft Cap]
    const tier3 = Math.min(Math.max(points - 40, 0), 20);
    correction += tier3 * 0.005;

    // Tier 4: 60+ points (+0.1% per point) [Hard Cap]
    const tier4 = Math.max(points - 60, 0);
    correction += tier4 * 0.001;

    return correction;
};

// ============================================
// 傷害減傷公式 (Mitigation Formula)
// Damage = ATK * (1 - DEF / (DEF + K))
// K = 100，確保永遠有穿透傷害
// ============================================
const MITIGATION_K = 100;

export const calculateDamage = (atk: number, def: number): number => {
    const mitigation = def / (def + MITIGATION_K);
    const damage = atk * (1 - mitigation);
    return Math.max(1, Math.floor(damage));
};

// ============================================
// 玩家屬性計算 (Multiplicative Model)
// ============================================
export const calculateStats = (player: any): PlayerStats => {
    // 1. 計算裝備上的詞綴屬性加成
    let bonusStr = 0;
    let bonusAgi = 0;
    let bonusVit = 0;
    let bonusInt = 0;

    const equippedItems = [player.weapon, player.armor].filter(Boolean);

    equippedItems.forEach((item: Item) => {
        if (item.affixes) {
            item.affixes.forEach(affixId => {
                const affix = AFFIXES[affixId];
                if (affix && affix.type === 'stat' && affix.value) {
                    if (affix.stat === 'str') bonusStr += affix.value;
                    if (affix.stat === 'agi') bonusAgi += affix.value;
                    if (affix.stat === 'vit') bonusVit += affix.value;
                    if (affix.stat === 'int') bonusInt += affix.value;
                }
            });
        }
    });

    // 2. 計算最終屬性點數
    const finalStr = player.str + bonusStr;
    const finalAgi = player.agi + bonusAgi;
    const finalVit = player.vit + bonusVit;
    const finalInt = player.int + bonusInt;

    // 3. 計算屬性修正值 (Correction Multipliers)
    const strCorr = getStatCorrection(finalStr);
    const agiCorr = getStatCorrection(finalAgi);
    const vitCorr = getStatCorrection(finalVit);
    const intCorr = getStatCorrection(finalInt);

    // 4. 計算裝備基礎數值 (包含強化)
    const weaponAtk = getRefinedStat(player.weapon?.atk, player.weapon?.refineLevel);
    const armorDef = getRefinedStat(player.armor?.def, player.armor?.refineLevel);

    // 5. 基礎數值 (Base Stats)
    const baseAtk = 10 + weaponAtk;
    const baseMAtk = 10;
    const baseDef = 5 + armorDef;
    const baseSpeed = 20;
    const baseHp = player.baseMaxHp;
    const baseCrit = 0.05; // 5% base crit chance

    // 6. 最終計算 (Multiplicative Formula)

    return {
        atk: Math.floor(baseAtk * (1 + strCorr)),
        matk: Math.floor(baseMAtk * (1 + intCorr)),
        def: Math.floor(baseDef * (1 + vitCorr * 0.5 + strCorr * 0.2)),
        speed: Math.floor(baseSpeed * (1 + finalAgi * 0.05)),
        maxHp: Math.floor(baseHp * (1 + vitCorr * 1.5)),
        maxShield: Math.floor(intCorr * 250),
        critChance: Math.min(1, Math.max(0, baseCrit * (1 + (finalAgi * 0.1) + (finalInt * 0.025)))),
        dodgeChance: Math.min(0.95, Math.max(0.05, (agiCorr * 0.4) + (intCorr * 0.1)))
    };
};

export const getMonsterDrops = (monsterName: string): Array<{ item: Item, rate: number }> => {
    // 隨機生成插槽數 (0 ~ max)
    const createItemWithSlots = (baseItem: Item): Item => {
        const newItem = { ...baseItem };
        if (newItem.maxSlots && newItem.maxSlots > 0) {
            // 權重: 0插槽機率最高，隨著插槽數增加機率遞減
            // 簡單算法: 隨機 0~100。 
            const roll = Math.random();
            let slots = 0;
            if (roll < 0.5) slots = 0;
            else if (roll < 0.8 && newItem.maxSlots >= 1) slots = 1;
            else if (roll < 0.95 && newItem.maxSlots >= 2) slots = 2;
            else if (newItem.maxSlots >= 3) slots = Math.floor(Math.random() * (newItem.maxSlots - 2)) + 3;

            newItem.slots = Math.min(slots, newItem.maxSlots);
        } else {
            newItem.slots = 0;
        }
        // 初始化其他屬性
        newItem.refineLevel = 0;
        newItem.affixes = [];
        return newItem;
    };

    const baseDrops: Record<string, Array<{ item: any, rate: number }>> = {
        '史萊姆': [{ item: EQUIPMENT.weapons[0], rate: 0.1 }],
        '哥布林': [{ item: EQUIPMENT.weapons[1], rate: 0.08 }, { item: EQUIPMENT.armor[0], rate: 0.1 }],
        '骷髏兵': [{ item: EQUIPMENT.weapons[2], rate: 0.06 }, { item: EQUIPMENT.armor[1], rate: 0.08 }],
        '獸人': [{ item: EQUIPMENT.armor[2], rate: 0.06 }, { item: EQUIPMENT.weapons[5], rate: 0.05 }],
        '暗影惡魔': [{ item: EQUIPMENT.weapons[3], rate: 0.05 }, { item: EQUIPMENT.weapons[6], rate: 0.04 }],
        '巨龍': [{ item: EQUIPMENT.armor[3], rate: 0.05 }, { item: EQUIPMENT.weapons[7], rate: 0.03 }]
    };

    const drops = (baseDrops[monsterName] || []).map(drop => ({
        item: createItemWithSlots(drop.item),
        rate: drop.rate
    }));

    // 追加素材掉落 (通用)
    // 強化石: 5%
    drops.push({ item: { ...MATERIALS[0] }, rate: 0.05 });

    // 隨機符文石: 2%
    const randomRune = MATERIALS[Math.floor(Math.random() * (MATERIALS.length - 1)) + 1];
    drops.push({ item: { ...randomRune }, rate: 0.02 });

    return drops;
};