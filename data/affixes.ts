
import { Affix } from '../types';

export const AFFIXES: Record<string, Affix> = {
  // Stat Affixes
  str_boost: {
    id: 'str_boost',
    name: '力量的',
    type: 'stat',
    stat: 'str',
    value: 20
  },
  agi_boost: {
    id: 'agi_boost',
    name: '迅捷的',
    type: 'stat',
    stat: 'agi',
    value: 20
  },
  vit_boost: {
    id: 'vit_boost',
    name: '堅韌的',
    type: 'stat',
    stat: 'vit',
    value: 20
  },
  int_boost: {
    id: 'int_boost',
    name: '智慧的',
    type: 'stat',
    stat: 'int',
    value: 20
  },

  // Passive Affixes (Special Effects)
  life_steal: {
    id: 'life_steal',
    name: '吸血的',
    type: 'passive',
    passiveEffect: 'life_steal'
  },
  bleed_hit: {
    id: 'bleed_hit',
    name: '放血的',
    type: 'passive',
    passiveEffect: 'bleed_on_hit'
  },
  deadly: {
    id: 'deadly',
    name: '致命的',
    type: 'passive',
    passiveEffect: 'crit_chance',
    value: 0.15 // 15% crit chance
  },
  savage: {
    id: 'savage',
    name: '殘暴的',
    type: 'passive',
    passiveEffect: 'crit_damage',
    value: 0.5 // +50% crit damage
  },
  spiked: {
    id: 'spiked',
    name: '尖刺的',
    type: 'passive',
    passiveEffect: 'thorns',
    value: 0.3 // Reflect 30% damage
  },
  elusive: {
    id: 'elusive',
    name: '靈巧的',
    type: 'passive',
    passiveEffect: 'dodge_chance',
    value: 0.15 // +15% dodge
  },

  // ═══════════════════════════════════════════
  // 新增的 14 種詞綴 (Designed by Game Producer)
  // ═══════════════════════════════════════════

  // 普攻附加狀態類
  poison_hit: {
    id: 'poison_hit',
    name: '猛毒的',
    type: 'passive',
    passiveEffect: 'poison_hit'
  },
  burn_hit: {
    id: 'burn_hit',
    name: '灼熱的',
    type: 'passive',
    passiveEffect: 'burn_hit'
  },
  freeze_hit: {
    id: 'freeze_hit',
    name: '急凍的',
    type: 'passive',
    passiveEffect: 'freeze_hit',
    value: 0.25 // 25% 機率
  },
  berserk_on_hit: {
    id: 'berserk_on_hit',
    name: '狂暴的',
    type: 'passive',
    passiveEffect: 'berserk_on_hit',
    value: 0.25 // 受傷時 25% 機率
  },

  // 增強類
  speed_haste: {
    id: 'speed_haste',
    name: '快速的',
    type: 'passive',
    passiveEffect: 'speed_haste',
    value: 0.2 // +20% speed
  },
  def_pierce: {
    id: 'def_pierce',
    name: '穿甲的',
    type: 'passive',
    passiveEffect: 'def_pierce',
    value: 0.2 // 無視 20% 防禦
  },
  double_attack: {
    id: 'double_attack',
    name: '連擊的',
    type: 'passive',
    passiveEffect: 'double_attack',
    value: 0.15 // 15% 機率
  },
  stun_hit: {
    id: 'stun_hit',
    name: '敲暈的',
    type: 'passive',
    passiveEffect: 'stun_hit',
    value: 0.1 // 10% 機率
  },
  execute_dmg: {
    id: 'execute_dmg',
    name: '處決的',
    type: 'passive',
    passiveEffect: 'execute_dmg',
    value: 0.3 // 對 HP < 30% 目標 +30% 傷害
  },

  // 戰鬥開始效果類
  first_strike: {
    id: 'first_strike',
    name: '先機的',
    type: 'passive',
    passiveEffect: 'first_strike',
    value: 75 // ATB +75%
  },
  start_shield: {
    id: 'start_shield',
    name: '鐵壁的',
    type: 'passive',
    passiveEffect: 'start_shield',
    value: 0.2 // 20% maxHP 護盾
  },

  // 特殊增傷類
  max_might: {
    id: 'max_might',
    name: '精神抖擻的',
    type: 'passive',
    passiveEffect: 'max_might',
    value: 0.1 // HP > 95% 時 ATK +10%
  },
  skill_amp: {
    id: 'skill_amp',
    name: '奧術的',
    type: 'passive',
    passiveEffect: 'skill_amp',
    value: 0.2 // 技能傷害 +20%
  },
  falcon_blitz: {
    id: 'falcon_blitz',
    name: '愛鳥人士的',
    type: 'passive',
    passiveEffect: 'falcon_blitz',
    value: 0.5 // 50% 機率觸發獵鷹追擊
  },

  // ═══════════════════════════════════════════
  // 狀態免疫詞綴 (Status Immunity)
  // ═══════════════════════════════════════════
  poison_immune: {
    id: 'poison_immune',
    name: '解毒的',
    type: 'passive',
    passiveEffect: 'poison_immune'
  },
  burn_immune: {
    id: 'burn_immune',
    name: '防火的',
    type: 'passive',
    passiveEffect: 'burn_immune'
  },
  bleed_immune: {
    id: 'bleed_immune',
    name: '止血的',
    type: 'passive',
    passiveEffect: 'bleed_immune'
  },
  frozen_immune: {
    id: 'frozen_immune',
    name: '抗寒的',
    type: 'passive',
    passiveEffect: 'frozen_immune'
  },
  stun_immune: {
    id: 'stun_immune',
    name: '堅定的',
    type: 'passive',
    passiveEffect: 'stun_immune'
  }
};