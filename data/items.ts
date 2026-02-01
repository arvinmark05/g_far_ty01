
import { Item } from '../types';
import { WEAPON_PASSIVES } from './skills';

export const EQUIPMENT: { weapons: Item[], armor: Item[] } = {
  weapons: [
    // Sword
    { name: '老舊的劍', atk: 16, price: 1000, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.bash, maxSlots: 3 },
    { name: '直劍', atk: 24, price: 4000, type: 'weapon', category: 'sword', maxSlots: 4, desc: '老朋友，安心與信賴的選擇' },
    { name: '雙手重劍', atk: 26, price: 8000, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.pierce_slash, maxSlots: 2 },
    { name: '聖堂騎士劍', atk: 35, price: 50000, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.holy_slash, maxSlots: 0 },
    // Staff
    { name: '木製長杖', atk: 2, price: 800, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.fire_bolt, maxSlots: 4 },
    { name: '寒霜法杖', atk: 5, price: 4800, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.frost_bolt, maxSlots: 3 },
    { name: '巫毒長杖', atk: 6, price: 9000, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.poison_bolt, maxSlots: 3 },
    { name: '雷霆長杖', atk: 8, price: 50000, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.thunder, maxSlots: 2 },
    // Dagger
    { name: '短劍', atk: 14, price: 800, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.venomous, maxSlots: 3 },
    { name: '刺客匕首', atk: 22, price: 3800, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.assassin_edge, maxSlots: 2 },
    { name: '銳利匕首', atk: 24, price: 9000, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.bleed_stab, maxSlots: 4 },
    { name: '沙漠暮光', atk: 36, price: 66666, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.shadow_shift, maxSlots: 0 },
    { name: '破甲錐', atk: 20, price: 100000, type: 'weapon', category: 'dagger', skill: WEAPON_PASSIVES.armor_auger, maxSlots: 1 },
    // Bow
    { name: '長弓', atk: 15, price: 750, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.precise_shot, maxSlots: 4 },
    { name: '獵人短弓', atk: 28, price: 4000, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.arrow_shot, maxSlots: 3 },
    { name: '精靈弓', atk: 24, price: 8000, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.magic_arrow, maxSlots: 2 },
    { name: '冰風使者', atk: 32, price: 50000, type: 'weapon', category: 'bow', skill: WEAPON_PASSIVES.ice_shot, maxSlots: 0 },
    // Mace
    { name: '木棒', atk: 18, price: 100, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.skull_crack, maxSlots: 4 },
    { name: '鐵瓜錘', atk: 30, price: 3000, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.holy_light, maxSlots: 3 },
    { name: '戰鎚', atk: 40, price: 40000, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.war_hammer, maxSlots: 1 },
    { name: '審判之槌', atk: 28, price: 88888, type: 'weapon', category: 'mace', skill: WEAPON_PASSIVES.divine_judgment, maxSlots: 0 },
    // 特殊武器
    { name: '輕巧短刃', atk: 26, price: 66666, type: 'weapon', category: 'dagger', maxSlots: 3, affixes: ['double_attack', 'double_attack', 'double_attack'], desc: '45%機率普攻連擊' }
  ],
  armor: [
    { name: '布衣', def: 20, price: 400, type: 'armor', maxSlots: 4, armorEffect: { bonusAgi: 25 }, desc: 'AGI+25' },
    { name: '皮甲', def: 35, price: 1200, type: 'armor', maxSlots: 3, armorEffect: { bonusDodge: 0.20 }, desc: '閃避率+20%' },
    { name: '鎖甲', def: 50, price: 3500, type: 'armor', maxSlots: 3, armorEffect: { bonusVit: 25 }, desc: 'VIT+25' },
    { name: '板甲', def: 120, price: 9000, type: 'armor', maxSlots: 2 },
    { name: '龍鱗甲', def: 200, price: 25000, type: 'armor', maxSlots: 0 },
    // 特殊防具
    { name: '盜賊披風', def: 10, price: 6000, type: 'armor', maxSlots: 4, armorEffect: { bonusAgi: 10, bonusDodge: 0.15 }, desc: 'AGI+10, 閃避率+15%' },
    { name: '刺客套裝', def: 44, price: 44444, type: 'armor', maxSlots: 2, armorEffect: { bonusCritChance: 0.15, bonusCritDamage: 0.5 }, desc: '暴擊率+15%, 暴擊傷害+50%' },
    { name: '獵人皮衣', def: 30, price: 8000, type: 'armor', maxSlots: 3, armorEffect: { bonusAgi: 15, bonusInt: 10 }, desc: 'AGI+15, INT+10' },
    { name: '仙人掌服裝', def: 20, price: 10000, type: 'armor', maxSlots: 2, armorEffect: { onHitBuff: 'haste', onHitBuffDuration: 4 }, desc: '受傷時賦予自身「加速」4秒' },
    { name: '牧師聖袍', def: 20, price: 10000, type: 'armor', maxSlots: 3, armorEffect: { onHitShieldRefill: 0.2 }, desc: '受傷時回復20%最大護盾' },
    { name: '騎士鎧甲', def: 50, price: 10000, type: 'armor', maxSlots: 3, armorEffect: { bonusStr: 10, bonusVit: 15 }, desc: 'STR+10, VIT+15' },
    { name: '女武神戰甲', def: 65, price: 50000, type: 'armor', maxSlots: 1, armorEffect: { onHitHealPercent: 0.05 }, desc: '受傷時回復5%最大HP' },
    { name: '嗜血斗篷', def: 20, price: 66666, type: 'armor', maxSlots: 1, armorEffect: { builtInAffixes: ['life_steal', 'bleed_hit'] }, desc: '10%吸血+放血效果' },
    { name: '冰霜之心', def: 100, price: 133332, type: 'armor', maxSlots: 0, armorEffect: { onHitFreezeChance: 0.25 }, desc: '受傷時25%機率冰凍攻擊者' },
    { name: '不朽戰衣', def: 1, price: 100000, type: 'armor', maxSlots: 1, armorEffect: { deathSave: true }, desc: 'HP>50%時受到致命傷不會死亡' },
    // 特殊防具 - 內建符文效果
    { name: '獵鷹外套', def: 30, price: 20000, type: 'armor', maxSlots: 2, armorEffect: { builtInAffixes: ['falcon_blitz'] }, desc: '50%機率獵鷹追擊效果' }
  ]
};

