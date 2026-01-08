
import { Item } from '../types';
import { WEAPON_PASSIVES } from './skills';

export const EQUIPMENT: { weapons: Item[], armor: Item[] } = {
  weapons: [
    { name: '木劍', atk: 5, price: 50, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.bash, maxSlots: 4 },
    { name: '鐵劍', atk: 12, price: 150, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.frenzy, maxSlots: 3 },
    { name: '鋼劍', atk: 20, price: 400, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.pierce, maxSlots: 2 },
    { name: '聖劍', atk: 35, price: 1000, type: 'weapon', category: 'sword', skill: WEAPON_PASSIVES.holy_slash, maxSlots: 0 },
    { name: '木製長杖', atk: 2, price: 80, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.fireball, maxSlots: 4 },
    { name: '法師短杖', atk: 5, price: 200, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.frost_bolt, maxSlots: 3 },
    { name: '賢者之杖', atk: 8, price: 500, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.thunder, maxSlots: 2 },
    { name: '魔導書', atk: 12, price: 1200, type: 'weapon', category: 'staff', skill: WEAPON_PASSIVES.meteor, maxSlots: 0 }
  ],
  armor: [
    { name: '布衣', def: 3, price: 40, type: 'armor', maxSlots: 4 },
    { name: '皮甲', def: 8, price: 120, type: 'armor', maxSlots: 3 },
    { name: '鎖甲', def: 15, price: 350, type: 'armor', maxSlots: 2 },
    { name: '板甲', def: 25, price: 900, type: 'armor', maxSlots: 1 },
    { name: '龍鱗甲', def: 40, price: 2500, type: 'armor', maxSlots: 0 }
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