
import { Skill } from '../types';

// 職業主動技能
export const CLASS_SKILLS: Record<string, Skill> = {
  shield_bash: {
    id: 'shield_bash',
    name: '聖盾衝擊',
    desc: '造成防禦力相關傷害並擊退敵人ATB',
    type: 'active',
    cooldown: 5.0
  },
  weakness_strike: {
    id: 'weakness_strike',
    name: '弱點刺擊',
    desc: '必定暴擊造成大量傷害',
    type: 'active',
    cooldown: 5.0
  },
  mana_overload: {
    id: 'mana_overload',
    name: '魔力超載',
    desc: '消耗魔力造成3倍魔法傷害',
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
    cooldown: 8.0,
    icon: '⚔️'
  },
  staff: {
    id: 'mana_barrier',
    name: '法力屏障',
    desc: '獲得 0.5倍 MATK 護盾',
    type: 'art',
    cooldown: 8.0,
    icon: '🛡️'
  }
};

// 武器被動技能 (Passives)
export const WEAPON_PASSIVES: Record<string, Skill> = {
  bash: {
    id: 'bash',
    name: '重擊',
    desc: '25%機率造成1.5倍物理傷害',
    type: 'passive',
    triggerRate: 0.25,
    atkMultiplier: 1.5,
    matkMultiplier: 0
  },
  frenzy: {
    id: 'frenzy',
    name: '狂擊',
    desc: '30%機率造成1.8倍物理傷害',
    type: 'passive',
    triggerRate: 0.3,
    atkMultiplier: 1.8,
    matkMultiplier: 0
  },
  pierce: {
    id: 'pierce',
    name: '破甲斬',
    desc: '35%機率造成2.2倍物理傷害',
    type: 'passive',
    triggerRate: 0.35,
    atkMultiplier: 2.2,
    matkMultiplier: 0
  },
  holy_slash: {
    id: 'holy_slash',
    name: '聖光斬',
    desc: '40%機率造成混合傷害',
    type: 'passive',
    triggerRate: 0.4,
    atkMultiplier: 2.0,
    matkMultiplier: 1.5
  },
  fireball: {
    id: 'fireball',
    name: '火球術',
    desc: '100%發動，造成1倍魔法傷害',
    type: 'passive',
    triggerRate: 1.0,
    atkMultiplier: 0,
    matkMultiplier: 1.0
  },
  frost_bolt: {
    id: 'frost_bolt',
    name: '冰霜箭',
    desc: '100%發動，造成1.3倍魔法傷害',
    type: 'passive',
    triggerRate: 1.0,
    atkMultiplier: 0,
    matkMultiplier: 1.3
  },
  thunder: {
    id: 'thunder',
    name: '雷霆術',
    desc: '100%發動，造成1.8倍魔法傷害',
    type: 'passive',
    triggerRate: 1.0,
    atkMultiplier: 0,
    matkMultiplier: 1.8
  },
  meteor: {
    id: 'meteor',
    name: '隕石術',
    desc: '100%發動，混合毀滅傷害',
    type: 'passive',
    triggerRate: 1.0,
    atkMultiplier: 0.5,
    matkMultiplier: 2.5
  }
};