export const MATERIALS: Item[] = [
  { name: '強化石', type: 'material', price: 1000, isMaterial: true, materialType: 'refine_stone', desc: '用於強化裝備 (+1~+9)' },
  { name: '力量符文', type: 'material', price: 5000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'str_boost', desc: '賦予裝備 "力量的" 詞綴 (+20 STR)' },
  { name: '迅捷符文', type: 'material', price: 5000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'agi_boost', desc: '賦予裝備 "迅捷的" 詞綴 (+20 AGI)' },
  { name: '堅韌符文', type: 'material', price: 5000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'vit_boost', desc: '賦予裝備 "堅韌的" 詞綴 (+20 VIT)' },
  { name: '智慧符文', type: 'material', price: 5000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'int_boost', desc: '賦予裝備 "智慧的" 詞綴 (+20 INT)' },
  { name: '吸血符文', type: 'material', price: 15000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'life_steal', desc: '賦予裝備 "吸血的" 詞綴 (普攻吸血 10%)' },
  { name: '放血符文', type: 'material', price: 15000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'bleed_hit', desc: '賦予裝備 "放血的" 詞綴 (普攻附加流血)' },
  { name: '致命符文', type: 'material', price: 20000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'deadly', desc: '賦予裝備 "致命的" 詞綴 (+15% 暴擊率)' },
  { name: '殘暴符文', type: 'material', price: 20000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'savage', desc: '賦予裝備 "殘暴的" 詞綴 (+50% 暴擊傷害)' },
  { name: '尖刺符文', type: 'material', price: 20000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'spiked', desc: '賦予裝備 "尖刺的" 詞綴 (反彈 30% 傷害)' },
  { name: '靈巧符文', type: 'material', price: 20000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'elusive', desc: '賦予裝備 "靈巧的" 詞綴 (+15% 閃避率)' },

  // ═══════════════════════════════════════════
  // 新增的 14 種符文 (Designed by Game Producer)
  // ═══════════════════════════════════════════
  { name: '猛毒符文', type: 'material', price: 18000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'poison_hit', desc: '賦予裝備 "猛毒的" 詞綴 (普攻附加中毒)' },
  { name: '灼熱符文', type: 'material', price: 18000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'burn_hit', desc: '賦予裝備 "灼熱的" 詞綴 (普攻附加燃燒)' },
  { name: '急凍符文', type: 'material', price: 22000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'freeze_hit', desc: '賦予裝備 "急凍的" 詞綴 (普攻 25% 附加冰凍)' },
  { name: '狂暴符文', type: 'material', price: 20000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'berserk_on_hit', desc: '賦予裝備 "狂暴的" 詞綴 (受傷時 25% 賦予自身狂暴)' },
  { name: '快速符文', type: 'material', price: 25000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'speed_haste', desc: '賦予裝備 "快速的" 詞綴 (speed +20%)' },
  { name: '穿甲符文', type: 'material', price: 22000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'def_pierce', desc: '賦予裝備 "穿甲的" 詞綴 (無視目標 20% 防禦力)' },
  { name: '連擊符文', type: 'material', price: 30000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'double_attack', desc: '賦予裝備 "連擊的" 詞綴 (普攻 15% 機率造成兩次傷害)' },
  { name: '敲暈符文', type: 'material', price: 20000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'stun_hit', desc: '賦予裝備 "敲暈的" 詞綴 (攻擊有 10% 機率暈眩目標)' },
  { name: '處決符文', type: 'material', price: 28000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'execute_dmg', desc: '賦予裝備 "處決的" 詞綴 (對 HP < 30% 的敵人傷害增加 30%)' },
  { name: '先機符文', type: 'material', price: 15000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'first_strike', desc: '賦予裝備 "先機的" 詞綴 (戰鬥開始時 ATB 充能 75%)' },
  { name: '渾身符文', type: 'material', price: 35000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'max_might', desc: '賦予裝備 "精神抖擻的" 詞綴 (自身 HP 在 95% 以上時，ATK +10%)' },
  { name: '鐵壁符文', type: 'material', price: 18000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'start_shield', desc: '賦予裝備 "鐵壁的" 詞綴 (戰鬥開始時獲得等同 20% HP 的護盾)' },
  { name: '奧術符文', type: 'material', price: 25000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'skill_amp', desc: '賦予裝備 "奧術的" 詞綴 (技能傷害增加 20%)' },
  { name: '獵鷹符文', type: 'material', price: 25000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'falcon_blitz', desc: '賦予裝備 "愛鳥人士的" 詞綴 (普通攻擊時 50% 機率產生獵鷹追擊傷害)' },

  // ═══════════════════════════════════════════
  // 狀態免疫符文 (Status Immunity Runes)
  // ═══════════════════════════════════════════
  { name: '解毒符文', type: 'material', price: 30000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'poison_immune', desc: '賦予裝備 "解毒的" 詞綴 (免疫中毒狀態)' },
  { name: '防火符文', type: 'material', price: 30000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'burn_immune', desc: '賦予裝備 "防火的" 詞綴 (免疫燒傷狀態)' },
  { name: '止血符文', type: 'material', price: 30000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'bleed_immune', desc: '賦予裝備 "止血的" 詞綴 (免疫流血狀態)' },
  { name: '抗寒符文', type: 'material', price: 30000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'frozen_immune', desc: '賦予裝備 "抗寒的" 詞綴 (免疫冰凍狀態)' },
  { name: '堅定符文', type: 'material', price: 35000, isMaterial: true, materialType: 'rune_stone', runeAffixId: 'stun_immune', desc: '賦予裝備 "堅定的" 詞綴 (免疫暈眩狀態)' },
];