
import { Affix } from '../types';

export const AFFIXES: Record<string, Affix> = {
  // Stat Affixes
  str_boost: {
    id: 'str_boost',
    name: '力量的',
    type: 'stat',
    stat: 'str',
    value: 10
  },
  agi_boost: {
    id: 'agi_boost',
    name: '迅捷的',
    type: 'stat',
    stat: 'agi',
    value: 10
  },
  vit_boost: {
    id: 'vit_boost',
    name: '堅韌的',
    type: 'stat',
    stat: 'vit',
    value: 10
  },
  int_boost: {
    id: 'int_boost',
    name: '智慧的',
    type: 'stat',
    stat: 'int',
    value: 10
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
    value: 0.2 // Reflect 20% damage
  },
  elusive: {
    id: 'elusive',
    name: '靈巧的',
    type: 'passive',
    passiveEffect: 'dodge_chance',
    value: 0.1 // +10% dodge
  }
};