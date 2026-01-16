
import { Item } from '../types';
import { WEAPON_PASSIVES } from './skills';

export const EQUIPMENT: { weapons: Item[], armor: Item[] } = {
  weapons: [
    // Sword
    { name: '木劍', atk: 5, price: 50, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.bash, maxSlots: 4 },
    { name: '鐵劍', atk: 12, price: 3000, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.frenzy, maxSlots: 3 },
    { name: '鋼劍', atk: 20, price: 8000, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.pierce, maxSlots: 2 },
    { name: '聖劍', atk: 35, price: 50000, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.holy_slash, maxSlots: 0 },
    // Staff
    { name: '木製長杖', atk: 2, price: 80, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.fireball, maxSlots: 4 },
    { name: '法師短杖', atk: 5, price: 200, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.frost_bolt, maxSlots: 3 },
    { name: '賢者之杖', atk: 8, price: 50000, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.thunder, maxSlots: 2 },
    // Dagger
    { name: '短劍', atk: 10, price: 130, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.venomous, maxSlots: 3 },
    { name: '刺客匕首', atk: 18, price: 380, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.assassin_edge, maxSlots: 2 },
    { name: '銳利匕首', atk: 18, price: 500, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.bleed_stab, maxSlots: 4 },
    { name: '沙漠暮光', atk: 36, price: 66666, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.shadow_shift, maxSlots: 0 },
    { name: '破甲錐', atk: 10, price: 100000, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.armor_auger, maxSlots: 1 },
    // Bow
    { name: '長弓', atk: 14, price: 250, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.precise_shot, maxSlots: 4 },
    { name: '獵人短弓', atk: 28, price: 4000, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.arrow_shot, maxSlots: 3 },
    { name: '精靈弓', atk: 24, price: 8000, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.magic_arrow, maxSlots: 2 },
    { name: '冰風使者', atk: 32, price: 50000, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.ice_shot, maxSlots: 0 },
    // Mace
    { name: '木棒', atk: 10, price: 100, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.skull_crack, maxSlots: 4 },
    { name: '鐵瓜錘', atk: 30, price: 3000, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.holy_light, maxSlots: 3 },
    { name: '戰鎚', atk: 50, price: 40000, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.war_hammer, maxSlots: 1 },
    { name: '審判之槌', atk: 28, price: 88888, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.divine_judgment, maxSlots: 0 }
  ],
  armor: [
    { name: '布衣', def: 3, price: 40, type: 'armor', maxSlots: 4 },
    { name: '皮甲', def: 8, price: 120, type: 'armor', maxSlots: 3 },
    { name: '鎖甲', def: 15, price: 350, type: 'armor', maxSlots: 2 },
    { name: '板甲', def: 25, price: 900, type: 'armor', maxSlots: 1 },
    { name: '龍鱗甲', def: 40, price: 2500, type: 'armor', maxSlots: 0 },
    // 特殊防具
    { name: '盜賊披風', def: 10, price: 6000, type: 'armor', maxSlots: 4, armorEffect: { bonusAgi: 10, bonusDodge: 0.15 } },
    { name: '刺客套裝', def: 44, price: 44444, type: 'armor', maxSlots: 2, armorEffect: { bonusCritChance: 0.15, bonusCritDamage: 0.5 } },
    { name: '獵人皮衣', def: 30, price: 8000, type: 'armor', maxSlots: 3, armorEffect: { bonusAgi: 15, bonusInt: 10 } },
    { name: '仙人掌服裝', def: 20, price: 10000, type: 'armor', maxSlots: 2, armorEffect: { onHitBuff: 'haste', onHitBuffDuration: 1 } },
    { name: '牧師聖袍', def: 20, price: 10000, type: 'armor', maxSlots: 3, armorEffect: { onHitShieldRefill: 0.2 } },
    { name: '騎士鎧甲', def: 50, price: 10000, type: 'armor', maxSlots: 3, armorEffect: { bonusStr: 10, bonusVit: 15 } },
    { name: '女武神戰甲', def: 65, price: 50000, type: 'armor', maxSlots: 1, armorEffect: { onHitHealPercent: 0.05 } },
    { name: '嗜血斗篷', def: 20, price: 66666, type: 'armor', maxSlots: 1, armorEffect: { builtInAffixes: ['life_steal', 'bleed_hit'] } },
    { name: '冰霜之心', def: 100, price: 133332, type: 'armor', maxSlots: 0, armorEffect: { onHitFreezeChance: 0.25 } },
    { name: '不朽戰衣', def: 1, price: 100000, type: 'armor', maxSlots: 1, armorEffect: { deathSave: true } }
  ]
};

export const MATERIALS: Item[] = [
  { name: '強化石', type: 'material', price: 200, isMaterial: true, materialType: 'refine_stone', desc: '用於強化裝備 (+1~+9)' },
  { name: '力量符文', type: 'material', price: 500, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'str_boost', desc: '賦予裝備 "力量的" 詞綴 (+10 STR)' },
  { name: '迅捷符文', type: 'material', price: 500, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'agi_boost', desc: '賦予裝備 "迅捷的" 詞綴 (+10 AGI)' },
  { name: '堅韌符文', type: 'material', price: 500, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'vit_boost', desc: '賦予裝備 "堅韌的" 詞綴 (+10 VIT)' },
  { name: '智慧符文', type: 'material', price: 500, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'int_boost', desc: '賦予裝備 "智慧的" 詞綴 (+10 INT)' },
  { name: '吸血符文', type: 'material', price: 1500, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'life_steal', desc: '賦予裝備 "吸血的" 詞綴 (普攻吸血 10%)' },
  { name: '放血符文', type: 'material', price: 1500, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'bleed_hit', desc: '賦予裝備 "放血的" 詞綴 (普攻附加流血)' },
  { name: '致命符文', type: 'material', price: 2000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'deadly', desc: '賦予裝備 "致命的" 詞綴 (+15% 暴擊率)' },
  { name: '殘暴符文', type: 'material', price: 2000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'savage', desc: '賦予裝備 "殘暴的" 詞綴 (+50% 暴擊傷害)' },
  { name: '尖刺符文', type: 'material', price: 1000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'spiked', desc: '賦予裝備 "尖刺的" 詞綴 (反彈 20% 傷害)' },
  { name: '靈巧符文', type: 'material', price: 1000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'elusive', desc: '賦予裝備 "靈巧的" 詞綴 (+10% 閃避率)' },
];