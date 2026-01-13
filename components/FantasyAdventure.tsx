
import React, { useState, useEffect, useRef } from 'react';
import { Sword, Shield, Heart, Coins, Zap, Save, Download, Upload, Skull, Flame, Sparkles, Settings, Volume2, Trophy, X, MinusCircle, Wind, Snowflake, Droplets, ZapOff, Droplet, Hammer, Gem } from 'lucide-react';

// --- 匯入資料模組 ---
import { CLASSES } from '../data/classes';
import { MONSTERS, BOSS_MONSTERS } from '../data/monsters';
import { EQUIPMENT } from '../data/items';
import { ACHIEVEMENTS } from '../data/achievements';
import { CLASS_SKILLS, WEAPON_ARTS } from '../data/skills';
import { calculateStats, getMonsterDrops, getItemDisplayName, getRefinedStat, expToLevel } from '../utils/gameFormulas';
import { BattleHandler, BattleResult } from '../utils/BattleHandler';
import { FloatingText, StatusEffect, Item, StoryScript, GameFlags } from '../types';
import { StoryHandler } from '../utils/StoryHandler';
import DialogueOverlay from './DialogueOverlay';

export default function FantasyAdventure() {
  // --- State ---
  const [gameState, setGameState] = useState('class-select');
  const [player, setPlayer] = useState<any>(null);
  const [currentMonster, setCurrentMonster] = useState<any>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [depth, setDepth] = useState(0);
  const [maxDepth, setMaxDepth] = useState(0);
  const [lastCampDepth, setLastCampDepth] = useState(0);
  const [previousState, setPreviousState] = useState('village');
  const [showInventory, setShowInventory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(50);
  const [inventory, setInventory] = useState<any[]>([]);

  // Story System State
  const [currentScript, setCurrentScript] = useState<StoryScript | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingPlayerName, setPendingPlayerName] = useState('');
  const [pendingNextEncounter, setPendingNextEncounter] = useState(false); // Track if we need to proceed after story

  // Shop State
  const [shopTab, setShopTab] = useState<'buy' | 'sell' | 'refine' | 'enchant'>('buy');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState<number | null>(null);

  // --- DEV TOOLS STATE (可移除區塊) ---
  const [devStartFloor, setDevStartFloor] = useState(1);

  // 戰鬥與特效
  const [playerATB, setPlayerATB] = useState(0);
  const [monsterATB, setMonsterATB] = useState(0);
  const [inBattle, setInBattle] = useState(false);
  const [skillCooldown, setSkillCooldown] = useState(0);
  const [weaponSkillCooldown, setWeaponSkillCooldown] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [monsterShake, setMonsterShake] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);

  const battleLogRef = useRef<HTMLDivElement>(null);
  const floatingTextIdRef = useRef(0);

  // --- Effects ---

  // 自動存檔
  useEffect(() => {
    if (player && (gameState === 'village' || gameState === 'camp')) {
      saveGame(false);
    }
  }, [gameState, player, inventory, depth, maxDepth, lastCampDepth]);

  // 成就檢查
  useEffect(() => {
    if (player) {
      checkAchievements();
    }
  }, [player, maxDepth]);

  // 劇情觸發檢查
  useEffect(() => {
    // 在遊戲狀態改變、深度改變時檢查劇情
    // 確保不在戰鬥中觸發（除非有特殊戰鬥劇情，目前先排除）
    if (player && !inBattle && !currentScript) {
      const script = StoryHandler.checkTriggers(player, gameState, depth, maxDepth);
      if (script) {
        setCurrentScript(script);
      }
    }
  }, [gameState, depth, maxDepth, player, inBattle, currentScript]);

  // BattleLog自動滾動
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleLog]);

  // --- 戰鬥循環 (使用 BattleHandler) ---
  const monsterAttackingRef = useRef(false);

  useEffect(() => {
    // 若有劇情正在播放，暫停戰鬥循環
    if (inBattle && currentMonster && player && !currentScript) {
      const interval = setInterval(() => {
        // 使用 BattleHandler 計算時間流逝與狀態 Tick
        const result = BattleHandler.processGameTick(player, currentMonster, skillCooldown, weaponSkillCooldown);

        // 更新 Cooldowns 與 ATB
        setSkillCooldown(prev => Math.max(0, prev + result.skillCdDelta));
        setWeaponSkillCooldown(prev => Math.max(0, prev + result.weaponCdDelta));
        setPlayerATB(prev => prev + result.playerAtbDelta);

        // 處理 DoT 造成的狀態更新 (如果有的話)
        if (result.tickResult) {
          applyBattleResult(result.tickResult);
        }

        setMonsterATB(prev => {
          const newATB = prev + result.monsterAtbDelta;
          if (newATB >= 100) {
            // 怪物行動 - 使用 ref 防止重複觸發
            if (!monsterAttackingRef.current) {
              monsterAttackingRef.current = true;
              // 使用 setTimeout 確保在 state update 完成後執行
              setTimeout(() => {
                performMonsterAttack();
                monsterAttackingRef.current = false;
              }, 0);
            }
            return 0; // 始終重置 ATB
          }
          return newATB;
        });

      }, 100);

      return () => clearInterval(interval);
    }
  }, [inBattle, currentMonster, player, skillCooldown, weaponSkillCooldown, currentScript]);

  // 監聽 ATB 觸發普攻
  useEffect(() => {
    // 劇情中暫停攻擊觸發
    if (inBattle && playerATB >= 100 && !currentScript) {
      performPlayerAttack();
      setPlayerATB(prev => prev - 100);
    }
  }, [playerATB, inBattle, currentScript]);

  // --- Helper: 統一處理戰鬥結果 ---
  const applyBattleResult = (result: BattleResult) => {
    if (!result) return;

    // 1. 更新 Player
    if (result.playerUpdates && Object.keys(result.playerUpdates).length > 0) {
      setPlayer((prev: any) => ({ ...prev, ...result.playerUpdates }));
    }

    // 2. 更新 Monster
    if (result.monsterUpdates && currentMonster) {
      setCurrentMonster((prev: any) => ({ ...prev, ...result.monsterUpdates }));
    }

    // 3. 處理 Logs
    if (result.logs.length > 0) {
      setBattleLog(prev => [...prev, ...result.logs]);
    }

    // 4. 處理 Floating Texts
    result.floatingTexts.forEach(ft => {
      addFloatingText(ft.text, ft.type, ft.target === 'player');
    });

    // 5. 處理特效
    if (result.effects.screenShake) triggerScreenShake();
    if (result.effects.monsterShake || result.effects.hitFlash) triggerHitEffect();

    // 6. 處理冷卻與 ATB 重置 (如果 handler 回傳)
    if (result.cooldowns) {
      if (result.cooldowns.skill !== undefined) setSkillCooldown(result.cooldowns.skill);
      if (result.cooldowns.weapon !== undefined) setWeaponSkillCooldown(result.cooldowns.weapon);
    }

    if (result.atbReset === 'monster') {
      // 外部已經在 loop 處理 monster ATB reset，但如果是技能效果可在此處理
    }

    // 7. 死亡判斷
    if (result.monsterDied) {
      setInBattle(false);
      handleMonsterDefeat();
      setCurrentMonster((prev: any) => ({ ...prev, hp: 0, statusEffects: [] }));
    } else if (result.playerDied) {
      setInBattle(false);
      setTimeout(() => setGameState('game-over'), 1500);
    }
  };

  // --- UI Helper Functions ---

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  };

  const triggerHitEffect = () => {
    setMonsterShake(true);
    setHitFlash(true);
    setTimeout(() => {
      setMonsterShake(false);
      setHitFlash(false);
    }, 300);
  }

  const addFloatingText = (text: string, type: 'damage' | 'heal' | 'crit' | 'miss' | 'shield', isPlayerTarget: boolean, colorOverride?: string) => {
    const id = floatingTextIdRef.current++;
    let color = colorOverride || 'text-white';
    let size = 'text-xl';

    if (!colorOverride) {
      if (type === 'damage') color = isPlayerTarget ? 'text-red-500' : 'text-yellow-400';
      if (type === 'crit') { color = 'text-orange-500'; size = 'text-3xl font-black'; }
      if (type === 'heal') color = 'text-green-400';
      if (type === 'miss') color = 'text-gray-400';
      if (type === 'shield') color = 'text-blue-400';
    }

    let startX = 50;
    let startY = 50;

    if (isPlayerTarget) {
      startX = 50 + (Math.random() * 20 - 10);
      startY = 75;
    } else {
      startX = 50 + (Math.random() * 20 - 10);
      startY = 25;
    }

    setFloatingTexts(prev => [...prev, { id, text, x: startX, y: startY, color, size }]);

    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1000);
  };

  const StatusIcon = ({ effect }: { effect: StatusEffect; key?: React.Key }) => {
    let icon = null;
    let color = '';

    switch (effect.type) {
      case 'poison': icon = <Droplets size={12} />; color = 'text-green-400'; break;
      case 'burn': icon = <Flame size={12} />; color = 'text-orange-500'; break;
      case 'stun': icon = <ZapOff size={12} />; color = 'text-yellow-400'; break;
      case 'frozen': icon = <Snowflake size={12} />; color = 'text-cyan-400'; break;
      case 'bleed': icon = <Droplet size={12} />; color = 'text-red-600'; break;
    }

    return (
      <div className={`flex items-center gap-0.5 ${color} bg-black/60 px-1 py-0.5 rounded text-[10px] font-bold border border-white/10`} title={`${effect.type} (${effect.duration.toFixed(1)}s)`}>
        {icon}
        <span>{effect.stacks > 1 ? `x${effect.stacks}` : ''}</span>
        <span className="text-[8px] opacity-70 ml-0.5">{Math.ceil(effect.duration)}s</span>
      </div>
    );
  };

  // Helper function to add items with stacking logic for materials
  const addToInventory = (newItem: Item) => {
    if (newItem.isMaterial) {
      setInventory(prev => {
        const existingIndex = prev.findIndex(i => i.name === newItem.name && i.type === newItem.type);
        if (existingIndex >= 0) {
          const newInv = [...prev];
          newInv[existingIndex] = {
            ...newInv[existingIndex],
            quantity: (newInv[existingIndex].quantity || 1) + (newItem.quantity || 1)
          };
          return newInv;
        }
        return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
      });
    } else {
      setInventory(prev => [...prev, newItem]);
    }
  };

  const saveGame = (notify = true) => {
    if (!player) return;
    const saveData = {
      player,
      inventory,
      depth,
      maxDepth,
      lastCampDepth,
      gameState: gameState === 'battle' ? 'village' : gameState
    };
    localStorage.setItem('fantasyrpg_save', JSON.stringify(saveData));
    if (notify) {
      alert('遊戲已存檔！');
    }
  };

  const loadGame = () => {
    const saved = localStorage.getItem('fantasyrpg_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPlayer(data.player);
        setInventory(data.inventory);
        setDepth(data.depth);
        setMaxDepth(data.maxDepth);
        setLastCampDepth(data.lastCampDepth);
        setGameState(data.gameState || 'village');
        setBattleLog(['歡迎回來，冒險者！']);
      } catch (e) {
        alert('存檔讀取失敗！');
      }
    } else {
      alert('找不到存檔！');
    }
  };

  const getEquipmentComparison = (newItem: any) => {
    if (!player) return null;
    const currentItem = player[newItem.type === 'weapon' ? 'weapon' : 'armor'];

    // 如果是素材，不顯示比較
    if (newItem.type === 'material') return null;

    if (!currentItem) {
      return <span className="text-green-400 text-xs ml-1">(新裝備)</span>;
    }

    // 比較需要考慮強化和詞綴
    const newAtk = getRefinedStat(newItem.atk, newItem.refineLevel);
    const curAtk = getRefinedStat(currentItem.atk, currentItem.refineLevel);
    const newDef = getRefinedStat(newItem.def, newItem.refineLevel);
    const curDef = getRefinedStat(currentItem.def, currentItem.refineLevel);

    if (newItem.type === 'weapon') {
      const diff = newAtk - curAtk;
      if (diff === 0) return null;
      return <span className={`${diff > 0 ? 'text-green-400' : 'text-red-400'} text-xs ml-1 font-bold`}>{diff > 0 ? `(+${diff})` : `(${diff})`}</span>;
    } else {
      const diff = newDef - curDef;
      if (diff === 0) return null;
      return <span className={`${diff > 0 ? 'text-green-400' : 'text-red-400'} text-xs ml-1 font-bold`}>{diff > 0 ? `(+${diff})` : `(${diff})`}</span>;
    }
  };

  const checkAchievements = () => {
    if (!player) return;

    const unlocked = new Set(player.achievements || []);
    let newUnlock = false;

    ACHIEVEMENTS.forEach(ach => {
      if (!unlocked.has(ach.id) && ach.condition(player)) {
        unlocked.add(ach.id);
        newUnlock = true;
        setBattleLog(prev => [...prev, `🏆 解鎖成就：${ach.name} (${ach.desc})`]);
        addFloatingText(`🏆 ${ach.name}`, 'crit', true);
      }
    });

    if (newUnlock) {
      setPlayer((prev: any) => ({ ...prev, achievements: Array.from(unlocked) }));
    }
  };

  const handleStoryComplete = () => {
    if (!currentScript) return;

    // Use StoryHandler to process script finish (handles onFinish + setFlags)
    const updates = StoryHandler.processScriptFinish(currentScript, player);
    if (Object.keys(updates).length > 0) {
      setPlayer((prev: any) => ({ ...prev, ...updates }));
      // Trigger save after significant story progress
      if (updates.storyProgress || updates.flags) {
        setTimeout(() => saveGame(false), 100);
      }
    }

    // Handle forceReturnToVillage (for ending)
    if (currentScript.forceReturnToVillage) {
      setCurrentScript(null);
      setPendingNextEncounter(false);
      setTimeout(() => {
        returnToVillage();
      }, 500);
      return;
    }

    // Check if we need to proceed to next encounter (after after_battle story)
    const shouldProceed = pendingNextEncounter;

    setCurrentScript(null);
    setPendingNextEncounter(false);

    if (shouldProceed) {
      // Proceed to next encounter after a short delay
      setTimeout(() => {
        setCurrentMonster(null);
        const nextEvent = checkNextEvent(depth);
        if (nextEvent.type === 'camp') {
          enterCamp(nextEvent.depth);
        } else {
          encounterMonster(depth);
        }
      }, 500);
    }
  };

  // --- Game Logic ---

  const selectClass = (classKey: string) => {
    const selectedClass = CLASSES[classKey];

    setPlayer({
      name: 'Hero', // Default name, will be set by intro
      flags: {} as GameFlags,
      class: selectedClass.name,
      classKey: classKey,
      baseMaxHp: selectedClass.hp,
      hp: selectedClass.hp,
      shield: 0,
      str: selectedClass.str,
      agi: selectedClass.agi,
      vit: selectedClass.vit,
      int: selectedClass.int,
      baseStr: selectedClass.str,
      baseAgi: selectedClass.agi,
      baseVit: selectedClass.vit,
      baseInt: selectedClass.int,
      statPoints: 0,
      gold: 100,
      exp: 0,
      level: 1,
      weapon: null,
      armor: null,
      potions: 3,
      achievements: [],
      maxDamage: 0,
      statusEffects: [],
      storyProgress: 0
    });
    setGameState('village');
  };

  // Dynamic camp frequency based on floor depth
  const getCampChance = (floor: number): boolean => {
    if (floor <= 100) return floor % 10 === 0;
    if (floor <= 200) return floor % 20 === 0;
    if (floor <= 300) return floor % 30 === 0;
    if (floor <= 400) return floor % 40 === 0;
    return floor % 50 === 0;
  };

  const checkNextEvent = (currentDepth: number) => {
    const nextDepth = currentDepth + 1;
    if (BOSS_MONSTERS[nextDepth]) return { type: 'boss', depth: nextDepth };
    // Force camp before boss floors
    if (BOSS_MONSTERS[nextDepth + 1]) return { type: 'camp', depth: nextDepth };
    // Dynamic camp frequency
    if (getCampChance(nextDepth)) return { type: 'camp', depth: nextDepth };
    return { type: 'battle', depth: nextDepth };
  };

  const startExploration = (fromCamp = false) => {
    if (fromCamp) {
      setDepth(lastCampDepth);
    } else {
      setDepth(0);
    }

    const nextEvent = checkNextEvent(fromCamp ? lastCampDepth : 0);
    if (nextEvent.type === 'camp') {
      enterCamp(nextEvent.depth);
    } else {
      encounterMonster(fromCamp ? lastCampDepth : 0);
    }
  };

  const enterCamp = (campDepth: number) => {
    setDepth(campDepth);
    setLastCampDepth(campDepth);
    if (campDepth > maxDepth) setMaxDepth(campDepth);

    const stats = calculateStats(player);
    setPlayer((prev: any) => ({ ...prev, hp: stats.maxHp, shield: stats.maxShield, statusEffects: [] }));
    saveGame(false);

    // Check for camp story trigger
    const campScript = StoryHandler.checkTriggers(player, 'camp', campDepth, maxDepth, 'camp');
    if (campScript) {
      setCurrentScript(campScript);
    }

    setGameState('camp');
  };

  const returnToVillage = () => {
    const stats = calculateStats(player);
    setPlayer((prev: any) => ({ ...prev, hp: stats.maxHp, shield: stats.maxShield, statusEffects: [] }));
    setGameState('village');
  };

  const encounterMonster = (currentDepth: number) => {
    const newDepth = currentDepth + 1;
    const depthMultiplier = 1 + (newDepth * 0.05);

    let baseMonster;
    let isBoss = false;

    if (BOSS_MONSTERS[newDepth]) {
      baseMonster = BOSS_MONSTERS[newDepth];
      isBoss = true;
    } else {
      const monsterIndex = Math.min(Math.floor(newDepth / 15), MONSTERS.length - 1);
      baseMonster = MONSTERS[monsterIndex];
    }

    const monster = {
      ...baseMonster,
      hp: Math.round(baseMonster.hp * depthMultiplier),
      maxHp: Math.round(baseMonster.hp * depthMultiplier),
      atk: Math.round(baseMonster.atk * depthMultiplier),
      def: Math.round((baseMonster.def || 0) * depthMultiplier),
      speed: Math.min(50, Math.round(baseMonster.speed * (1 + newDepth * 0.002))), // Speed 緩慢增長，上限 50
      gold: Math.round(baseMonster.gold * depthMultiplier),
      exp: Math.round(baseMonster.exp * depthMultiplier),
      isBoss: isBoss,
      statusEffects: [] // Init status
    };

    setCurrentMonster(monster);
    setDepth(newDepth);
    if (newDepth > maxDepth) setMaxDepth(newDepth);

    setPlayerATB(30);
    setMonsterATB(0);
    setSkillCooldown(0);
    setWeaponSkillCooldown(0);

    const stats = calculateStats(player);
    setPlayer((prev: any) => ({ ...prev, shield: stats.maxShield }));

    setBattleLog([]);
    if (isBoss) {
      setBattleLog(prev => [...prev, `⚠️ 深度 ${newDepth} - Boss出現！`, `你遭遇了 ${monster.emoji} ${monster.name}！`]);
    } else {
      setBattleLog(prev => [...prev, `深度 ${newDepth}`, `你遭遇了 ${monster.emoji} ${monster.name}！`]);
    }

    // Check for before_battle story trigger
    const beforeBattleScript = StoryHandler.checkTriggers(player, 'battle', newDepth, maxDepth, 'before_battle');
    if (beforeBattleScript) {
      setCurrentScript(beforeBattleScript);
    }

    setInBattle(true);
    setGameState('battle');
  };

  // --- Actions (Refactored to use BattleHandler) ---

  const performPlayerAttack = () => {
    if (!currentMonster) return;
    const result = BattleHandler.calculatePlayerAttack(player, currentMonster);
    applyBattleResult(result);
  };

  const performWeaponArt = () => {
    if (!currentMonster || !inBattle || weaponSkillCooldown > 0 || !player.weapon) return;
    const result = BattleHandler.calculateWeaponArt(player, currentMonster);
    if (result) applyBattleResult(result);
  };

  const performPlayerSkill = () => {
    if (!currentMonster || !inBattle || skillCooldown > 0) return;
    const result = BattleHandler.calculateClassSkill(player, currentMonster);

    // 處理騎士的特殊擊退邏輯 (State logic)
    if (player.classKey === 'knight') {
      setMonsterATB(prev => Math.max(0, prev - 30));
    }

    applyBattleResult(result);
  };

  const performMonsterAttack = () => {
    if (!player || !inBattle) return;
    const result = BattleHandler.calculateMonsterAttack(player, currentMonster);
    applyBattleResult(result);
  };

  const usePotion = () => {
    if (player.potions <= 0) return;
    const result = BattleHandler.usePotion(player);
    applyBattleResult(result);
  };

  // --- End Actions ---

  const handleMonsterDefeat = () => {
    const goldGain = currentMonster.gold;
    const newGold = player.gold + goldGain;
    const newExp = player.exp + currentMonster.exp;

    setBattleLog(prev => [
      ...prev,
      `${currentMonster.name} 被擊敗了！`,
      `獲得 ${goldGain} 金幣，${currentMonster.exp} 經驗值`
    ]);

    const drops = getMonsterDrops(currentMonster.name);
    drops.forEach(drop => {
      if (Math.random() < drop.rate) {
        addToInventory(drop.item); // Use the helper to handle stacking
        setBattleLog(prev => [...prev, `✨ 獲得: ${getItemDisplayName(drop.item)}！`]);
      }
    });

    let currentLevel = player.level;
    let currentExp = newExp;
    let leveledUp = false;

    while (true) {
      const expNeeded = expToLevel(currentLevel);
      if (currentExp >= expNeeded) {
        currentLevel++;
        currentExp -= expNeeded;
        leveledUp = true;
      } else {
        break;
      }
    }

    if (leveledUp) {
      const levelDiff = currentLevel - player.level;
      setBattleLog(prev => [...prev, `⭐ 升級！等級提升至 ${currentLevel}`, `獲得 ${levelDiff} 點升級點數！`]);

      const stats = calculateStats(player);
      setPlayer((prev: any) => ({
        ...prev,
        gold: newGold,
        exp: currentExp,
        level: currentLevel,
        baseMaxHp: prev.baseMaxHp + (20 * levelDiff),
        hp: Math.min(prev.hp + (20 * levelDiff), stats.maxHp + (20 * levelDiff)),
        statPoints: prev.statPoints + levelDiff,
        statusEffects: [] // Reset status on level up (optional)
      }));
    } else {
      setPlayer((prev: any) => ({ ...prev, gold: newGold, exp: currentExp }));
    }

    setTimeout(() => {
      // Check for after_battle story trigger before transitioning
      const afterBattleScript = StoryHandler.checkTriggers(player, gameState, depth, maxDepth, 'after_battle');
      if (afterBattleScript) {
        setCurrentScript(afterBattleScript);
        setPendingNextEncounter(true); // Mark that we need to proceed after story
        return;
      }

      setCurrentMonster(null);
      const nextEvent = checkNextEvent(depth);
      if (nextEvent.type === 'camp') {
        enterCamp(nextEvent.depth);
      } else {
        encounterMonster(depth);
      }
    }, 2000);
  };

  const flee = () => {
    if (Math.random() < 0.6) {
      setInBattle(false);
      setBattleLog(prev => [...prev, '成功逃跑！返回村莊...']);
      setTimeout(() => {
        setCurrentMonster(null);
        returnToVillage();
      }, 1000);
    } else {
      setBattleLog(prev => [...prev, '逃跑失敗！']);
      setPlayerATB(0);
    }
  };

  const allocateStat = (stat: string) => {
    if (player.statPoints <= 0) return;
    setPlayer((prev: any) => ({
      ...prev,
      [stat]: prev[stat] + 1,
      statPoints: prev.statPoints - 1
    }));
  };

  const resetStats = () => {
    const totalPoints = (player.str - player.baseStr) + (player.agi - player.baseAgi) +
      (player.vit - player.baseVit) + (player.int - player.baseInt);

    setPlayer((prev: any) => ({
      ...prev,
      str: prev.baseStr,
      agi: prev.baseAgi,
      vit: prev.baseVit,
      int: prev.baseInt,
      statPoints: prev.statPoints + totalPoints
    }));
  };

  const buyEquipment = (type: string, item: any) => {
    if (player.gold < item.price) return;
    const oldEquipment = player[type];

    if (oldEquipment) {
      setInventory(prev => [...prev, { ...oldEquipment, type }]);
    }
    // Buying equipment directly equips it in this version of the logic
    setPlayer((prev: any) => ({ ...prev, gold: prev.gold - item.price, [type]: item }));
  };

  const equipItem = (item: any, index: number) => {
    if (item.type === 'material') return; // 素材不能裝備
    const oldEquipment = player[item.type];
    const newInventory = inventory.filter((_, i) => i !== index);
    if (oldEquipment) {
      newInventory.push({ ...oldEquipment, type: item.type });
    }
    setInventory(newInventory);
    setPlayer((prev: any) => ({ ...prev, [item.type]: item }));
  };

  const unequipItem = (type: string) => {
    if (!player[type]) return;
    const item = { ...player[type], type };
    setInventory(prev => [...prev, item]);
    setPlayer((prev: any) => ({ ...prev, [type]: null }));
  };

  const sellItem = (index: number) => {
    const item = inventory[index];
    const sellPrice = Math.round(item.price / 2);

    // Handle Stacking Sell
    if (item.isMaterial && (item.quantity || 1) > 1) {
      const newInventory = [...inventory];
      newInventory[index].quantity! -= 1;
      setInventory(newInventory);
    } else {
      setInventory(inventory.filter((_, i) => i !== index));
    }

    setPlayer((prev: any) => ({ ...prev, gold: prev.gold + sellPrice }));
  };

  // --- Refining & Enchanting Logic ---

  const performRefine = () => {
    if (selectedItemIndex === null || selectedMaterialIndex === null) return;
    const targetItem = inventory[selectedItemIndex];
    const material = inventory[selectedMaterialIndex];
    const cost = 200 + (targetItem.refineLevel || 0) * 100;

    if (player.gold < cost) {
      alert("金幣不足！");
      return;
    }
    if ((targetItem.refineLevel || 0) >= 9) {
      alert("已達強化上限！");
      return;
    }

    const newInventory = [...inventory];

    // Consume material (Stacking logic)
    if ((newInventory[selectedMaterialIndex].quantity || 1) > 1) {
      newInventory[selectedMaterialIndex].quantity! -= 1;
    } else {
      newInventory.splice(selectedMaterialIndex, 1);
      // Adjust item index if needed
      if (selectedMaterialIndex < selectedItemIndex) {
        // This is complicated because indices shift. 
        // Simplest way is to refresh state cleanly or use ID but we don't use unique IDs for inventory yet.
        // Let's rely on finding the item again or just blocking action if tricky.
        // Re-finding the index logic used in previous step:
      }
    }

    // Because splice might shift indices, let's just grab the item *object* from state before splice logic 
    // but modifying state directly is tricky with array indices.
    // Better approach: Modify the item in place in the COPY of the array, then decrement material.

    // Re-fetch clean copy for safety
    const nextInventory = [...inventory];
    const targetItemInArr = nextInventory[selectedItemIndex];
    const materialInArr = nextInventory[selectedMaterialIndex];

    // Update Item
    targetItemInArr.refineLevel = (targetItemInArr.refineLevel || 0) + 1;

    // Consume Material
    if ((materialInArr.quantity || 1) > 1) {
      materialInArr.quantity! -= 1;
    } else {
      nextInventory.splice(selectedMaterialIndex, 1);
    }

    setInventory(nextInventory);
    setPlayer((prev: any) => ({ ...prev, gold: prev.gold - cost }));
    setSelectedItemIndex(null);
    setSelectedMaterialIndex(null);
    alert(`強化成功！ ${getItemDisplayName(targetItemInArr)}`);
  };

  const performEnchant = () => {
    if (selectedItemIndex === null || selectedMaterialIndex === null) return;
    const targetItem = inventory[selectedItemIndex];
    const rune = inventory[selectedMaterialIndex];

    if (!targetItem.slots || targetItem.slots <= 0) {
      alert("該裝備沒有剩餘插槽！");
      return;
    }
    if (!rune.runeAffixId) return;

    const nextInventory = [...inventory];
    const targetItemInArr = nextInventory[selectedItemIndex];
    const materialInArr = nextInventory[selectedMaterialIndex];

    // Update Item
    targetItemInArr.slots = targetItemInArr.slots - 1;
    targetItemInArr.affixes = [...(targetItemInArr.affixes || []), rune.runeAffixId];

    // Consume Material
    if ((materialInArr.quantity || 1) > 1) {
      materialInArr.quantity! -= 1;
    } else {
      nextInventory.splice(selectedMaterialIndex, 1);
    }

    setInventory(nextInventory);
    setSelectedItemIndex(null);
    setSelectedMaterialIndex(null);
    alert(`附魔成功！ ${getItemDisplayName(targetItemInArr)}`);
  };

  // --- Render Components ---

  const SettingsModal = () => {
    if (!showSettings) return null;
    const unlockedSet = new Set(player?.achievements || []);
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-purple-500 rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20} /> 遊戲設置</h2>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
          </div>
          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Volume2 size={16} /> 音量設置</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">0%</span>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                <span className="text-xs text-white font-bold w-8">{volume}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><Trophy size={16} /> 成就列表 ({unlockedSet.size}/{ACHIEVEMENTS.length})</h3>
              <div className="grid grid-cols-1 gap-1.5">
                {ACHIEVEMENTS.map(ach => (
                  <div key={ach.id} className={`p-2 rounded border flex items-center gap-3 ${unlockedSet.has(ach.id) ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-gray-800/40 border-gray-700/30 opacity-60 grayscale'}`}>
                    <div className="text-xl">{ach.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${unlockedSet.has(ach.id) ? 'text-yellow-400' : 'text-gray-400'}`}>{ach.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{ach.desc}</div>
                    </div>
                    {unlockedSet.has(ach.id) && <div className="text-yellow-500 text-[10px] font-bold shrink-0">已解鎖</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* === DEV TOOLS SECTION START (可移除區塊) === */}
            <div className="mt-6 pt-4 border-t border-red-500/30">
              <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">🛠️ 開發者測試工具</h3>
              <div className="space-y-3">
                {/* Level Up */}
                <button
                  onClick={() => {
                    if (!player) return;
                    const newLevel = player.level + 5;
                    setPlayer((prev: any) => ({
                      ...prev,
                      level: newLevel,
                      baseMaxHp: prev.baseMaxHp + 100,
                      statPoints: prev.statPoints + 5,
                    }));
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 p-2 rounded-lg text-white font-bold text-sm transition-all"
                >
                  ⬆️ 提升等級 (+5 Lv)
                </button>
                {/* Add Gold */}
                <button
                  onClick={() => {
                    if (!player) return;
                    setPlayer((prev: any) => ({ ...prev, gold: prev.gold + 10000 }));
                  }}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 p-2 rounded-lg text-white font-bold text-sm transition-all"
                >
                  💰 獲得大量金錢 (+10000)
                </button>
                {/* Custom Start Floor */}
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-2">設定探索起始樓層</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={devStartFloor}
                      onChange={(e) => setDevStartFloor(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                      placeholder="樓層"
                    />
                    <button
                      onClick={() => {
                        if (!player) return;
                        const targetDepth = Math.max(1, devStartFloor);
                        setDepth(targetDepth - 1);
                        setLastCampDepth(targetDepth);
                        if (targetDepth > maxDepth) setMaxDepth(targetDepth);
                        encounterMonster(targetDepth - 1);
                        setShowSettings(false);
                      }}
                      className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-white font-bold text-sm transition-all"
                    >
                      出發
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">將直接開始該樓層戰鬥，並設為營地深度</div>
                </div>
              </div>
            </div>
            {/* === DEV TOOLS SECTION END === */}
          </div>
        </div>
      </div>
    );
  };

  // Main UI Wrapper
  const MainUI = () => {
    // 根據 gameState 渲染對應的畫面，但外層會統一包裹
    // 這裡我們直接修改各個 gameState return 的地方，或者在最外層加 Overlay
    // 因為各個 gameState 的排版差異大，比較好的方式是讓 Overlay 處於最上層（App 層級或這裡）
    // 我們選擇在這裡的最外層添加。
    return null; // Dummy
  };

  // Common Wrapper Render
  const renderGameContent = () => {
    if (!player && gameState === 'class-select') {
      // ... (Keep existing code)
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full border border-purple-500/30 relative">
            <h1 className="text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              ⚔️ Fantasy Adventure RPG
            </h1>
            <p className="text-center text-purple-300 mb-6">選擇你的職業，開始無盡的地下城冒險</p>
            <div className="flex justify-center mb-6">
              <button onClick={loadGame} className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 text-white px-6 py-2 rounded-lg border border-gray-600 transition-all hover:scale-105">
                <Download size={18} /> 讀取上次進度
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(CLASSES).map(([key, cls]) => {
                const skill = CLASS_SKILLS[cls.skillId];
                return (
                  <button key={key} onClick={() => selectClass(key)} className="group relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 p-3 rounded-lg transition-all transform hover:scale-105 border border-purple-400/50 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{cls.emoji}</div>
                        <div className="text-lg font-bold text-white">{cls.name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-purple-200 mb-1 line-clamp-1">{cls.desc}</div>
                    <div className="text-xs text-purple-300 bg-black/20 p-1.5 rounded">
                      技能: <span className="text-yellow-300 font-bold">{skill ? skill.name : '未知'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ... (Keep Game Over and Stats view)
    if (gameState === 'game-over') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-red-500/50 text-center animate-pulse">
            <div className="text-6xl mb-4 text-red-500"><Skull size={64} className="mx-auto" /></div>
            <h2 className="text-3xl font-bold text-red-400 mb-4">你已陣亡</h2>
            <div className="text-gray-300 space-y-2 mb-6 bg-red-900/20 p-4 rounded-lg">
              <p>本次到達深度: <span className="text-white font-bold">{depth}</span></p>
              <p>歷史最大深度: <span className="text-white font-bold">{maxDepth}</span></p>
              <p>最終等級: <span className="text-white font-bold">{player.level}</span></p>
              <p>持有金幣: <span className="text-yellow-400 font-bold">{player.gold}</span></p>
            </div>
            <div className="flex gap-4">
              <button onClick={loadGame} className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold text-white transition-all">讀取存檔</button>
              <button onClick={() => { setPlayer(null); setDepth(0); setMaxDepth(0); setLastCampDepth(0); setInventory([]); setGameState('class-select'); }} className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 px-6 py-3 rounded-lg font-bold text-white transition-all">重新開始</button>
            </div>
          </div>
        </div>
      );
    }

    const stats = player ? calculateStats(player) : null;

    if (gameState === 'stats' && player) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-4 border border-purple-500/30">
              <h2 className="text-3xl font-bold text-purple-300 mb-4 text-center">📊 角色成長</h2>
              <div className="text-center text-yellow-300 text-xl mb-4 bg-purple-900/50 p-2 rounded-lg">剩餘點數: <span className="text-2xl font-bold">{player.statPoints}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ key: 'str', name: 'STR (力量)', desc: '影響物理攻擊、並提供些微防禦', icon: '💪' }, { key: 'agi', name: 'AGI (敏捷)', desc: '影響速度、閃避與暴擊', icon: '⚡' }, { key: 'vit', name: 'VIT (體質)', desc: '增加HP與防禦', icon: '❤️' }, { key: 'int', name: 'INT (智力)', desc: '增加魔法傷害、些微的閃避與暴擊', icon: '🔮' }].map(stat => (
                  <div key={stat.key} className="bg-purple-900/30 p-4 rounded-lg flex items-center justify-between border border-purple-500/20">
                    <div><div className="text-white font-bold text-lg flex items-center gap-2">{stat.icon} {stat.name}</div><div className="text-purple-300 text-xs mt-1">{stat.desc}</div></div>
                    <div className="flex items-center gap-3"><span className="text-2xl font-bold">{player[stat.key]}</span><button onClick={() => allocateStat(stat.key)} disabled={player.statPoints <= 0} className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${player.statPoints > 0 ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>+</button></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <div className="text-blue-300 font-bold mb-3 border-b border-blue-500/30 pb-2">當前綜合能力</div>
                <div className="grid grid-cols-3 gap-4 text-sm text-white text-center">
                  <div className="bg-black/20 p-2 rounded"><div className="text-gray-400 text-xs">物理攻擊</div><div className="text-lg font-bold">{stats.atk}</div></div>
                  <div className="bg-black/20 p-2 rounded"><div className="text-gray-400 text-xs">魔法攻擊</div><div className="text-lg font-bold">{stats.matk}</div></div>
                  <div className="bg-black/20 p-2 rounded"><div className="text-gray-400 text-xs">防禦力</div><div className="text-lg font-bold">{stats.def}</div></div>
                  <div className="bg-black/20 p-2 rounded"><div className="text-gray-400 text-xs">速度</div><div className="text-lg font-bold">{stats.speed}</div></div>
                  <div className="bg-black/20 p-2 rounded"><div className="text-gray-400 text-xs">最大HP</div><div className="text-lg font-bold">{stats.maxHp}</div></div>
                  <div className="bg-black/20 p-2 rounded"><div className="text-gray-400 text-xs">護盾上限</div><div className="text-lg font-bold">{stats.maxShield}</div></div>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button onClick={resetStats} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-300 py-3 rounded-lg text-sm border border-red-900 transition-all">重置</button>
                <button onClick={() => setGameState(previousState)} className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 py-3 rounded-lg font-bold text-white transition-all shadow-lg">完成</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Village Inventory needs to show Quantity
    if (gameState === 'village' && player) {
      const classData = CLASSES[player.classKey];
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 p-4">
          <SettingsModal />
          <div className="max-w-4xl mx-auto">
            {/* ... (Header and Stats Section - Same as existing) */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 mb-4 border border-green-500/30 shadow-lg relative z-30">
              <div className="flex justify-between items-start mb-4 border-b border-green-500/20 pb-2">
                <div><div className="text-2xl font-bold text-green-300 flex items-center gap-2"><span>{classData.emoji}</span>{player.class}<span className="text-sm bg-green-800 text-white px-2 py-0.5 rounded-full">Lv.{player.level}</span></div></div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-1.5 bg-yellow-900/40 px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-300 mr-2"><Coins size={14} /><span className="font-bold text-sm">{player.gold}</span></div>
                  <button onClick={() => saveGame(true)} className="flex items-center gap-1 bg-blue-600/50 hover:bg-blue-600 px-3 py-1.5 rounded text-sm text-white transition-all"><Save size={16} /></button>
                  <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all"><Settings size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm mb-4">
                <div className="bg-red-900/30 p-1.5 rounded-lg border border-red-500/20"><div className="flex items-center gap-1 text-red-300 text-[10px] mb-0.5"><Heart className="w-3 h-3" /> HP</div><div className="text-white font-bold text-sm">{player.hp}<span className="text-[10px] text-gray-400">/{stats.maxHp}</span></div></div>
                <div className="bg-blue-900/30 p-1.5 rounded-lg border border-blue-500/20"><div className="flex items-center gap-1 text-blue-300 text-[10px] mb-0.5"><Shield className="w-3 h-3" /> Shield</div><div className="text-white font-bold text-sm">{player.shield}<span className="text-[10px] text-gray-400">/{stats.maxShield}</span></div></div>
                <div className="bg-orange-900/30 p-1.5 rounded-lg border border-orange-500/20"><div className="flex items-center gap-1 text-orange-300 text-[10px] mb-0.5"><Sword className="w-3 h-3" /> ATK</div><div className="text-white font-bold text-sm">{stats.atk}</div></div>
                <div className="bg-purple-900/30 p-1.5 rounded-lg border border-purple-500/20"><div className="flex items-center gap-1 text-purple-300 text-[10px] mb-0.5"><Sparkles className="w-3 h-3" /> MATK</div><div className="text-white font-bold text-sm">{stats.matk}</div></div>
                <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-500/20"><div className="flex items-center gap-1 text-slate-300 text-[10px] mb-0.5"><Shield className="w-3 h-3" /> DEF</div><div className="text-white font-bold text-sm">{stats.def}</div></div>
                <div className="bg-cyan-900/30 p-1.5 rounded-lg border border-cyan-500/20"><div className="flex items-center gap-1 text-cyan-300 text-[10px] mb-0.5"><Wind className="w-3 h-3" /> SPD</div><div className="text-white font-bold text-sm">{stats.speed}</div></div>
              </div>
              <div className="relative pt-1">
                <div className="flex justify-between text-xs text-green-300 mb-1"><span>EXP</span><span>{Math.floor((player.exp / expToLevel(player.level)) * 100)}% <span className="text-gray-400">({player.exp}/{expToLevel(player.level)})</span></span></div>
                <div className="bg-green-900/30 rounded-full h-1.5 overflow-hidden"><div className="bg-green-400 h-full transition-all duration-300 shadow-[0_0_10px_rgba(74,222,128,0.5)]" style={{ width: `${(player.exp / expToLevel(player.level)) * 100}%` }} /></div>
              </div>
              <div className="mt-4 pt-3 border-t border-green-500/20">
                <div className="text-xs text-green-300 mb-2 font-bold">目前裝備</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 p-2 rounded border border-gray-700/50 flex justify-between items-center relative group">
                    <div className="flex items-center gap-2 overflow-hidden"><div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-lg">⚔️</div><div className="min-w-0"><div className="text-xs text-gray-400">主手武器</div><div className="font-bold text-sm text-white truncate">{player.weapon ? getItemDisplayName(player.weapon) : '無裝備'}</div></div></div>
                    {player.weapon && <button onClick={() => unequipItem('weapon')} className="text-red-400 hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="卸下"><MinusCircle size={16} /></button>}
                    {player.weapon?.skill && (<div className="absolute top-full left-0 mt-1 w-full bg-gray-900 p-2 rounded text-[10px] text-gray-300 border border-gray-700 z-50 hidden group-hover:block pointer-events-none shadow-xl"><div className="text-yellow-300 font-bold mb-1">{player.weapon.skill.name}</div>{player.weapon.skill.desc}</div>)}
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-gray-700/50 flex justify-between items-center relative group">
                    <div className="flex items-center gap-2 overflow-hidden"><div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-lg">🛡️</div><div className="min-w-0"><div className="text-xs text-gray-400">身體防具</div><div className="font-bold text-sm text-white truncate">{player.armor ? getItemDisplayName(player.armor) : '無裝備'}</div></div></div>
                    {player.armor && <button onClick={() => unequipItem('armor')} className="text-red-400 hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="卸下"><MinusCircle size={16} /></button>}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 mb-2 border border-green-500/30 flex items-center justify-center gap-3 relative z-10">
              <div className="text-3xl animate-bounce">🏘️</div>
              <div><h2 className="text-xl font-bold text-green-300">冒險者村莊</h2><p className="text-green-200 text-xs">深度紀錄: {maxDepth}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setGameState('explore-choice')} className="group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 p-3 rounded-xl transition-all transform hover:scale-105 border border-red-400/50 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div><div className="text-2xl mb-1">⚔️</div><div className="text-lg font-bold text-white">探索地下城</div><div className="text-red-200 text-xs mt-0.5">出發冒險！</div>
              </button>
              <button onClick={() => { setPreviousState('village'); setGameState('stats'); }} className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 p-3 rounded-xl transition-all transform hover:scale-105 border border-indigo-400/50 shadow-lg">
                <div className="text-2xl mb-1">📊</div><div className="text-lg font-bold text-white">素質配點</div>
                {player.statPoints > 0 && <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">+{player.statPoints}</div>}
              </button>
              <button
                onClick={() => { if (player.flags?.smith_rescued) { setPreviousState('village'); setGameState('shop'); } }}
                disabled={!player.flags?.smith_rescued}
                className={`p-3 rounded-xl transition-all transform border shadow-lg ${player.flags?.smith_rescued
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 hover:scale-105 border-yellow-400/50'
                  : 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'}`}
              >
                <div className="text-2xl mb-1">🏪</div>
                <div className="text-lg font-bold text-white">前往商店</div>
                {!player.flags?.smith_rescued && <div className="text-gray-400 text-xs mt-0.5">🔒 尚未解鎖</div>}
              </button>
              <button onClick={() => setShowInventory(!showInventory)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 p-3 rounded-xl transition-all transform hover:scale-105 border border-purple-400/50 shadow-lg">
                <div className="text-2xl mb-1">📦</div><div className="text-lg font-bold text-white">背包</div><div className="text-purple-200 text-xs mt-0.5">道具: {inventory.length}</div>
              </button>
            </div>
            {showInventory && inventory.length > 0 && (
              <div className="mt-3 bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-purple-500/30 animate-in slide-in-from-bottom-5">
                <h3 className="text-lg font-bold text-purple-300 mb-2">📦 道具箱</h3>
                <div className="grid gap-2">
                  {inventory.map((item, index) => (
                    <div key={index} className="bg-purple-900/20 p-2 rounded-lg flex justify-between items-center border border-purple-500/10">
                      <div className="text-white text-sm">
                        {item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💎'}
                        <span className="font-bold ml-1">{getItemDisplayName(item)}</span>
                        {(item.quantity || 1) > 1 && <span className="text-yellow-400 font-bold ml-1">x{item.quantity}</span>}
                        {!item.isMaterial && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({item.type === 'weapon' ? `攻+${getRefinedStat(item.atk, item.refineLevel)}` : `防+${getRefinedStat(item.def, item.refineLevel)}`})
                          </span>
                        )}
                        {getEquipmentComparison(item)}
                      </div>
                      {!item.isMaterial && (
                        <button onClick={() => equipItem(item, index)} className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-white font-bold">裝備</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ... (Explore Choice, Camp View, Battle View - No changes needed except passing props if necessary, but we are using state so it's fine)
    // ... (Keep Explore, Camp, Battle from previous code)

    if (gameState === 'explore-choice') {
      // Helper to start from specific depth
      const startFromDepth = (targetDepth: number) => {
        setDepth(targetDepth - 1);
        setLastCampDepth(targetDepth);
        encounterMonster(targetDepth - 1);
      };

      // Shortcut unlock conditions
      const shortcuts = [
        { depth: 101, flag: 'floor_100_cleared', label: '深度 101' },
        { depth: 201, flag: 'floor_200_cleared', label: '深度 201' },
        { depth: 301, flag: 'floor_300_cleared', label: '深度 301' },
        { depth: 401, flag: 'floor_400_cleared', label: '深度 401' },
        { depth: 501, flag: 'floor_500_cleared', label: '深度 501 (無盡)' },
      ];

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 flex items-center justify-center">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 max-w-2xl w-full border border-purple-500/30">
            <h2 className="text-3xl font-bold text-center text-purple-300 mb-6">選擇出發點</h2>
            <div className="space-y-4">
              <button onClick={() => startExploration(false)} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 p-6 rounded-xl transition-all transform hover:scale-105 border border-blue-400/50 text-left flex items-center gap-4">
                <div className="text-4xl">🚪</div><div><div className="text-2xl font-bold text-white">從入口出發</div><div className="text-blue-200 text-sm">適合刷低等怪物與素材</div></div>
              </button>
              {lastCampDepth > 0 && (
                <button onClick={() => startExploration(true)} className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 p-6 rounded-xl transition-all transform hover:scale-105 border border-green-400/50 text-left flex items-center gap-4">
                  <div className="text-4xl">🏕️</div><div><div className="text-2xl font-bold text-white">從營地出發</div><div className="text-green-200 text-sm">直接前往深度 {lastCampDepth}</div></div>
                </button>
              )}

              {/* Dungeon Shortcuts */}
              {shortcuts.some(s => player.flags?.[s.flag as keyof GameFlags]) && (
                <div className="border-t border-purple-500/30 pt-4 mt-4">
                  <h3 className="text-sm font-bold text-purple-400 mb-3">⚡ 快捷傳送</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {shortcuts.map(shortcut => {
                      const isUnlocked = player.flags?.[shortcut.flag as keyof GameFlags];
                      return (
                        <button
                          key={shortcut.depth}
                          onClick={() => isUnlocked && startFromDepth(shortcut.depth)}
                          disabled={!isUnlocked}
                          className={`p-3 rounded-lg text-left border transition-all ${isUnlocked
                            ? 'bg-purple-900/50 hover:bg-purple-800/70 border-purple-500/50 hover:scale-105'
                            : 'bg-gray-800/50 border-gray-700/50 opacity-40 cursor-not-allowed'}`}
                        >
                          <div className="font-bold text-white text-sm">{shortcut.label}</div>
                          {!isUnlocked && <div className="text-gray-500 text-xs">🔒 未解鎖</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => setGameState('village')} className="w-full bg-gray-700 hover:bg-gray-600 p-4 rounded-xl transition-all border border-gray-500 text-white font-bold">返回村莊</button>
            </div>
          </div>
        </div>
      );
    }

    if (gameState === 'camp' && player) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-emerald-900 p-4">
          <SettingsModal />
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-4 border border-green-500/30 text-center relative">
              <button onClick={() => setShowSettings(true)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all"><Settings size={18} /></button>
              <div className="text-6xl mb-2">🏕️</div>
              <h2 className="text-3xl font-bold text-green-300 mb-2">休息營地</h2>
              <p className="text-green-200">當前深度 {depth}</p>
              <div className="mt-4 flex justify-center gap-2">
                <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded text-sm">✅ HP 全滿</span>
                <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded text-sm">✅ 護盾 全滿</span>
                <span className="bg-yellow-900/50 text-yellow-300 px-3 py-1 rounded text-sm">✅ 進度已保存</span>
              </div>
            </div>
            <div className="space-y-4">
              <button onClick={() => { const nextEvent = checkNextEvent(depth); if (nextEvent.type === 'camp') { enterCamp(nextEvent.depth); } else { encounterMonster(depth); } }} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 p-6 rounded-xl transition-all transform hover:scale-105 border border-red-400/50 flex items-center justify-center gap-3">
                <div className="text-3xl">⚔️</div><div className="text-2xl font-bold text-white">繼續深入地下城</div>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={() => { setPreviousState('camp'); setGameState('stats'); }} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 p-4 rounded-xl transition-all font-bold text-white border border-indigo-400/50">📊 素質配點</button>
                <button onClick={() => { setPreviousState('camp'); setGameState('shop'); }} className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 p-4 rounded-xl transition-all font-bold text-white border border-yellow-400/50">🏪 開啟商店</button>
                <button onClick={returnToVillage} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 p-4 rounded-xl transition-all font-bold text-white border border-blue-400/50">🏘️ 回到村莊</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (gameState === 'battle' && player && currentMonster) {
      const classData = CLASSES[player.classKey];
      const activeSkill = CLASS_SKILLS[classData.skillId];
      const weaponArt = player.weapon ? WEAPON_ARTS[player.weapon.category] : null;

      return (
        <div className={`min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-gray-900 p-4 ${screenShake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
          <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-1deg); }
                    75% { transform: translateX(5px) rotate(1deg); }
                }
            `}</style>
          <SettingsModal />

          <div className="absolute top-4 right-4 z-[60]">
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg bg-black/50 hover:bg-black/70 border border-gray-600 text-gray-300 hover:text-white transition-all backdrop-blur-md">
              <Settings size={20} />
            </button>
          </div>

          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {floatingTexts.map(ft => (
              <div key={ft.id} className={`absolute left-0 top-0 ${ft.color} ${ft.size} font-bold transition-all duration-1000 ease-out`} style={{ left: `${ft.x}%`, top: `${ft.y}%`, transform: 'translate(-50%, -50%)', opacity: 0, animation: 'floatUp 0.8s forwards' }}>
                <style>{`
                            @keyframes floatUp {
                                0% { opacity: 1; margin-top: 0px; transform: translate(-50%, -50%) scale(0.8); }
                                20% { opacity: 1; margin-top: -20px; transform: translate(-50%, -50%) scale(1.5); }
                                100% { opacity: 0; margin-top: -60px; transform: translate(-50%, -50%) scale(1); }
                            }
                        `}</style>
                {ft.text}
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto relative h-full flex flex-col">

            <div className={`mt-8 backdrop-blur-sm rounded-xl p-6 mb-4 text-center transition-all duration-300 relative shrink-0 ${currentMonster.isBoss ? 'bg-red-950/80 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-105' : 'bg-black/40 border border-red-500/30'} ${monsterShake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
              <div className={`absolute inset-0 bg-white mix-blend-overlay transition-opacity duration-100 rounded-xl pointer-events-none ${hitFlash ? 'opacity-40' : 'opacity-0'}`}></div>
              <div className="text-8xl mb-2 animate-[bounce_3s_infinite] relative">{currentMonster.emoji}</div>

              <div className="max-w-md mx-auto relative z-10">
                <div className={`text-2xl font-bold mb-1 ${currentMonster.isBoss ? 'text-red-400' : 'text-gray-200'}`}>{currentMonster.isBoss && '💀 '}{currentMonster.name}{currentMonster.isBoss && ' 💀'}</div>

                {/* 怪物狀態列 - 固定高度含 ATK */}
                <div className="flex justify-center items-center gap-2 mb-2 h-6">
                  <div className="text-xs text-orange-400 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-orange-500/20"><Sword className="w-3 h-3" /> {currentMonster.atk}</div>
                  {currentMonster.statusEffects && currentMonster.statusEffects.map((effect: StatusEffect, i: number) => (
                    <StatusIcon key={i} effect={effect} />
                  ))}
                </div>

                <div className="relative h-6 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                  <div className={`absolute top-0 left-0 h-full transition-all duration-300 ${currentMonster.isBoss ? 'bg-gradient-to-r from-red-600 to-purple-600' : 'bg-gradient-to-r from-red-500 to-orange-500'}`} style={{ width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%` }} />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white shadow-black drop-shadow-md">{currentMonster.hp} / {currentMonster.maxHp}</div>
                </div>
                <div className="mt-2 flex flex-col items-center">
                  <div className="flex items-center gap-2 justify-center w-full">
                    <Zap size={14} className="text-yellow-400" />
                    <div className="w-full max-w-[200px] h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 transition-all duration-100" style={{ width: `${monsterATB}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref={battleLogRef} className="h-48 bg-black/60 backdrop-blur-md rounded-lg p-2 mb-2 border-t border-b border-white/10 overflow-y-auto text-center custom-scrollbar">
              {battleLog.map((log, i) => (<div key={i} className="text-gray-300 text-sm py-0.5">{log}</div>))}
            </div>

            <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 mb-2 border border-white/10 shrink-0">
              <div className="flex justify-between items-center mb-1">
                <div className="flex flex-col">
                  <div className="text-white font-bold text-lg flex items-center gap-2">
                    {player.class} <span className="text-sm text-gray-400">Lv.{player.level}</span>
                    {/* 玩家異常狀態 icon - 顯示在等級右方 */}
                    {player.statusEffects && player.statusEffects.length > 0 && (
                      <div className="flex gap-1 ml-1">
                        {player.statusEffects.map((effect: StatusEffect, i: number) => (
                          <StatusIcon key={i} effect={effect} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-300"><span className="flex items-center gap-0.5 text-orange-300"><Sword size={10} />{stats.atk}</span><span className="flex items-center gap-0.5 text-purple-300"><Sparkles size={10} />{stats.matk}</span><span className="flex items-center gap-0.5 text-slate-300"><Shield size={10} />{stats.def}</span></div>
                </div>
                <div className="w-1/3 max-w-[120px]">
                  <div className="flex justify-between text-[10px] text-yellow-400 mb-0.5"><span>ATB</span><span>{Math.floor(playerATB)}%</span></div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden border border-yellow-900/50">
                    <div className={`h-full transition-all duration-100 ${playerATB >= 100 ? 'bg-yellow-400 animate-pulse' : 'bg-yellow-500'}`} style={{ width: `${Math.min(playerATB, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="w-full mb-1">
                <div className="flex justify-between text-xs text-blue-300 mb-0.5"><span className="flex items-center gap-1"><Shield size={12} /> 護盾</span><span>{player.shield}/{stats.maxShield}</span></div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-blue-900/50">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.min((player.shield / stats.maxShield) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="w-full">
                <div className="flex justify-between text-xs text-red-300 mb-0.5"><span className="flex items-center gap-1"><Heart size={12} /> HP</span><span>{player.hp}/{stats.maxHp}</span></div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-red-900/50 relative">
                  <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" style={{ width: `${Math.min((player.hp / stats.maxHp) * 100, 100)}%` }} />
                  {player.hp < stats.maxHp * 0.3 && (<div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>)}
                </div>
                <div className="w-full mt-1">
                  <div className="flex justify-between text-[10px] text-green-300 mb-0.5"><span>EXP</span><span>{Math.floor((player.exp / expToLevel(player.level)) * 100)}% <span className="text-gray-500">({player.exp}/{expToLevel(player.level)})</span></span></div>
                  <div className="bg-green-900/30 rounded-full h-1 overflow-hidden">
                    <div className="bg-green-400 h-full transition-all duration-300" style={{ width: `${(player.exp / expToLevel(player.level)) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto bg-gray-900/80 backdrop-blur-md rounded-t-2xl p-4 border-t-2 border-blue-500/50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] shrink-0">
              <div className="grid grid-cols-4 gap-2 h-16">
                <button onClick={performPlayerSkill} disabled={skillCooldown > 0} className={`col-span-1 rounded-lg flex flex-col items-center justify-center border transition-all relative overflow-hidden ${skillCooldown <= 0 ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}`}>
                  <Zap size={20} className={skillCooldown > 0 ? 'text-gray-500' : 'text-yellow-300'} />
                  <span className="text-[10px] sm:text-xs font-bold mt-1 line-clamp-1">{activeSkill ? activeSkill.name : '技能'}</span>
                  {skillCooldown > 0 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xl font-bold text-white">{skillCooldown.toFixed(1)}</div>)}
                </button>

                <button onClick={performWeaponArt} disabled={weaponSkillCooldown > 0 || !weaponArt} className={`col-span-1 rounded-lg flex flex-col items-center justify-center border transition-all relative overflow-hidden ${!weaponArt ? 'bg-gray-900/50 border-gray-800 text-gray-700' : weaponSkillCooldown <= 0 ? 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}`}>
                  {weaponArt ? (
                    <>
                      <div className={weaponSkillCooldown > 0 ? 'text-gray-500' : 'text-white'}>{weaponArt.icon}</div>
                      <span className="text-[10px] sm:text-xs font-bold mt-1 line-clamp-1">{weaponArt.name}</span>
                      {weaponSkillCooldown > 0 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xl font-bold text-white">{weaponSkillCooldown.toFixed(1)}</div>)}
                    </>
                  ) : (<><Sword size={20} className="text-gray-700" /><span className="text-[10px] text-gray-600 mt-1">無戰技</span></>)}
                </button>

                <button onClick={usePotion} disabled={player.potions <= 0} className={`col-span-1 rounded-lg flex flex-col items-center justify-center border transition-all ${player.potions > 0 ? 'bg-green-700 hover:bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                  <div className="relative"><Heart size={20} /><span className="absolute -bottom-2 -right-2 bg-black text-white text-xs px-1 rounded-full">{player.potions}</span></div>
                  <span className="text-xs mt-1">藥水</span>
                </button>

                <button onClick={flee} className="col-span-1 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center justify-center border border-gray-500 text-gray-300">
                  <div className="text-xl">🏃</div><span className="text-xs mt-1">逃跑</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 8. 商店畫面 (Updated with Tabs and Un-equip)
    if (gameState === 'shop' && player) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-4 border border-yellow-500/30 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-yellow-300">🏪 冒險者商店</h2>
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-yellow-500/30"><Coins className="w-5 h-5 text-yellow-400" /><span className="text-xl font-bold text-yellow-100">{player.gold}</span></div>
            </div>

            {/* Shop Tabs */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setShopTab('buy')} className={`flex-1 py-2 rounded-lg font-bold ${shopTab === 'buy' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>購買</button>
              <button onClick={() => setShopTab('sell')} className={`flex-1 py-2 rounded-lg font-bold ${shopTab === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>出售</button>
              <button
                onClick={() => player.flags?.floor_100_cleared && setShopTab('refine')}
                disabled={!player.flags?.floor_100_cleared}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${!player.flags?.floor_100_cleared
                  ? 'bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
                  : shopTab === 'refine' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                <Hammer size={16} /> 強化 {!player.flags?.floor_100_cleared && '🔒'}
              </button>
              <button
                onClick={() => player.flags?.floor_200_cleared && setShopTab('enchant')}
                disabled={!player.flags?.floor_200_cleared}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${!player.flags?.floor_200_cleared
                  ? 'bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
                  : shopTab === 'enchant' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                <Gem size={16} /> 附魔 {!player.flags?.floor_200_cleared && '🔒'}
              </button>
            </div>

            {/* Equipped Items (Always visible for quick unequip) */}
            <div className="mb-4 bg-gray-900/50 p-3 rounded-xl border border-gray-700">
              <h3 className="text-sm font-bold text-gray-400 mb-2">目前裝備 (點擊卸下)</h3>
              <div className="flex gap-2">
                {player.weapon ? (
                  <button onClick={() => unequipItem('weapon')} className="flex-1 bg-gray-800 p-2 rounded flex items-center justify-between border border-gray-600 hover:bg-red-900/50 hover:border-red-500 transition-colors group">
                    <span className="text-sm text-white font-bold">{getItemDisplayName(player.weapon)}</span>
                    <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100">卸下</span>
                  </button>
                ) : <div className="flex-1 bg-black/20 p-2 rounded text-center text-gray-600 text-sm border border-gray-800">無主手</div>}

                {player.armor ? (
                  <button onClick={() => unequipItem('armor')} className="flex-1 bg-gray-800 p-2 rounded flex items-center justify-between border border-gray-600 hover:bg-red-900/50 hover:border-red-500 transition-colors group">
                    <span className="text-sm text-white font-bold">{getItemDisplayName(player.armor)}</span>
                    <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100">卸下</span>
                  </button>
                ) : <div className="flex-1 bg-black/20 p-2 rounded text-center text-gray-600 text-sm border border-gray-800">無防具</div>}
              </div>
            </div>

            {/* BUY TAB */}
            {shopTab === 'buy' && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-orange-500/30">
                  <h3 className="text-xl font-bold text-orange-300 mb-3 sticky top-0 bg-black/80 p-2 rounded z-10">⚔️ 強力武裝</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {EQUIPMENT.weapons.map((weapon, i) => (
                      <button key={i} onClick={() => buyEquipment('weapon', weapon)} disabled={player.gold < weapon.price} className={`w-full p-3 rounded-lg text-left transition-all border relative overflow-hidden ${player.gold >= weapon.price ? 'bg-orange-900/40 hover:bg-orange-800/60 border-orange-500/50' : 'bg-gray-800/40 border-gray-700/50 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-1 relative z-10"><div><div className="font-bold text-white flex items-center">{weapon.name}{getEquipmentComparison({ ...weapon, type: 'weapon' })}</div><div className="text-sm text-orange-200">攻擊 +{weapon.atk}</div></div><div className="text-yellow-300 font-bold">{weapon.price}G</div></div>
                        {weapon.skill && (<div className="text-xs text-purple-300 mt-1 bg-purple-900/30 p-1.5 rounded inline-block mr-1">⚡ {weapon.skill.desc}</div>)}
                        {/* @ts-ignore */}
                        <div className="text-xs text-orange-300 mt-1 bg-orange-900/30 p-1.5 rounded inline-block">⚔️ {WEAPON_ARTS[weapon.category].name}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                  <h3 className="text-xl font-bold text-blue-300 mb-3 sticky top-0 bg-black/80 p-2 rounded z-10">🛡️ 防具護甲</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {EQUIPMENT.armor.map((armor, i) => (
                      <button key={i} onClick={() => buyEquipment('armor', armor)} disabled={player.gold < armor.price} className={`w-full p-3 rounded-lg text-left transition-all border ${player.gold >= armor.price ? 'bg-blue-900/40 hover:bg-blue-800/60 border-blue-500/50' : 'bg-gray-800/40 border-gray-700/50 opacity-60'}`}>
                        <div className="flex justify-between items-center"><div><div className="font-bold text-white flex items-center">{armor.name}{getEquipmentComparison({ ...armor, type: 'armor' })}</div><div className="text-sm text-blue-200">防禦 +{armor.def}</div></div><div className="text-yellow-300 font-bold">{armor.price}G</div></div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-500/30">
                    <button onClick={() => { if (player.gold >= 50) { setPlayer((prev: any) => ({ ...prev, gold: prev.gold - 50, potions: prev.potions + 1 })); } }} disabled={player.gold < 50} className={`w-full p-3 rounded-xl border flex items-center justify-between ${player.gold >= 50 ? 'bg-green-900/40 border-green-500/50 hover:bg-green-800/60' : 'bg-gray-800 border-gray-700 opacity-50'}`}>
                      <div className="text-left"><div className="text-white font-bold">生命藥水</div><div className="text-xs text-green-300">恢復 50% HP</div></div><div className="text-yellow-300 font-bold">50G</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SELL TAB */}
            {shopTab === 'sell' && (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
                <h3 className="text-xl font-bold text-red-300 mb-3">💰 收購區</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {inventory.length === 0 ? <div className="text-gray-500 text-center py-4">背包是空的</div> : inventory.map((item, index) => (
                    <div key={index} className="bg-red-900/20 p-2 rounded-lg flex justify-between items-center border border-red-500/10">
                      <div className="text-white text-sm">
                        {getItemDisplayName(item)}
                        {(item.quantity || 1) > 1 && <span className="text-yellow-400 font-bold ml-1">x{item.quantity}</span>}
                        {getEquipmentComparison(item)}
                      </div>
                      <button onClick={() => sellItem(index)} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-white text-xs font-bold transition-all">賣出 {Math.round(item.price / 2)}G</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REFINE TAB */}
            {shopTab === 'refine' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                  <h3 className="text-lg font-bold text-blue-300 mb-2">1. 選擇裝備</h3>
                  <p className="text-xs text-gray-400 mb-2">⚠️ 裝備中的物品必須卸下才能進行強化喔!</p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {inventory.filter(i => !i.isMaterial && (i.refineLevel || 0) < 9).map((item, idx) => {
                      // Since we filtered, we need to find the real index in inventory
                      const realIndex = inventory.indexOf(item);
                      return (
                        <button key={realIndex} onClick={() => setSelectedItemIndex(realIndex)} className={`w-full p-2 rounded text-left border ${selectedItemIndex === realIndex ? 'bg-blue-600 border-blue-400' : 'bg-gray-800 border-gray-700'}`}>
                          <div className="font-bold">{getItemDisplayName(item)}</div>
                          <div className="text-xs text-gray-400">目前強化: +{item.refineLevel || 0}</div>
                        </button>
                      );
                    })}
                    {inventory.filter(i => !i.isMaterial && (i.refineLevel || 0) < 9).length === 0 && <div className="text-gray-500 text-sm">沒有可強化的裝備</div>}
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                  <h3 className="text-lg font-bold text-blue-300 mb-2">2. 選擇強化石</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {inventory.filter(i => i.materialType === 'refine_stone').map((item, idx) => {
                      const realIndex = inventory.indexOf(item);
                      return (
                        <button key={realIndex} onClick={() => setSelectedMaterialIndex(realIndex)} className={`w-full p-2 rounded text-left border ${selectedMaterialIndex === realIndex ? 'bg-blue-600 border-blue-400' : 'bg-gray-800 border-gray-700'}`}>
                          <div className="font-bold">{item.name} <span className="text-yellow-400 ml-1">x{item.quantity || 1}</span></div>
                          <div className="text-xs text-gray-400">用於強化裝備</div>
                        </button>
                      )
                    })}
                    {inventory.filter(i => i.materialType === 'refine_stone').length === 0 && <div className="text-gray-500 text-sm">沒有強化石</div>}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    {selectedItemIndex !== null && selectedMaterialIndex !== null ? (
                      <div className="text-center">
                        <div className="text-sm text-gray-300 mb-2">
                          消耗: <span className="text-yellow-400 font-bold">{200 + (inventory[selectedItemIndex].refineLevel || 0) * 100}G</span> + 強化石 x1
                        </div>
                        <button onClick={performRefine} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">
                          開始強化 (+10% 數值)
                        </button>
                      </div>
                    ) : <div className="text-center text-gray-500 text-sm">請選擇裝備與素材</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ENCHANT TAB */}
            {shopTab === 'enchant' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                  <h3 className="text-lg font-bold text-purple-300 mb-2">1. 選擇有孔裝備</h3>
                  <p className="text-xs text-gray-400 mb-2">⚠️ 裝備中的物品必須卸下才能進行附魔喔!</p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {inventory.filter(i => !i.isMaterial && (i.slots || 0) > 0).map((item, idx) => {
                      const realIndex = inventory.indexOf(item);
                      return (
                        <button key={realIndex} onClick={() => setSelectedItemIndex(realIndex)} className={`w-full p-2 rounded text-left border ${selectedItemIndex === realIndex ? 'bg-purple-600 border-purple-400' : 'bg-gray-800 border-gray-700'}`}>
                          <div className="font-bold">{getItemDisplayName(item)}</div>
                          <div className="text-xs text-gray-400">剩餘插槽: {item.slots}</div>
                        </button>
                      );
                    })}
                    {inventory.filter(i => !i.isMaterial && (i.slots || 0) > 0).length === 0 && <div className="text-gray-500 text-sm">沒有可附魔的裝備</div>}
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                  <h3 className="text-lg font-bold text-purple-300 mb-2">2. 選擇符文石</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {inventory.filter(i => i.materialType === 'rune_stone').map((item, idx) => {
                      const realIndex = inventory.indexOf(item);
                      return (
                        <button key={realIndex} onClick={() => setSelectedMaterialIndex(realIndex)} className={`w-full p-2 rounded text-left border ${selectedMaterialIndex === realIndex ? 'bg-purple-600 border-purple-400' : 'bg-gray-800 border-gray-700'}`}>
                          <div className="font-bold">{item.name} <span className="text-yellow-400 ml-1">x{item.quantity || 1}</span></div>
                          <div className="text-xs text-gray-400">{item.desc}</div>
                        </button>
                      )
                    })}
                    {inventory.filter(i => i.materialType === 'rune_stone').length === 0 && <div className="text-gray-500 text-sm">沒有符文石</div>}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    {selectedItemIndex !== null && selectedMaterialIndex !== null ? (
                      <div className="text-center">
                        <button onClick={performEnchant} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold">
                          開始附魔 (消耗 1 插槽)
                        </button>
                      </div>
                    ) : <div className="text-center text-gray-500 text-sm">請選擇裝備與素材</div>}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-center">
              <button onClick={() => { setGameState(previousState); setShopTab('buy'); }} className="px-8 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold">離開商店</button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // 外層包裹，負責處理對話層顯示
  return (
    <div className={`antialiased text-gray-100 ${currentScript ? 'overflow-hidden h-screen' : ''}`}>
      {/* 主要遊戲內容，若有對話則變暗模糊 */}
      <div className={`transition-all duration-500 ${currentScript ? 'filter blur-sm brightness-50 pointer-events-none' : ''}`}>
        {renderGameContent()}
      </div>

      {/* 對話層 */}
      {currentScript && (
        <DialogueOverlay
          lines={currentScript.lines}
          onComplete={handleStoryComplete}
          onNameSubmit={(name) => {
            setPlayer((prev: any) => ({ ...prev, name }));
          }}
        />
      )}
    </div>
  );
}
