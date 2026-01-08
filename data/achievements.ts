
import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'dmg_100', name: '初露鋒芒', desc: '單次傷害超過 100', icon: '💥', condition: (p: any) => p.maxDamage >= 100 },
  { id: 'dmg_1000', name: '毀滅打擊', desc: '單次傷害超過 1000', icon: '💣', condition: (p: any) => p.maxDamage >= 1000 },
  { id: 'depth_10', name: '探險家', desc: '到達地下城 10 層', icon: '🔦', condition: (p: any) => p.maxDepth >= 10 },
  { id: 'depth_50', name: '深淵行者', desc: '到達地下城 50 層', icon: '🌋', condition: (p: any) => p.maxDepth >= 50 },
  { id: 'rich_1000', name: '第一桶金', desc: '持有金幣超過 1000', icon: '💰', condition: (p: any) => p.gold >= 1000 },
  { id: 'level_10', name: '資深冒險者', desc: '等級達到 10 級', icon: '⭐', condition: (p: any) => p.level >= 10 },
];
