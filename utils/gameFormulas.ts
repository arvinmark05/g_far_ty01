
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
// 支援相同Affix疊加時顯示 "兩倍"、"三倍" 等前綴
export const getItemDisplayName = (item: Item): string => {
    if (!item) return '';
    let name = item.name;

    // 詞綴前綴 (支援疊加倍數顯示)
    if (item.affixes && item.affixes.length > 0) {
        // 計算每種Affix的出現次數
        const affixCounts = new Map<string, number>();
        item.affixes.forEach(id => {
            affixCounts.set(id, (affixCounts.get(id) || 0) + 1);
        });

        // 倍數詞彙對照表 (index = count)
        const multiplierWords = ['', '', '兩倍', '三倍', '四倍', '五倍', '六倍', '七倍', '八倍', '九倍', '十倍'];

        // 生成帶倍數的前綴 (保持詞綴出現的順序)
        const processedAffixes = new Set<string>();
        const prefixes: string[] = [];

        item.affixes.forEach(id => {
            if (processedAffixes.has(id)) return;
            processedAffixes.add(id);

            const affix = AFFIXES[id];
            if (affix) {
                const count = affixCounts.get(id) || 1;
                const mult = count > 1 && count < multiplierWords.length ? multiplierWords[count] : '';
                prefixes.push(mult + affix.name);
            }
        });

        if (prefixes.length > 0) {
            name = prefixes.join(' ') + ' ' + name;
        }
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
// 屬性額外加成公式 (Stat Bonus System)
// ============================================

// STR -> ATK 額外加成 (作用於 baseAtk)
// 0-20: +1 atk per point, 20-40: +0.5 atk per point, 40+: +0
const getStrAtkBonus = (str: number): number => {
    if (str <= 0) return 0;
    let bonus = 0;
    const tier1 = Math.min(str, 20);
    bonus += tier1 * 1;
    const tier2 = Math.min(Math.max(str - 20, 0), 20);
    bonus += tier2 * 0.5;
    return Math.floor(bonus);
};

// INT -> MATK 額外加成 (作用於 baseMAtk)
// 0-20: +2, 20-40: +1, 40-60: +0.5, 60+: +0.2
const getIntMatkBonus = (int: number): number => {
    if (int <= 0) return 0;
    let bonus = 0;
    const tier1 = Math.min(int, 20);
    bonus += tier1 * 2;
    const tier2 = Math.min(Math.max(int - 20, 0), 20);
    bonus += tier2 * 1;
    const tier3 = Math.min(Math.max(int - 40, 0), 20);
    bonus += tier3 * 0.5;
    const tier4 = Math.max(int - 60, 0);
    bonus += tier4 * 0.2;
    return Math.floor(bonus);
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
    let bonusDodge = 0;
    let bonusCritChance = 0;
    let bonusCritDamage = 0;

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

        // 處理防具 armorEffect 內建屬性加成
        if (item.armorEffect) {
            const ae = item.armorEffect;
            if (ae.bonusStr) bonusStr += ae.bonusStr;
            if (ae.bonusAgi) bonusAgi += ae.bonusAgi;
            if (ae.bonusVit) bonusVit += ae.bonusVit;
            if (ae.bonusInt) bonusInt += ae.bonusInt;
            if (ae.bonusDodge) bonusDodge += ae.bonusDodge;
            if (ae.bonusCritChance) bonusCritChance += ae.bonusCritChance;
            if (ae.bonusCritDamage) bonusCritDamage += ae.bonusCritDamage;
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

    // 5. 基礎數值 (Base Stats) - 包含屬性額外加成
    const baseAtk = 10 + weaponAtk + getStrAtkBonus(finalStr);
    const baseMAtk = 10 + getIntMatkBonus(finalInt);
    const baseDef = 5 + armorDef + finalVit; // VIT: +1 def per point
    const baseSpeed = 20;
    const baseHp = player.baseMaxHp;
    const baseCrit = 0.05; // 5% base crit chance

    // 6. 計算 speed_haste 加成 (快速符文效果)
    let speedHasteBonus = 0;
    equippedItems.forEach((item: Item) => {
        if (item.affixes) {
            item.affixes.forEach(affixId => {
                const affix = AFFIXES[affixId];
                if (affix && affix.type === 'passive' && affix.passiveEffect === 'speed_haste' && affix.value) {
                    speedHasteBonus += affix.value;
                }
            });
        }
        // 防具內建詞綴
        if (item.armorEffect?.builtInAffixes) {
            item.armorEffect.builtInAffixes.forEach((affixId: string) => {
                const affix = AFFIXES[affixId];
                if (affix && affix.type === 'passive' && affix.passiveEffect === 'speed_haste' && affix.value) {
                    speedHasteBonus += affix.value;
                }
            });
        }
    });

    // 7. 最終計算 (Multiplicative Formula)

    return {
        atk: Math.floor(baseAtk * (1 + strCorr)),
        matk: Math.floor(baseMAtk * (1 + intCorr)),
        def: Math.floor(baseDef * (1 + vitCorr * 0.5 + strCorr * 0.2)),
        speed: Math.floor(baseSpeed * (1 + finalAgi * 0.05) * (1 + speedHasteBonus)),
        maxHp: Math.floor(baseHp * (1 + vitCorr * 1.5)),
        maxShield: Math.floor((intCorr * 150) + finalInt),
        critChance: Math.min(1, Math.max(0, baseCrit * (1 + (finalAgi * 0.1) + (finalInt * 0.025)) + bonusCritChance)),
        critDamage: 1.5 + bonusCritDamage, // 暴擊傷害倍率
        dodgeChance: Math.min(0.95, Math.max(0.05, (agiCorr * 0.4) + (intCorr * 0.1) + bonusDodge))
    };
};

// ============================================
// 怪物掉落系統 (Monster Drop System)
// 設計理念:
// - 區域強度決定基礎掉落等級
// - 亞種怪物掉落特殊/稀有裝備
// - BOSS 保證掉落區域頂級裝備
// - 符文掉落率隨區域遞增
// ============================================

// 隨機生成插槽數 (0 ~ max)
const createItemWithSlots = (baseItem: Item): Item => {
    const newItem = { ...baseItem };
    if (newItem.maxSlots && newItem.maxSlots > 0) {
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
    newItem.refineLevel = 0;
    newItem.affixes = [];
    return newItem;
};

// 完整掉落表定義
// 格式: { item: EQUIPMENT.xxx[index], rate: 掉落率 }
// 規則: 一般怪物 <10%, 亞種/BOSS <25%
// 武器索引: 0老舊的劍,1直劍,2雙手重劍,3聖堂騎士劍,4木製長杖,5寒霜法杖,6巫毒長杖,7雷霆長杖,8短劍,9刺客匕首,10銳利匕首,11沙漠暮光,12破甲錐,13長弓,14獵人短弓,15精靈弓,16冰風使者,17木棒,18鐵瓜錘,19戰鎚,20審判之槌,21輕巧短刃
// 防具索引: 0布衣,1皮甲,2鎖甲,3板甲,4龍鱗甲,5盜賊披風,6刺客套裝,7獵人皮衣,8仙人掌服裝,9牧師聖袍,10騎士鎧甲,11女武神戰甲,12嗜血斗篷,13冰霜之心,14不朽戰衣,15獵鷹外套

const MONSTER_DROP_TABLE: Record<string, Array<{ item: any, rate: number }>> = {
    // ═══════════════════════════════════════════
    // 區域 1: 地城迷宮 (Floor 1-100) - 入門裝備
    // ═══════════════════════════════════════════
    '史萊姆': [
        { item: EQUIPMENT.weapons[0], rate: 0.08 },   // 老舊的劍
        { item: EQUIPMENT.weapons[4], rate: 0.06 },   // 木製長杖
        { item: EQUIPMENT.armor[0], rate: 0.08 },     // 布衣
    ],
    '洞穴蝙蝠': [
        { item: EQUIPMENT.weapons[8], rate: 0.08 },   // 短劍
        { item: EQUIPMENT.weapons[13], rate: 0.06 }, // 長弓
        { item: EQUIPMENT.armor[0], rate: 0.06 },     // 布衣
    ],
    '鐵皮哥布林': [
        { item: EQUIPMENT.weapons[17], rate: 0.08 }, // 木棒
        { item: EQUIPMENT.armor[1], rate: 0.08 },    // 皮甲
        { item: EQUIPMENT.armor[0], rate: 0.05 },    // 布衣
    ],
    // 亞種 - 高掉率 + 符文
    '劇毒史萊姆': [
        { item: EQUIPMENT.weapons[8], rate: 0.15 },  // 短劍
        { item: EQUIPMENT.armor[1], rate: 0.12 },    // 皮甲
        { item: MATERIALS[3], rate: 0.20 },          // 堅韌符文
        { item: MATERIALS[11], rate: 0.15 },         // 猛毒符文
    ],
    // BOSS
    '巨魔領主': [
        { item: EQUIPMENT.weapons[1], rate: 0.25 },  // 直劍
        { item: EQUIPMENT.weapons[4], rate: 0.20 },  // 木製長杖
        { item: EQUIPMENT.armor[1], rate: 0.25 },    // 皮甲
        { item: MATERIALS[1], rate: 0.20 },          // 力量符文
    ],

    // ═══════════════════════════════════════════
    // 區域 2: 陰森森林 (Floor 101-200) - 進階裝備
    // ═══════════════════════════════════════════
    '骷髏兵': [
        { item: EQUIPMENT.weapons[1], rate: 0.06 },  // 直劍
        { item: EQUIPMENT.weapons[13], rate: 0.06 }, // 長弓
        { item: EQUIPMENT.armor[1], rate: 0.05 },    // 皮甲
        { item: EQUIPMENT.armor[2], rate: 0.04 },    // 鎖甲
    ],
    '狂暴野狼': [
        { item: EQUIPMENT.weapons[9], rate: 0.06 },  // 刺客匕首
        { item: EQUIPMENT.weapons[14], rate: 0.05 }, // 獵人短弓
        { item: EQUIPMENT.armor[5], rate: 0.05 },    // 盜賊披風
    ],
    '殭屍蘑菇': [
        { item: EQUIPMENT.weapons[5], rate: 0.06 },  // 寒霜法杖
        { item: EQUIPMENT.weapons[18], rate: 0.05 }, // 鐵瓜錘
        { item: EQUIPMENT.armor[2], rate: 0.06 },    // 鎖甲
    ],
    // 亞種
    '寒霜座狼': [
        { item: EQUIPMENT.weapons[9], rate: 0.15 },  // 刺客匕首
        { item: EQUIPMENT.weapons[5], rate: 0.12 },  // 寒霜法杖
        { item: EQUIPMENT.armor[5], rate: 0.15 },    // 盜賊披風
        { item: MATERIALS[2], rate: 0.18 },          // 迅捷符文
        { item: MATERIALS[13], rate: 0.12 },         // 急凍符文
    ],
    // BOSS
    '死靈法師': [
        { item: EQUIPMENT.weapons[2], rate: 0.22 },  // 雙手重劍
        { item: EQUIPMENT.weapons[6], rate: 0.18 },  // 巫毒長杖
        { item: EQUIPMENT.armor[2], rate: 0.22 },    // 鎖甲
        { item: EQUIPMENT.armor[7], rate: 0.15 },    // 獵人皮衣
        { item: MATERIALS[5], rate: 0.20 },          // 吸血符文
    ],

    // ═══════════════════════════════════════════
    // 區域 3: 礦山山脈 (Floor 201-300) - 高級裝備
    // ═══════════════════════════════════════════
    '獸人戰士': [
        { item: EQUIPMENT.weapons[2], rate: 0.05 },  // 雙手重劍
        { item: EQUIPMENT.weapons[14], rate: 0.05 }, // 獵人短弓
        { item: EQUIPMENT.armor[3], rate: 0.05 },    // 板甲
        { item: EQUIPMENT.armor[10], rate: 0.04 },   // 騎士鎧甲
    ],
    '熔岩精靈': [
        { item: EQUIPMENT.weapons[10], rate: 0.05 }, // 銳利匕首
        { item: EQUIPMENT.weapons[15], rate: 0.04 }, // 精靈弓
        { item: EQUIPMENT.armor[7], rate: 0.05 },    // 獵人皮衣
    ],
    '岩石巨像': [
        { item: EQUIPMENT.weapons[18], rate: 0.05 }, // 鐵瓜錘
        { item: EQUIPMENT.armor[3], rate: 0.06 },    // 板甲
        { item: EQUIPMENT.armor[10], rate: 0.05 },   // 騎士鎧甲
        { item: MATERIALS[1], rate: 0.08 },          // 力量符文
    ],
    // 亞種
    '熔岩巨像': [
        { item: EQUIPMENT.weapons[19], rate: 0.12 }, // 戰鎚
        { item: EQUIPMENT.armor[10], rate: 0.15 },   // 騎士鎧甲
        { item: EQUIPMENT.armor[8], rate: 0.10 },    // 仙人掌服裝
        { item: MATERIALS[6], rate: 0.18 },          // 放血符文
        { item: MATERIALS[12], rate: 0.15 },         // 灼熱符文
    ],
    // BOSS
    '遠古巨龍': [
        { item: EQUIPMENT.weapons[3], rate: 0.22 },  // 聖堂騎士劍
        { item: EQUIPMENT.weapons[7], rate: 0.18 },  // 雷霆長杖
        { item: EQUIPMENT.armor[4], rate: 0.22 },    // 龍鱗甲
        { item: EQUIPMENT.armor[11], rate: 0.15 },   // 女武神戰甲
        { item: MATERIALS[7], rate: 0.20 },          // 致命符文
    ],

    // ═══════════════════════════════════════════
    // 區域 4: 舊文明遺跡 (Floor 301-400) - 頂級裝備
    // ═══════════════════════════════════════════
    '遺跡守衛': [
        { item: EQUIPMENT.weapons[3], rate: 0.04 },  // 聖堂騎士劍
        { item: EQUIPMENT.weapons[15], rate: 0.04 }, // 精靈弓
        { item: EQUIPMENT.armor[4], rate: 0.03 },    // 龍鱗甲
        { item: EQUIPMENT.armor[9], rate: 0.05 },    // 牧師聖袍
    ],
    '詛咒魔導書': [
        { item: EQUIPMENT.weapons[7], rate: 0.05 },  // 雷霆長杖
        { item: EQUIPMENT.weapons[6], rate: 0.04 },  // 巫毒長杖
        { item: EQUIPMENT.armor[8], rate: 0.04 },    // 仙人掌服裝
        { item: MATERIALS[4], rate: 0.08 },          // 智慧符文
    ],
    '寶箱怪': [
        { item: EQUIPMENT.weapons[19], rate: 0.05 }, // 戰鎚
        { item: EQUIPMENT.armor[11], rate: 0.04 },   // 女武神戰甲
        { item: EQUIPMENT.armor[15], rate: 0.03 },   // 獵鷹外套
        { item: MATERIALS[0], rate: 0.15 },          // 強化石 (寶箱怪高機率)
    ],
    // 亞種
    '超載守衛': [
        { item: EQUIPMENT.weapons[20], rate: 0.10 }, // 審判之槌
        { item: EQUIPMENT.armor[9], rate: 0.12 },    // 牧師聖袍
        { item: EQUIPMENT.armor[15], rate: 0.10 },   // 獵鷹外套
        { item: MATERIALS[8], rate: 0.18 },          // 殘暴符文
        { item: MATERIALS[15], rate: 0.15 },         // 快速符文
    ],
    // BOSS
    '吸血伯爵': [
        { item: EQUIPMENT.weapons[11], rate: 0.18 }, // 沙漠暮光
        { item: EQUIPMENT.weapons[16], rate: 0.15 }, // 冰風使者
        { item: EQUIPMENT.armor[6], rate: 0.20 },    // 刺客套裝
        { item: EQUIPMENT.armor[12], rate: 0.22 },   // 嗜血斗篷
        { item: MATERIALS[5], rate: 0.22 },          // 吸血符文
    ],

    // ═══════════════════════════════════════════
    // 區域 5: 黑暗荒漠 (Floor 401-500) - 傳說裝備
    // ═══════════════════════════════════════════
    '夢魘': [
        { item: EQUIPMENT.weapons[11], rate: 0.03 }, // 沙漠暮光
        { item: EQUIPMENT.weapons[20], rate: 0.03 }, // 審判之槌
        { item: EQUIPMENT.armor[6], rate: 0.03 },    // 刺客套裝
        { item: EQUIPMENT.armor[13], rate: 0.02 },   // 冰霜之心
    ],
    '暗影魔': [
        { item: EQUIPMENT.weapons[12], rate: 0.03 }, // 破甲錐
        { item: EQUIPMENT.weapons[21], rate: 0.02 }, // 輕巧短刃
        { item: EQUIPMENT.armor[12], rate: 0.03 },   // 嗜血斗篷
    ],
    '巨型蚯蚓': [
        { item: EQUIPMENT.weapons[16], rate: 0.03 }, // 冰風使者
        { item: EQUIPMENT.armor[11], rate: 0.04 },   // 女武神戰甲
        { item: EQUIPMENT.armor[14], rate: 0.02 },   // 不朽戰衣
        { item: MATERIALS[9], rate: 0.08 },          // 尖刺符文
    ],
    // 亞種
    '虛空夢魘': [
        { item: EQUIPMENT.weapons[12], rate: 0.12 }, // 破甲錐
        { item: EQUIPMENT.weapons[16], rate: 0.12 }, // 冰風使者
        { item: EQUIPMENT.weapons[21], rate: 0.08 }, // 輕巧短刃
        { item: EQUIPMENT.armor[13], rate: 0.15 },   // 冰霜之心
        { item: EQUIPMENT.armor[14], rate: 0.10 },   // 不朽戰衣
        { item: MATERIALS[7], rate: 0.20 },          // 致命符文
        { item: MATERIALS[8], rate: 0.20 },          // 殘暴符文
    ],
    // 最終 BOSS
    '暗影魔王': [
        { item: EQUIPMENT.weapons[12], rate: 0.22 }, // 破甲錐
        { item: EQUIPMENT.weapons[16], rate: 0.22 }, // 冰風使者
        { item: EQUIPMENT.weapons[20], rate: 0.20 }, // 審判之槌
        { item: EQUIPMENT.weapons[21], rate: 0.15 }, // 輕巧短刃
        { item: EQUIPMENT.armor[13], rate: 0.20 },   // 冰霜之心
        { item: EQUIPMENT.armor[14], rate: 0.18 },   // 不朽戰衣
        { item: MATERIALS[10], rate: 0.22 },         // 靈巧符文
    ],
};

// 根據怪物名稱查找對應區域 (用於計算通用掉落率調整)
const getMonsterRegion = (monsterName: string): number => {
    const region1 = ['史萊姆', '洞穴蝙蝠', '鐵皮哥布林', '劇毒史萊姆', '巨魔領主', '骨刃戰士', '暴食史萊姆王', '陰影刺客'];
    const region2 = ['骷髏兵', '狂暴野狼', '殭屍蘑菇', '寒霜座狼', '死靈法師', '腐化樹人', '狼人獵手', '亡靈騎兵'];
    const region3 = ['獸人戰士', '熔岩精靈', '岩石巨像', '熔岩巨像', '遠古巨龍', '炸藥哥布林', '礦工亡魂', '結晶巨人'];
    const region4 = ['遺跡守衛', '詛咒魔導書', '寶箱怪', '超載守衛', '吸血伯爵', '失控傀儡', '時空裂隙', '護殿石像'];
    const region5 = ['夢魘', '暗影魔', '巨型蚯蚓', '虛空夢魘', '暗影魔王', '沙漠狩獵者', '沙暴元素', '死亡騎士'];

    if (region1.includes(monsterName)) return 1;
    if (region2.includes(monsterName)) return 2;
    if (region3.includes(monsterName)) return 3;
    if (region4.includes(monsterName)) return 4;
    if (region5.includes(monsterName)) return 5;
    return 1;
};

export const getMonsterDrops = (monsterName: string): Array<{ item: Item, rate: number }> => {
    const specificDrops = MONSTER_DROP_TABLE[monsterName] || [];

    const drops = specificDrops.map(drop => ({
        item: createItemWithSlots(drop.item),
        rate: drop.rate
    }));

    // 通用素材掉落 (根據區域調整機率)
    const region = getMonsterRegion(monsterName);

    // 檢查是否為菁英怪物 (名稱匹配)
    const eliteNames = [
        '骨刃戰士', '暴食史萊姆王', '陰影刺客',
        '腐化樹人', '狼人獵手', '亡靈騎兵',
        '炸藥哥布林', '礦工亡魂', '結晶巨人',
        '失控傀儡', '時空裂隙', '護殿石像',
        '沙漠狩獵者', '沙暴元素', '死亡騎士'
    ];
    const isElite = eliteNames.includes(monsterName);

    // 強化石基礎 5%，每區域 +2%，菁英怪物 x2
    const refineStoneRate = (0.05 + (region - 1) * 0.02) * (isElite ? 2 : 1);
    drops.push({ item: { ...MATERIALS[0] }, rate: refineStoneRate });

    // 隨機符文石基礎 2%，每區域 +1.5%，菁英怪物 x3 且偏好高級符文
    const runeBaseRate = 0.02 + (region - 1) * 0.015;
    const runeRate = runeBaseRate * (isElite ? 3 : 1);

    // 菁英怪物偏好高級符文 (index 5+: 吸血/放血/致命/殘暴/尖刺/靈巧...)
    let randomRune;
    if (isElite && Math.random() < 0.6) {
        // 60% 機率高級符文
        const highTierRunes = MATERIALS.slice(5); // 從吸血符文開始的高級符文
        randomRune = highTierRunes[Math.floor(Math.random() * highTierRunes.length)];
    } else {
        // 普通符文池
        randomRune = MATERIALS[Math.floor(Math.random() * (MATERIALS.length - 1)) + 1];
    }
    drops.push({ item: { ...randomRune }, rate: runeRate });

    return drops;
};

// ============================================
// BOSS 首殺獎勵系統 (First Kill Rewards)
// 第一次擊敗 BOSS 時保證掉落頂級裝備
// ============================================

// BOSS 首殺專屬獎勵表 (100% 掉落)
const BOSS_FIRST_KILL_REWARDS: Record<number, Array<{ item: any }>> = {
    // 100F - 巨魔領主：直劍 + 皮甲 + 強化石x3
    100: [
        { item: EQUIPMENT.weapons[1] },  // 直劍
        { item: EQUIPMENT.armor[1] },    // 皮甲
        { item: { ...MATERIALS[0], quantity: 3 } }, // 強化石 x3
    ],
    // 200F - 死靈法師：雙手重劍 + 鎖甲 + 吸血符文 + 強化石x3
    200: [
        { item: EQUIPMENT.weapons[2] },  // 雙手重劍
        { item: EQUIPMENT.armor[2] },    // 鎖甲
        { item: MATERIALS[5] },          // 吸血符文
        { item: { ...MATERIALS[0], quantity: 3 } }, // 強化石 x3
    ],
    // 300F - 遠古巨龍：聖堂騎士劍 + 龍鱗甲 + 致命符文 + 強化石x5
    300: [
        { item: EQUIPMENT.weapons[3] },  // 聖堂騎士劍
        { item: EQUIPMENT.armor[4] },    // 龍鱗甲
        { item: MATERIALS[7] },          // 致命符文
        { item: { ...MATERIALS[0], quantity: 5 } }, // 強化石 x5
    ],
    // 400F - 吸血伯爵：沙漠暮光 + 嗜血斗篷 + 殘暴符文 + 吸血符文 + 強化石x5
    400: [
        { item: EQUIPMENT.weapons[11] }, // 沙漠暮光
        { item: EQUIPMENT.armor[12] },   // 嗜血斗篷
        { item: MATERIALS[8] },          // 殘暴符文
        { item: MATERIALS[5] },          // 吸血符文
        { item: { ...MATERIALS[0], quantity: 5 } }, // 強化石 x5
    ],
    // 500F - 暗影魔王：破甲錐 + 冰風使者 + 審判之槌 + 不朽戰衣 + 稀有符文 + 強化石x10
    500: [
        { item: EQUIPMENT.weapons[12] }, // 破甲錐
        { item: EQUIPMENT.weapons[16] }, // 冰風使者
        { item: EQUIPMENT.weapons[20] }, // 審判之槌
        { item: EQUIPMENT.armor[14] },   // 不朽戰衣
        { item: MATERIALS[7] },          // 致命符文
        { item: MATERIALS[8] },          // 殘暴符文
        { item: MATERIALS[10] },         // 靈巧符文
        { item: { ...MATERIALS[0], quantity: 10 } }, // 強化石 x10
    ],
};

// BOSS 樓層對應表
const BOSS_FLOORS = [100, 200, 300, 400, 500];

/**
 * 檢查是否為 BOSS 樓層
 */
export const isBossFloor = (floor: number): boolean => {
    return BOSS_FLOORS.includes(floor);
};

/**
 * 取得 BOSS 首殺獎勵
 * @param bossFloor BOSS 所在樓層 (100/200/300/400/500)
 * @returns 保證掉落的物品陣列 (已處理插槽)
 */
export const getBossFirstKillRewards = (bossFloor: number): Item[] => {
    const rewards = BOSS_FIRST_KILL_REWARDS[bossFloor];
    if (!rewards) return [];

    return rewards.map(reward => {
        // 素材直接返回
        if (reward.item.isMaterial) {
            return { ...reward.item };
        }
        // 裝備處理插槽
        return createItemWithSlots(reward.item);
    });
};

/**
 * 取得對應樓層的首殺 Flag Key
 */
export const getBossFirstKillFlagKey = (bossFloor: number): string | null => {
    switch (bossFloor) {
        case 100: return 'boss_100_first_kill';
        case 200: return 'boss_200_first_kill';
        case 300: return 'boss_300_first_kill';
        case 400: return 'boss_400_first_kill';
        case 500: return 'boss_500_first_kill';
        default: return null;
    }
};