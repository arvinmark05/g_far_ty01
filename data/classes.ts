
import { ClassData } from '../types';
import { CLASS_SKILLS } from './skills';

export const CLASSES: Record<string, ClassData> = {
  knight: {
    name: '騎士',
    emoji: '🛡️',
    hp: 120, str: 5, agi: 3, vit: 6, int: 2,
    desc: '血量高防禦力強',
    skillId: 'shield_bash'
  },
  rogue: {
    name: '盜賊',
    emoji: '🗡️',
    hp: 70, str: 6, agi: 8, vit: 3, int: 2,
    desc: '擁有較高速度與爆擊率',
    skillId: 'poison_blade'
  },
  mage: {
    name: '法師',
    emoji: '🔮',
    hp: 50, str: 2, agi: 5, vit: 2, int: 9,
    desc: '魔法攻擊強大',
    skillId: 'fireball_skill'
  },
  challenger: {
    name: '困難模式',
    emoji: '👨🏾‍🦲',
    hp: 90, str: 5, agi: 5, vit: 4, int: 4,
    desc: '捨身衝撞',
    skillId: 'sacrificial_strike'
  }
};
