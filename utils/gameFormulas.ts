
import { PlayerStats, Item } from '../types';
import { EQUIPMENT, MATERIALS } from '../data/items';
import { AFFIXES } from '../data/affixes';

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

  const finalStr = player.str + bonusStr;
  const finalAgi = player.agi + bonusAgi;
  const finalVit = player.vit + bonusVit;
  const finalInt = player.int + bonusInt;

  // 2. 計算裝備基礎數值 (包含強化)
  const weaponAtk = getRefinedStat(player.weapon?.atk, player.weapon?.refineLevel);
  const armorDef = getRefinedStat(player.armor?.def, player.armor?.refineLevel);

  // 3. 綜合計算
  const baseAtk = finalStr * 2 + weaponAtk;
  const baseMAtk = finalInt * 3;
  const baseDef = finalVit * 1.5 + armorDef;
  const baseSpeed = 10 + finalAgi * 2;
  const baseMaxShield = finalVit * 5;
  const baseMaxHp = player.baseMaxHp + finalVit * 12; 
  
  return {
    atk: Math.floor(baseAtk),
    matk: Math.floor(baseMAtk),
    def: Math.floor(baseDef),
    speed: Math.floor(baseSpeed),
    maxShield: Math.floor(baseMaxShield),
    maxHp: Math.floor(baseMaxHp)
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