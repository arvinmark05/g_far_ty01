
// Forward type declarations for Skill interface
export type StatusType = 'poison' | 'burn' | 'stun' | 'frozen' | 'bleed';
export type BuffType = 'double_strike' | 'evasion_stance' | 'haste' | 'counter_stance';

export interface Skill {
  id: string;
  name: string;
  desc: string;
  type: 'active' | 'passive' | 'art';
  passiveType?: 'trigger' | 'continuous'; // 被動類型：觸發類 / 持續效果類
  cooldown?: number; // Seconds
  icon?: string;
  // Logic parameters (trigger type)
  triggerRate?: number;
  atkMultiplier?: number;
  matkMultiplier?: number;
  // Continuous effect parameters
  continuousEffect?: {
    applyBuff?: BuffType;        // 普攻附帶 Buff
    applyStatus?: StatusType;    // 普攻附帶異常狀態
    statusDuration?: number;     // 自訂狀態持續時間（秒）
    defPenetration?: number;     // 穿透防禦比率 (0~1)
    bonusMatkRatio?: number;     // 額外 MATK 傷害比率
    atbOnCrit?: number;          // 暴擊時充能 ATB
    dodgeBonus?: number;         // 閃避加成
    defenseReverse?: boolean;    // 將目標防禦視為增傷
    agiAtkRatio?: number;        // 額外 AGI*比率 傷害
    healIntRatio?: number;       // 攻擊時回血 INT*比率
  };
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

  // Armor special effects
  armorEffect?: {
    // 內建屬性加成
    bonusStr?: number;
    bonusAgi?: number;
    bonusVit?: number;
    bonusInt?: number;
    bonusDodge?: number;      // 閃避加成
    bonusCritChance?: number; // 暴擊機率加成
    bonusCritDamage?: number; // 暴擊傷害加成
    builtInAffixes?: string[]; // 內建詞綴 (life_steal, bleed_hit 等)
    // 受擊觸發效果
    onHitBuff?: BuffType;     // 受擊時獲得 Buff
    onHitBuffDuration?: number;
    onHitHealPercent?: number; // 受擊時回復 MaxHP 百分比
    onHitShieldRefill?: number; // 受擊時 x% 機率補滿護盾
    onHitFreezeChance?: number; // 受擊時 x% 機率冰凍敵人
    deathSave?: boolean;       // HP>50% 時致命傷保留 1HP
  };
}

export interface Monster {
  name: string;
  emoji: string;
  hp: number;
  maxHp?: number;
  atk: number;
  def: number;          // 怪物防禦值
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
  critChance: number;   // 0~1 (0~100%)
  critDamage: number;   // 暴擊傷害倍率 (預設 1.5)
  dodgeChance: number;  // 0.05~0.95 (5%~95%)
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: string;
}

// StatusEffect 和 BuffEffect interface（類型定義已在檔案頂部）

export interface StatusEffect {
  type: StatusType;
  stacks: number;
  duration: number; // 剩餘持續時間 (秒)
  tickTimer: number; // 用於計算 DoT 的計時器 (0~1)
}

export interface BuffEffect {
  type: BuffType;
  stacks: number;
  duration: number; // 剩餘持續時間 (秒)
  consumeOnTrigger: boolean; // 觸發效果時是否消耗
}

// --- Story System Types ---

export interface GameFlags {
  smith_rescued?: boolean;
  backpack_quest_started?: boolean;
  backpack_found?: boolean;
  lily_joined?: boolean;
  floor_100_cleared?: boolean;
  floor_200_cleared?: boolean;
  floor_300_cleared?: boolean;
  floor_400_cleared?: boolean;
  floor_500_cleared?: boolean;
  intro_seen?: boolean;
  shop_tutorial_seen?: boolean;
}

export interface DialogueLine {
  speakerName: string;
  text: string;
  image?: string;
  emotion?: 'normal' | 'angry' | 'happy' | 'surprise' | 'lewd' | 'fear' | 'cry';
  // Special actions
  showNameInput?: boolean; // Trigger name input modal
}

export interface StoryScript {
  id: string;
  priority: number;
  lines: DialogueLine[];
  condition: (player: any, gameState: string, currentDepth: number, maxDepth: number, phase?: 'before_battle' | 'after_battle' | 'camp') => boolean;
  onFinish?: (player: any) => Partial<any>;
  // New fields
  requireFlags?: Partial<GameFlags>; // Shortcut for flag checking
  setFlags?: Partial<GameFlags>; // Flags to set on finish
  forceReturnToVillage?: boolean; // For ending events
}

