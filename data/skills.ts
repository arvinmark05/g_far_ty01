
import { Skill } from '../types';

// 職業主動技能
export const CLASS_SKILLS: Record<string, Skill> = {
  shield_bash: {
    id: 'shield_bash',
    name: '盾擊',
    desc: '造成傷害並擊暈敵人，Def越高傷害越高',
    type: 'active',
    cooldown: 5.0
  },
  poison_blade: {
    id: 'poison_blade',
    name: '毒刃',
    desc: '攻擊弱點並使敵人中毒',
    type: 'active',
    cooldown: 5.0
  },
  fireball_skill: {
    id: 'fireball_skill',
    name: '火球術',
    desc: '造成魔法傷害並燃燒敵人',
    type: 'active',
    cooldown: 5.0
  },
  sacrificial_strike: {
    id: 'sacrificial_strike',
    name: '捨身一擊',
    desc: '消耗20%當前生命造成巨額傷害',
    type: 'active',
    cooldown: 5.0
  }
};

// 武器戰技 (Weapon Arts)
export const WEAPON_ARTS: Record<string, Skill> = {
  sword: {
    id: 'quick_slash',
    name: '快斬',
    desc: '造成 0.5倍 ATK 傷害',
    type: 'art',
    cooldown: 6.0,
    icon: '⚔️'
  },
  staff: {
    id: 'mana_barrier',
    name: '法力屏障',
    desc: '獲得 MATK*0.8 的護盾',
    type: 'art',
    cooldown: 6.0,
    icon: '🛡️'
  },
  dagger: {
    id: 'shadow_combo',
    name: '影連擊',
    desc: '賦予自身「連擊」Buff，下次普攻連續攻擊2次',
    type: 'art',
    cooldown: 8.0,
    icon: '🗡️'
  },
  bow: {
    id: 'wind_dodge',
    name: '風之迴避',
    desc: '賦予自身「迴避態勢」Buff，強制閃避下一次攻擊',
    type: 'art',
    cooldown: 12.0,
    icon: '🏹'
  },
  mace: {
    id: 'crushing_blow',
    name: '粉碎打擊',
    desc: '造成 0.5倍 ATK 傷害並暈眩敵人',
    type: 'art',
    cooldown: 8.0,
    icon: '🔨'
  }
};

// 武器被動技能 (Passives)
export const WEAPON_PASSIVES: Record<string, Skill> = {
  bash: {
    id: 'bash',
    name: '重擊',
    desc: '25%機率造成1.8倍物理傷害',
    type: 'passive',
    triggerRate: 0.25,
    atkMultiplier: 1.8,
    matkMultiplier: 0
  },
  pierce_slash: {
    id: 'pierce_slash',
    name: '破甲斬',
    desc: '25%機率造成1.5倍傷害並穿透50%防禦',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 0.25,
    atkMultiplier: 1.5,
    matkMultiplier: 0,
    continuousEffect: { defPenetration: 0.5 }
  },
  holy_slash: {
    id: 'holy_slash',
    name: '聖光斬',
    desc: '50%機率造成混合傷害',
    type: 'passive',
    triggerRate: 0.5,
    atkMultiplier: 1.5,
    matkMultiplier: 1.5
  },
  fire_bolt: {
    id: 'fire_bolt',
    name: '火球術',
    desc: '造成1倍魔法傷害，並燃燒敵人',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 1.0,
    atkMultiplier: 0,
    matkMultiplier: 1.0,
    continuousEffect: { applyStatus: 'burn' }
  },
  frost_bolt: {
    id: 'frost_bolt',
    name: '寒冰箭',
    desc: '造成1.0倍魔法傷害，25%機率凍結敵人',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 1.0,
    atkMultiplier: 0,
    matkMultiplier: 1.0,
    continuousEffect: { applyStatus: 'frozen', statusChance: 0.25 }
  },
  poison_bolt: {
    id: 'poison_bolt',
    name: '毒箭術',
    desc: '造成1.2倍魔法傷害，並使敵人中毒',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 1.0,
    atkMultiplier: 0,
    matkMultiplier: 1.2,
    continuousEffect: { applyStatus: 'poison' }
  },
  thunder: {
    id: 'thunder',
    name: '雷鳴術',
    desc: '造成1.8倍魔法傷害',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 1.0,
    atkMultiplier: 0,
    matkMultiplier: 1.8
  },

  // === Dagger 被動 ===
  venomous: {
    id: 'venomous',
    name: '劇毒',
    desc: '普攻附帶中毒效果',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { applyStatus: 'poison' }
  },
  assassin_edge: {
    id: 'assassin_edge',
    name: '刺客之刃',
    desc: '暴擊時充能ATB 50',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { atbOnCrit: 50 }
  },

  // === Bow 被動 ===
  precise_shot: {
    id: 'precise_shot',
    name: '精準射擊',
    desc: '穿透100%防禦',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { defPenetration: 1.0 }
  },

  // === Mace 被動 ===
  skull_crack: {
    id: 'skull_crack',
    name: '碎顱',
    desc: '普攻附帶暈0.4秒',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { applyStatus: 'stun', statusDuration: 0.4 }
  },

  // === 進階 Dagger 被動 ===
  bleed_stab: {
    id: 'bleed_stab',
    name: '血刃',
    desc: '普攻附帶流血',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { applyStatus: 'bleed' }
  },
  shadow_shift: {
    id: 'shadow_shift',
    name: '影遁',
    desc: '閃避+35%',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { dodgeBonus: 0.35 }
  },
  armor_auger: {
    id: 'armor_auger',
    name: '破甲錐',
    desc: '將目標防禦轉為增傷',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { defenseReverse: true }
  },

  // === 進階 Bow 被動 ===
  arrow_shot: {
    id: 'arrow_shot',
    name: '迅捷射擊',
    desc: '100%發動 ATK*0.8 + AGI*1 傷害',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 1.0,
    atkMultiplier: 0.8,
    matkMultiplier: 0,
    continuousEffect: { agiAtkRatio: 1.0 }
  },
  magic_arrow: {
    id: 'magic_arrow',
    name: '魔力箭矢',
    desc: '普攻附加 MATK*0.8 魔法傷害',
    type: 'passive',
    passiveType: 'continuous',
    continuousEffect: { bonusMatkRatio: 0.8 }
  },
  ice_shot: {
    id: 'ice_shot',
    name: '冰霜箭矢',
    desc: '30%發動 1.4倍傷害 + 冰凍',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 0.3,
    atkMultiplier: 1.4,
    matkMultiplier: 0,
    continuousEffect: { applyStatus: 'frozen' }
  },

  // === 進階 Mace 被動 ===
  holy_light: {
    id: 'holy_light',
    name: '聖光',
    desc: '25%發動 MATK*1.5 傷害',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 0.25,
    atkMultiplier: 0,
    matkMultiplier: 1.5
  },
  war_hammer: {
    id: 'war_hammer',
    name: '戰錘',
    desc: '20%發動 2倍傷害 + 暈眩',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 0.2,
    atkMultiplier: 2.0,
    matkMultiplier: 0,
    continuousEffect: { applyStatus: 'stun' }
  },
  divine_judgment: {
    id: 'divine_judgment',
    name: '神聖裁決',
    desc: '100%發動 (ATK+MATK)*0.8 + 回血 INT*0.8',
    type: 'passive',
    passiveType: 'trigger',
    triggerRate: 1.0,
    atkMultiplier: 0.8,
    matkMultiplier: 0.8,
    continuousEffect: { healIntRatio: 0.8 }
  }
};
