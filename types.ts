
export interface Skill {
  id: string;
  name: string;
  desc: string;
  type: 'active' | 'passive' | 'art';
  cooldown?: number; // Seconds
  icon?: string;
  // Logic parameters
  triggerRate?: number;
  atkMultiplier?: number;
  matkMultiplier?: number;
}

export interface ClassData {
  name: string;
  emoji: string;
  hp: number;
  str: number;
  agi: number;
  vit: number;
  int: number;
  desc: string;
  skillId: string; // Reference to CLASS_SKILLS
}

export interface Affix {
  id: string;
  name: string; // e.g., "力量的"
  type: 'stat' | 'passive';
  stat?: 'str' | 'agi' | 'vit' | 'int';
  value?: number; // e.g., 10
  // Expanded passive effects
  passiveEffect?: 'life_steal' | 'bleed_on_hit' | 'thorns' | 'crit_chance' | 'crit_damage' | 'dodge_chance'; 
}

export interface Item {
  name: string;
  type: 'weapon' | 'armor' | 'material'; // Add material
  category?: string; // sword, staff, etc.
  atk?: number;
  def?: number;
  price: number;
  skill?: Skill; // Passive skill or reference
  
  // New Systems
  maxSlots?: number;
  slots?: number; // Current AVAILABLE slots
  affixes?: string[]; // List of Affix IDs
  refineLevel?: number; // 0 to 9
  
  // Material properties
  isMaterial?: boolean;
  materialType?: 'refine_stone' | 'rune_stone';
  runeAffixId?: string; // If it's a rune stone, what affix does it give?
  desc?: string; // Description for materials
  quantity?: number; // For stacking materials
}

export interface Monster {
  name: string;
  emoji: string;
  hp: number;
  maxHp?: number;
  atk: number;
  speed: number;
  gold: number;
  exp: number;
  isBoss?: boolean;
  statusEffects?: StatusEffect[];
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition: (player: any) => boolean;
}

export interface PlayerStats {
  atk: number;
  matk: number;
  def: number;
  speed: number;
  maxShield: number;
  maxHp: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: string;
}

// 新增狀態異常定義
export type StatusType = 'poison' | 'burn' | 'stun' | 'frozen' | 'bleed';

export interface StatusEffect {
  type: StatusType;
  stacks: number;
  duration: number; // 剩餘持續時間 (秒)
  tickTimer: number; // 用於計算 DoT 的計時器 (0~1)
}

// --- Story System Types ---

export interface DialogueLine {
  speakerName: string;
  text: string;
  image?: string; // Path to image asset (e.g., '../assets/img/smith_01.png')
  emotion?: 'normal' | 'angry' | 'happy' | 'surprise'; // For potential CSS effects or variant selection
}

export interface StoryScript {
  id: string;
  priority: number; // Higher number checks first
  lines: DialogueLine[];
  // Condition logic to trigger this script
  condition: (player: any, gameState: string, currentDepth: number, maxDepth: number) => boolean;
  // Callback after script finishes (e.g., give item, increment progress)
  onFinish?: (player: any) => Partial<any>; 
}
