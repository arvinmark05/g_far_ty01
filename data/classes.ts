
import { ClassData } from '../types';
import { CLASS_SKILLS } from './skills';

export const CLASSES: Record<string, ClassData> = {
  knight: {
    name: '騎士',
    emoji: '🛡️',
    hp: 120, str: 5, agi: 3, vit: 6, int: 2,
    desc: '高防禦與格擋',
    skillId: 'shield_bash'
  },
  rogue: {
    name: '盜賊',
    emoji: '🗡️',
    hp: 80, str: 6, agi: 8, vit: 3, int: 2,
    desc: '高速度與爆發',
    skillId: 'poison_blade'
  },
  mage: {
    name: '法師',
    emoji: '🔮',
    hp: 70, str: 2, agi: 5, vit: 2, int: 9,
    desc: '強大魔法攻擊',
    skillId: 'fireball_skill'
  },
  challenger: {
    name: '挑戰者',
    emoji: '⚡',
    hp: 90, str: 5, agi: 5, vit: 4, int: 4,
    desc: '捨身攻擊',
    skillId: 'sacrificial_strike'
  }
};
