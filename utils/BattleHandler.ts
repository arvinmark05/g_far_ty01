
import { calculateStats, getRefinedStat, calculateDamage } from './gameFormulas';
import { CLASS_SKILLS, WEAPON_ARTS } from '../data/skills';
import { CLASSES } from '../data/classes';
import { FloatingText, StatusEffect, StatusType, BuffEffect, BuffType, Item, Skill } from '../types';
import { AFFIXES } from '../data/affixes';

export interface BattleResult {
    playerUpdates?: Partial<any>; // hp, shield, maxDamage...
    monsterUpdates?: Partial<any>; // hp...
    logs: string[];
    floatingTexts: { text: string, type: 'damage' | 'heal' | 'crit' | 'miss' | 'shield' | 'poison' | 'burn' | 'stun' | 'frozen' | 'bleed' | 'buff', target: 'player' | 'monster', color?: string }[];
    effects: { screenShake?: boolean, monsterShake?: boolean, hitFlash?: boolean };
    cooldowns?: { skill?: number, weapon?: number };
    atbReset?: 'player' | 'monster';
    monsterDied?: boolean;
    playerDied?: boolean;
}

// Tick 回傳的結構變得更豐富，包含 DoT 的結果
export interface BattleTickResult {
    playerAtbDelta: number;
    monsterAtbDelta: number;
    skillCdDelta: number;
    weaponCdDelta: number;
    tickResult?: BattleResult; // 用於回傳 DoT 造成的傷害與狀態更新
}

export class BattleHandler {

    // --- Buff 系統核心邏輯 ---

    // 獲取 Buff 造成的攻防加成
    static getBuffModifiers(entity: any): { atkMult: number, defMult: number, speedMult: number } {
        let atkMult = 1.0;
        let defMult = 1.0;
        let speedMult = 1.0;

        (entity.buffs || []).forEach((buff: BuffEffect) => {
            if (buff.type === 'morale') atkMult += 0.3 * buff.stacks;      // 鬥志: +30% ATK per stack
            if (buff.type === 'fortify') defMult += 0.3 * buff.stacks;    // 堅硬: +30% DEF per stack
            if (buff.type === 'berserk') { atkMult += 0.25; speedMult += 0.25; defMult *= 0.5; } // 狂暴: +25% ATK, +25% Speed, -50% DEF
        });

        return { atkMult, defMult, speedMult };
    }

    // --- Affix 疊加效果計算 Helper ---
    // 計算玩家裝備上特定 passive effect 的疊加數值
    // 回傳 { value: 總數值, count: 出現次數 }
    static getAffixStackedValue(player: any, effectType: string): { value: number, count: number } {
        let totalValue = 0;
        let count = 0;

        const equippedItems = [player.weapon, player.armor].filter(Boolean);

        equippedItems.forEach((item: Item) => {
            // 處理裝備詞綴
            if (item.affixes) {
                item.affixes.forEach(affixId => {
                    const affix = AFFIXES[affixId];
                    if (affix && affix.type === 'passive' && affix.passiveEffect === effectType) {
                        count++;
                        totalValue += affix.value || 0;
                    }
                });
            }

            // 處理防具 armorEffect 內建詞綴
            if (item.armorEffect?.builtInAffixes) {
                item.armorEffect.builtInAffixes.forEach((affixId: string) => {
                    const affix = AFFIXES[affixId];
                    if (affix && affix.type === 'passive' && affix.passiveEffect === effectType) {
                        count++;
                        totalValue += affix.value || 0;
                    }
                });
            }
        });

        return { value: totalValue, count };
    }

    // 檢查玩家是否免疫特定狀態效果
    static hasStatusImmunity(player: any, status: string): boolean {
        const immunityMap: Record<string, string> = {
            'poison': 'poison_immune',
            'burn': 'burn_immune',
            'bleed': 'bleed_immune',
            'frozen': 'frozen_immune',
            'stun': 'stun_immune'
        };
        const immuneEffect = immunityMap[status];
        if (!immuneEffect) return false;
        const { count } = this.getAffixStackedValue(player, immuneEffect);
        return count > 0;
    }

    // 機率類效果疊加後取得最終機率 (上限 100%)
    static getStackedChance(player: any, effectType: string): number {
        const { value } = this.getAffixStackedValue(player, effectType);
        return Math.min(1, value);
    }

    // 施加 Buff
    static applyBuff(entity: any, type: BuffType, duration: number = 4, consumeOnTrigger: boolean = true): BuffEffect[] {
        const buffs = [...(entity.buffs || [])];
        const existingIndex = buffs.findIndex(b => b.type === type);

        // 根據 Buff 類型決定最大疊加層數
        let maxStacks = 5;
        if (type === 'morale' || type === 'fortify') maxStacks = 3;
        if (type === 'berserk') maxStacks = 1; // 不疊加

        if (existingIndex >= 0) {
            // 已存在，刷新持續時間
            const buff = { ...buffs[existingIndex] };
            buff.duration = duration;
            buff.stacks = Math.min(maxStacks, buff.stacks + 1);
            buffs[existingIndex] = buff;
        } else {
            // 新增 Buff
            buffs.push({
                type,
                stacks: 1,
                duration,
                consumeOnTrigger
            });
        }
        return buffs;
    }

    // 消耗 Buff（觸發後移除）
    static consumeBuff(entity: any, type: BuffType): { buffs: BuffEffect[], consumed: boolean } {
        const buffs = [...(entity.buffs || [])];
        const index = buffs.findIndex(b => b.type === type);

        if (index >= 0 && buffs[index].consumeOnTrigger) {
            buffs.splice(index, 1);
            return { buffs, consumed: true };
        }
        return { buffs, consumed: false };
    }

    // 檢查是否有指定 Buff
    static hasBuff(entity: any, type: BuffType): boolean {
        return entity.buffs?.some((b: BuffEffect) => b.type === type) ?? false;
    }

    // 處理 Buff Tick（減少持續時間，處理加速等效果）
    static processBuffTick(entity: any): { buffs: BuffEffect[], speedMultiplier: number } {
        let buffs = [...(entity.buffs || [])];
        let speedMultiplier = 1.0;

        buffs = buffs.map(buff => {
            // 減少持續時間
            buff.duration -= 0.1;

            // 加速效果
            if (buff.type === 'haste') {
                speedMultiplier *= 1.5;
            }
            // 狂暴加速效果
            if (buff.type === 'berserk') {
                speedMultiplier *= 1.25;
            }

            return buff;
        }).filter(buff => buff.duration > 0);

        return { buffs, speedMultiplier };
    }

    // --- 狀態異常核心邏輯 ---

    // 施加狀態 (通用)
    static applyStatus(entity: any, type: StatusType, customDuration?: number): StatusEffect[] {
        return this.applyStatusWithResistance(entity, type, customDuration, false);
    }

    // 施加狀態到怪物 (考慮 BOSS 抗性)
    static applyStatusToMonster(monster: any, type: StatusType, customDuration?: number): StatusEffect[] {
        const isBoss = monster.isBoss === true || monster.role === 'BOSS';
        return this.applyStatusWithResistance(monster, type, customDuration, isBoss);
    }

    // 內部方法：施加狀態 (支援 BOSS 抗性)
    private static applyStatusWithResistance(entity: any, type: StatusType, customDuration?: number, halvedDuration: boolean = false): StatusEffect[] {
        const effects = [...(entity.statusEffects || [])];
        const existingIndex = effects.findIndex(e => e.type === type);

        // BOSS 狀態持續時間減半
        const durationMultiplier = halvedDuration ? 0.5 : 1.0;

        if (existingIndex >= 0) {
            // 已存在，刷新持續時間並疊加
            const effect = { ...effects[existingIndex] };

            if (type === 'poison') {
                effect.stacks = Math.min(10, effect.stacks + 1);
                effect.duration = (customDuration ?? 4.0) * durationMultiplier;
            } else if (type === 'burn') {
                effect.stacks = Math.min(3, effect.stacks + 1);
                effect.duration = (customDuration ?? 4.0) * durationMultiplier;
            } else if (type === 'stun') {
                effect.duration = (customDuration ?? 1.0) * durationMultiplier;
            } else if (type === 'frozen') {
                effect.duration = (customDuration ?? 2.0) * durationMultiplier;
            } else if (type === 'bleed') {
                effect.stacks = Math.min(5, effect.stacks + 1);
                effect.duration = (customDuration ?? 4.0) * durationMultiplier;
            }

            effects[existingIndex] = effect;
        } else {
            // 新增狀態
            let duration = customDuration ?? 4.0;
            if (!customDuration) {
                if (type === 'stun') duration = 1.0;
                if (type === 'frozen') duration = 2.0;
            }
            duration *= durationMultiplier;

            effects.push({
                type,
                stacks: 1,
                duration: duration,
                tickTimer: 0
            });
        }
        return effects;
    }

    // 處理單一實體的狀態 Tick (DoT 與 時間減少)
    private static processEntityStatus(entity: any, isPlayer: boolean): { effects: StatusEffect[], damage: number, logs: string[], floatTexts: any[] } {
        let currentEffects = [...(entity.statusEffects || [])];
        let totalDamage = 0;
        const logs: string[] = [];
        const floatTexts: any[] = [];

        // 為了安全遍歷，使用 map 處理後 filter
        currentEffects = currentEffects.map(effect => {
            // 減少持續時間 (假設 tick 為 0.1s)
            effect.duration -= 0.1;

            // 處理 DoT (每 1 秒觸發一次)
            if (effect.type === 'poison' || effect.type === 'burn' || effect.type === 'bleed') {
                effect.tickTimer += 0.1;
                if (effect.tickTimer >= 1.0) {
                    effect.tickTimer = 0; // Reset timer

                    let dmg = 0;
                    const maxHp = entity.maxHp || entity.baseMaxHp || 100; // Fallback

                    if (effect.type === 'poison') {
                        dmg = Math.floor(maxHp * 0.02 * effect.stacks);
                        logs.push(`${isPlayer ? '你' : entity.name} 受到中毒傷害 ${dmg}！`);
                        floatTexts.push({ text: `☠️${dmg}`, type: 'damage', target: isPlayer ? 'player' : 'monster', color: 'text-green-500' });
                    } else if (effect.type === 'burn') {
                        dmg = Math.floor(maxHp * 0.04 * effect.stacks); // 本身 DoT 傷害
                        logs.push(`${isPlayer ? '你' : entity.name} 受到燃燒傷害 ${dmg}！`);
                        floatTexts.push({ text: `🔥${dmg}`, type: 'damage', target: isPlayer ? 'player' : 'monster', color: 'text-orange-500' });
                    } else if (effect.type === 'bleed') {
                        dmg = Math.floor(maxHp * 0.02 * effect.stacks);
                        logs.push(`${isPlayer ? '你' : entity.name} 流血不止受到 ${dmg} 傷害！`);
                        floatTexts.push({ text: `🩸${dmg}`, type: 'damage', target: isPlayer ? 'player' : 'monster', color: 'text-red-600' });
                    }
                    totalDamage += dmg;
                }
            }

            return effect;
        }).filter(effect => effect.duration > 0);

        return { effects: currentEffects, damage: totalDamage, logs, floatTexts };
    }

    // Helper: 處理流血反噬傷害 (在攻擊時觸發)
    private static applyBleedSelfDamage(entity: any, result: BattleResult, isPlayer: boolean) {
        const bleed = entity.statusEffects?.find((e: StatusEffect) => e.type === 'bleed');
        if (bleed) {
            const maxHp = entity.maxHp || entity.baseMaxHp || 100;
            const dmg = Math.floor(maxHp * 0.02 * bleed.stacks);

            result.logs.push(`${isPlayer ? '你' : entity.name} 因劇烈動作觸發流血，受到 ${dmg} 傷害！`);
            result.floatingTexts.push({
                text: `🩸${dmg}`,
                type: 'damage',
                target: isPlayer ? 'player' : 'monster',
                color: 'text-red-600'
            });

            if (isPlayer) {
                const currentHp = result.playerUpdates?.hp ?? entity.hp;
                const newHp = Math.max(0, currentHp - dmg);
                result.playerUpdates = { ...result.playerUpdates, hp: newHp };
                if (newHp <= 0) result.playerDied = true;
            } else {
                const currentHp = result.monsterUpdates?.hp ?? entity.hp;
                const newHp = Math.max(0, currentHp - dmg);
                result.monsterUpdates = { ...result.monsterUpdates, hp: newHp };
                if (newHp <= 0) result.monsterDied = true;
            }
        }
    }

    // --- 主要公開方法 ---

    // 1. 處理時間流逝 (包含 ATB, Cooldowns, 狀態異常 Tick, Buff Tick)
    static processGameTick(player: any, monster: any, currentSkillCD: number, currentWeaponCD: number): BattleTickResult {
        const stats = calculateStats(player);

        // 處理狀態異常 Tick
        const pStatus = this.processEntityStatus(player, true);
        const mStatus = this.processEntityStatus(monster, false);

        // 處理 Buff Tick (玩家與怪物)
        const pBuffResult = this.processBuffTick(player);
        const mBuffResult = this.processBuffTick(monster);

        // 檢查是否無法行動 (Stun / Frozen)
        const isPlayerStopped = pStatus.effects.some(e => e.type === 'stun' || e.type === 'frozen');
        const isMonsterStopped = mStatus.effects.some(e => e.type === 'stun' || e.type === 'frozen');

        // 構建 DoT 結果
        let tickResult: BattleResult | undefined = undefined;
        const pBuffChanged = pBuffResult.buffs.length !== (player.buffs?.length || 0);
        const mBuffChanged = mBuffResult.buffs.length !== (monster.buffs?.length || 0);

        if (pStatus.damage > 0 || mStatus.damage > 0 || pStatus.effects.length !== (player.statusEffects?.length || 0) || mStatus.effects.length !== (monster.statusEffects?.length || 0) || pBuffChanged || mBuffChanged) {
            tickResult = {
                logs: [...pStatus.logs, ...mStatus.logs],
                floatingTexts: [...pStatus.floatTexts, ...mStatus.floatTexts],
                effects: {},
                playerUpdates: { statusEffects: pStatus.effects, buffs: pBuffResult.buffs },
                monsterUpdates: { statusEffects: mStatus.effects, buffs: mBuffResult.buffs }
            };

            // 扣除玩家血量
            if (pStatus.damage > 0) {
                let currentHp = player.hp;
                // DoT 穿透護盾? 通常 RPG 設定 DoT 直接扣血，或是先扣盾。這裡設定直接扣血比較符合中毒/燃燒
                currentHp = Math.max(0, currentHp - pStatus.damage);
                tickResult.playerUpdates!.hp = currentHp;
                if (currentHp <= 0) tickResult.playerDied = true;
            }

            // 扣除怪物血量
            if (mStatus.damage > 0) {
                const newHp = Math.max(0, monster.hp - mStatus.damage);
                tickResult.monsterUpdates!.hp = newHp;
                if (newHp <= 0) tickResult.monsterDied = true;
            }
        }

        // 加速 Buff 影響速度 (玩家與怪物)
        const playerSpeedMult = pBuffResult.speedMultiplier;
        const monsterSpeedMult = mBuffResult.speedMultiplier;

        return {
            playerAtbDelta: isPlayerStopped ? 0 : stats.speed * 0.1 * playerSpeedMult,
            monsterAtbDelta: isMonsterStopped ? 0 : monster.speed * 0.1 * monsterSpeedMult,
            skillCdDelta: Math.max(0, currentSkillCD - 0.1) - currentSkillCD,
            weaponCdDelta: Math.max(0, currentWeaponCD - 0.1) - currentWeaponCD,
            tickResult
        };
    }


    // 2. 計算玩家普通攻擊 (包含被動、暴擊、燃燒加成、冰凍加成與移除、連擊 Buff)
    static calculatePlayerAttack(player: any, monster: any): BattleResult {
        const stats = calculateStats(player);
        const result: BattleResult = {
            logs: [],
            floatingTexts: [],
            effects: {},
            atbReset: 'player',
            playerUpdates: {},
            monsterUpdates: {}
        };

        // 檢查玩家是否無法行動 (雙重確認，雖然 UI 層通常會擋)
        if (player.statusEffects?.some((e: StatusEffect) => e.type === 'stun' || e.type === 'frozen')) {
            result.logs.push('你無法行動！');
            return result;
        }

        // 處理流血反噬
        this.applyBleedSelfDamage(player, result, true);
        if (result.playerDied) return result; // 如果流血致死，中止攻擊

        // === 執行攻擊邏輯 (支援連擊 Buff 和 連擊符文) ===
        const hasDoubleStrike = this.hasBuff(player, 'double_strike');
        let hitCount = hasDoubleStrike ? 2 : 1;

        // 如果有連擊 Buff，消耗它
        if (hasDoubleStrike) {
            const consumeResult = this.consumeBuff(player, 'double_strike');
            result.playerUpdates!.buffs = consumeResult.buffs;
            result.logs.push('影連擊發動！');
            result.floatingTexts.push({ text: '影連擊！', type: 'buff', target: 'player', color: 'text-yellow-400' });
        }

        // === 新增: 連擊符文效果 (double_attack，機率疊加觸發額外攻擊) ===
        if (!hasDoubleStrike) {
            const doubleAttackChance = this.getStackedChance(player, 'double_attack');
            if (doubleAttackChance > 0 && Math.random() < doubleAttackChance) {
                hitCount = 2;
                result.logs.push('二刀連擊發動！');
                result.floatingTexts.push({ text: '二刀連擊！', type: 'buff', target: 'player', color: 'text-purple-400' });
            }
        }

        let totalDamage = 0;
        for (let hit = 0; hit < hitCount; hit++) {
            const hitResult = this.calculateSingleAttack(player, monster, stats, result, hit + 1);
            totalDamage += hitResult.damage;

            // 更新怪物 HP
            if (hitResult.newMonsterHp !== undefined) {
                result.monsterUpdates!.hp = hitResult.newMonsterHp;
                if (hitResult.newMonsterHp <= 0) {
                    result.monsterDied = true;
                    break; // 怪物死亡，停止連擊
                }
            }
        }

        // 更新最大傷害記錄
        if (totalDamage > (player.maxDamage || 0)) {
            result.playerUpdates!.maxDamage = totalDamage;
        }

        return result;
    }

    // Helper: 計算單次攻擊
    private static calculateSingleAttack(player: any, monster: any, stats: any, result: BattleResult, hitNumber: number): { damage: number, newMonsterHp?: number } {
        let attackType = '普通攻擊';
        let isCrit = false;
        let physicalDmg = stats.atk;
        let magicalDmg = 0;
        let defPenetration = 0;
        let shouldApplyStatus: StatusType | null = null;
        let statusDuration: number | undefined = undefined;
        let atbOnCrit = 0;
        let defenseReverse = false;
        let agiAtkRatio = 0;
        let healIntRatio = 0;
        let triggeredSkillName: string | null = null;

        // === 新增: 精神抖擻效果 (HP > 95% 時 ATK 加成) ===
        const maxMightData = this.getAffixStackedValue(player, 'max_might');
        if (maxMightData.count > 0 && player.hp >= stats.maxHp * 0.95) {
            const bonusAtk = Math.floor(stats.atk * maxMightData.value);
            physicalDmg += bonusAtk;
            result.floatingTexts.push({ text: '精神抖擻！', type: 'buff', target: 'player', color: 'text-yellow-400' });
        }

        // === 新增: 穿甲效果 (def_pierce) ===
        const defPierceData = this.getAffixStackedValue(player, 'def_pierce');
        if (defPierceData.count > 0) {
            defPenetration += defPierceData.value;
        }

        // 武器特效被動
        const skill: Skill | undefined = player.weapon?.skill;
        if (skill) {
            const isTriggerType = !skill.passiveType || skill.passiveType === 'trigger';

            if (isTriggerType) {
                // 觸發類被動
                if (Math.random() < (skill.triggerRate || 0)) {
                    attackType = skill.name;
                    triggeredSkillName = skill.name;
                    physicalDmg = stats.atk * (skill.atkMultiplier || 0);
                    magicalDmg = stats.matk * (skill.matkMultiplier || 0);
                    if (skill.atkMultiplier === 0) physicalDmg = 0;

                    // 觸發類的附加效果
                    if (skill.continuousEffect?.applyStatus) {
                        const chance = skill.continuousEffect.statusChance ?? 1.0;
                        if (Math.random() < chance) {
                            shouldApplyStatus = skill.continuousEffect.applyStatus;
                            statusDuration = skill.continuousEffect.statusDuration;
                        }
                    }
                    if (skill.continuousEffect?.defPenetration) {
                        defPenetration += skill.continuousEffect.defPenetration;
                    }
                    if (skill.continuousEffect?.atbOnCrit) {
                        atbOnCrit = skill.continuousEffect.atbOnCrit;
                    }
                    if (skill.continuousEffect?.defenseReverse) {
                        defenseReverse = true;
                    }
                    if (skill.continuousEffect?.agiAtkRatio) {
                        agiAtkRatio = skill.continuousEffect.agiAtkRatio;
                    }
                    if (skill.continuousEffect?.healIntRatio) {
                        healIntRatio = skill.continuousEffect.healIntRatio;
                    }
                }
            } else {
                // 持續效果類被動 (每次攻擊都觸發)
                attackType = skill.name;
                if (skill.continuousEffect?.applyStatus) {
                    const chance = skill.continuousEffect.statusChance ?? 1.0;
                    if (Math.random() < chance) {
                        shouldApplyStatus = skill.continuousEffect.applyStatus;
                        statusDuration = skill.continuousEffect.statusDuration;
                    }
                }
                if (skill.continuousEffect?.bonusMatkRatio) {
                    magicalDmg = stats.matk * skill.continuousEffect.bonusMatkRatio;
                }
                if (skill.continuousEffect?.defPenetration) {
                    defPenetration += skill.continuousEffect.defPenetration;
                }
                if (skill.continuousEffect?.atbOnCrit) {
                    atbOnCrit = skill.continuousEffect.atbOnCrit;
                }
            }
        }

        // AGI 傷害加成
        if (agiAtkRatio > 0) {
            physicalDmg += player.agi * agiAtkRatio;
        }

        // --- Affix Effects (Combat Stats: Crit, etc.) ---
        let critChance = stats.critChance;
        let critDamageMult = stats.critDamage || 1.5; // 使用計算後的暴擊傷害倍率

        // Rogue Base (職業額外加成)
        if (player.classKey === 'rogue') {
            critChance += 0.15;
        }

        // 裝備詞綴加成 (暴擊率、暴擊傷害)
        const equippedItems = [player.weapon, player.armor].filter(Boolean);
        equippedItems.forEach((item: Item) => {
            if (item.affixes) {
                item.affixes.forEach(affixId => {
                    const affix = AFFIXES[affixId];
                    if (affix && affix.type === 'passive') {
                        if (affix.passiveEffect === 'crit_chance' && affix.value) critChance += affix.value;
                        if (affix.passiveEffect === 'crit_damage' && affix.value) critDamageMult += affix.value;
                    }
                });
            }
        });

        // 暴擊判定 (上限 100%)
        critChance = Math.min(1, critChance);
        if (Math.random() < critChance) {
            isCrit = true;
            physicalDmg *= critDamageMult;
            attackType += ' (暴擊)';

            // 暴擊觸發 ATB 充能
            if (atbOnCrit > 0) {
                result.logs.push(`暴擊觸發 ATB 充能！`);
                // ATB 充能會在 UI 層處理
            }
        }

        let rawDmg = physicalDmg + magicalDmg;

        // === 新增: 處決效果 (目標 HP < 30% 時增傷) ===
        const executeDmgData = this.getAffixStackedValue(player, 'execute_dmg');
        if (executeDmgData.count > 0) {
            const targetHpPercent = (monster.hp / (monster.maxHp || monster.hp));
            if (targetHpPercent < 0.3) {
                rawDmg *= (1 + executeDmgData.value);
                result.floatingTexts.push({ text: '處決！', type: 'crit', target: 'monster', color: 'text-red-600' });
            }
        }

        // --- 狀態異常傷害計算 (對怪物) ---
        const mEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];

        // 1. 燃燒增傷 (+4% per stack)
        const burnEffect = mEffects.find((e: StatusEffect) => e.type === 'burn');
        if (burnEffect) {
            const multiplier = 1 + (0.04 * burnEffect.stacks);
            rawDmg *= multiplier;
        }

        // 2. 冰凍雙倍傷 + 移除狀態
        const frozenIndex = mEffects.findIndex((e: StatusEffect) => e.type === 'frozen');
        if (frozenIndex >= 0) {
            rawDmg *= 2;
            result.floatingTexts.push({ text: 'Shatter!', type: 'crit', target: 'monster' });
            result.logs.push('冰凍碎裂！造成雙倍傷害！');

            // 移除冰凍
            const newEffects = [...mEffects];
            newEffects.splice(frozenIndex, 1);
            result.monsterUpdates!.statusEffects = newEffects;
        }

        // 使用減傷公式計算最終傷害（考慮防禦穿透、防禦轉增傷、怪物 Buff）
        const monsterBuffMods = this.getBuffModifiers(monster);
        let monsterDef = (monster.def || 0) * monsterBuffMods.defMult * (1 - defPenetration);
        let playerDmg: number;

        if (defenseReverse && monsterDef > 0) {
            // 防禦轉為增傷：原本的減傷比例變成增傷比例
            const defReduction = monsterDef / (monsterDef + 100);
            playerDmg = Math.floor(rawDmg * (1 + defReduction));
            result.floatingTexts.push({ text: '破甲！', type: 'buff', target: 'monster', color: 'text-orange-400' });
        } else {
            playerDmg = calculateDamage(rawDmg, monsterDef);
        }
        const currentMonsterHp = result.monsterUpdates?.hp ?? monster.hp;
        const newMonsterHp = Math.max(0, currentMonsterHp - playerDmg);

        // 更新結果
        const hitLabel = hitNumber > 1 ? ` (${hitNumber}連)` : '';
        result.floatingTexts.push({
            text: `-${playerDmg}${hitLabel}`,
            type: isCrit ? 'crit' : 'damage',
            target: 'monster'
        });

        // 觸發 passive 時顯示發動訊息
        if (triggeredSkillName) {
            result.logs.push(`你使用了「${triggeredSkillName}」！`);
        }
        result.logs.push(`你對 ${monster.name} 造成 ${playerDmg} 點傷害！`);
        result.effects = { monsterShake: true, hitFlash: true };

        // --- 持續效果：施加狀態異常 (武器被動) ---
        if (shouldApplyStatus && newMonsterHp > 0) {
            const currentEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
            const newEffects = this.applyStatus({ statusEffects: currentEffects }, shouldApplyStatus, statusDuration);
            result.monsterUpdates!.statusEffects = newEffects;

            const statusIcons: Record<StatusType, string> = {
                'poison': '🧪Poison',
                'burn': '🔥Burn',
                'stun': '💫Stun',
                'frozen': '❄️Frozen',
                'bleed': '🩸Bleed'
            };
            result.floatingTexts.push({ text: statusIcons[shouldApplyStatus], type: 'crit', target: 'monster' });
            result.logs.push(`${monster.name} 被附加了${shouldApplyStatus === 'poison' ? '中毒' : shouldApplyStatus === 'stun' ? '暈眩' : shouldApplyStatus}！`);
        }

        // === 新增: 符文效果處理 (使用疊加邏輯) ===
        if (newMonsterHp > 0) {
            // 吸血效果 (疊加)
            const lifeStealData = this.getAffixStackedValue(player, 'life_steal');
            if (lifeStealData.count > 0) {
                const healAmount = Math.floor(playerDmg * 0.1 * lifeStealData.count);
                if (healAmount > 0) {
                    const currentHp = result.playerUpdates?.hp ?? player.hp;
                    const newHp = Math.min(stats.maxHp, currentHp + healAmount);
                    result.playerUpdates = { ...result.playerUpdates, hp: newHp };
                    result.floatingTexts.push({ text: `+${healAmount}`, type: 'heal', target: 'player' });
                }
            }

            // 放血效果 (100% 機率)
            const bleedOnHitData = this.getAffixStackedValue(player, 'bleed_on_hit');
            if (bleedOnHitData.count > 0) {
                const currentMonsterEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
                const newEffects = this.applyStatus({ statusEffects: currentMonsterEffects }, 'bleed');
                result.monsterUpdates = { ...result.monsterUpdates, statusEffects: newEffects };
                result.floatingTexts.push({ text: '🩸Bleed', type: 'crit', target: 'monster', color: 'text-red-600' });
            }

            // 猛毒效果 (100% 機率附加中毒)
            const poisonOnHitData = this.getAffixStackedValue(player, 'poison_hit');
            if (poisonOnHitData.count > 0) {
                const currentMonsterEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
                const newEffects = this.applyStatus({ statusEffects: currentMonsterEffects }, 'poison');
                result.monsterUpdates = { ...result.monsterUpdates, statusEffects: newEffects };
                result.floatingTexts.push({ text: '🧪Poison', type: 'poison', target: 'monster', color: 'text-green-500' });
            }

            // 灼熱效果 (100% 機率附加燃燒)
            const burnOnHitData = this.getAffixStackedValue(player, 'burn_hit');
            if (burnOnHitData.count > 0) {
                const currentMonsterEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
                const newEffects = this.applyStatus({ statusEffects: currentMonsterEffects }, 'burn');
                result.monsterUpdates = { ...result.monsterUpdates, statusEffects: newEffects };
                result.floatingTexts.push({ text: '🔥Burn', type: 'burn', target: 'monster', color: 'text-orange-500' });
            }

            // 急凍效果 (機率疊加，上限100%)
            const freezeOnHitChance = this.getStackedChance(player, 'freeze_hit');
            if (freezeOnHitChance > 0 && Math.random() < freezeOnHitChance) {
                const currentMonsterEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
                const newEffects = this.applyStatusToMonster({ statusEffects: currentMonsterEffects, isBoss: monster.isBoss, role: monster.role }, 'frozen');
                result.monsterUpdates = { ...result.monsterUpdates, statusEffects: newEffects };
                result.floatingTexts.push({ text: '❄️Frozen', type: 'frozen', target: 'monster', color: 'text-cyan-400' });
            }

            // 敲暈效果 (機率疊加，上限100%)
            const stunHitChance = this.getStackedChance(player, 'stun_hit');
            if (stunHitChance > 0 && Math.random() < stunHitChance) {
                const currentMonsterEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
                const newEffects = this.applyStatusToMonster({ statusEffects: currentMonsterEffects, isBoss: monster.isBoss, role: monster.role }, 'stun');
                result.monsterUpdates = { ...result.monsterUpdates, statusEffects: newEffects };
                result.floatingTexts.push({ text: '💫Stun', type: 'stun', target: 'monster', color: 'text-yellow-400' });
            }

            // 獵鷹追擊 (機率疊加，上限100%，傷害 = INT*1.5 + AGI*0.5，無視防禦)
            const falconBlitzChance = this.getStackedChance(player, 'falcon_blitz');
            if (falconBlitzChance > 0 && Math.random() < falconBlitzChance) {
                const falconDmg = Math.floor(player.int * 1.5 + player.agi * 0.5);
                const newHp = Math.max(0, (result.monsterUpdates?.hp ?? newMonsterHp) - falconDmg);
                result.monsterUpdates = { ...result.monsterUpdates, hp: newHp };
                result.floatingTexts.push({ text: `🦅${falconDmg}`, type: 'crit', target: 'monster', color: 'text-amber-400' });
                result.logs.push(`獵鷹追擊！造成 ${falconDmg} 點無視防禦傷害！`);
                if (newHp <= 0) {
                    return { damage: playerDmg + falconDmg, newMonsterHp: 0 };
                }
            }
        }

        // INT 回血效果
        if (healIntRatio > 0) {
            const healAmount = Math.floor(player.int * healIntRatio);
            if (healAmount > 0) {
                const currentHp = result.playerUpdates?.hp ?? player.hp;
                const newHp = Math.min(stats.maxHp, currentHp + healAmount);
                result.playerUpdates = { ...result.playerUpdates, hp: newHp };
                result.floatingTexts.push({ text: `+${healAmount}`, type: 'heal', target: 'player' });
            }
        }

        return { damage: playerDmg, newMonsterHp };
    }

    // 3. 計算怪物攻擊 (包含閃避、護盾、燃燒加成、冰凍加成與移除)
    static calculateMonsterAttack(player: any, monster: any): BattleResult {
        const stats = calculateStats(player);
        const result: BattleResult = {
            logs: [],
            floatingTexts: [],
            effects: {},
            atbReset: 'monster',
            playerUpdates: {},
            monsterUpdates: {}
        };

        // 檢查怪物是否無法行動
        if (monster.statusEffects?.some((e: StatusEffect) => e.type === 'stun' || e.type === 'frozen')) {
            result.logs.push(`${monster.name} 無法行動！`);
            return result;
        }

        // 處理流血反噬 (怪物也會受傷)
        this.applyBleedSelfDamage(monster, result, false);
        if (result.monsterDied) return result; // 如果流血致死，中止攻擊

        // === 迴避態勢 Buff：強制閃避 ===
        if (this.hasBuff(player, 'evasion_stance')) {
            const consumeResult = this.consumeBuff(player, 'evasion_stance');
            result.playerUpdates!.buffs = consumeResult.buffs;
            result.floatingTexts.push({ text: '迴避態勢！', type: 'buff', target: 'player', color: 'text-cyan-400' });
            result.floatingTexts.push({ text: 'MISS', type: 'miss', target: 'player' });
            result.logs.push(`迴避態勢發動！完美閃避了 ${monster.name} 的攻擊！`);
            return result;
        }

        // === 格擋 Buff：傷害反彈給敵人 ===
        if (this.hasBuff(player, 'counter_stance')) {
            const consumeResult = this.consumeBuff(player, 'counter_stance');
            result.playerUpdates!.buffs = consumeResult.buffs;

            // 傷害反彈
            const counterDmg = Math.floor(monster.atk * 0.8);
            const newMonsterHp = Math.max(0, monster.hp - counterDmg);

            result.monsterUpdates!.hp = newMonsterHp;
            result.floatingTexts.push({ text: '格擋反擊！', type: 'buff', target: 'player', color: 'text-orange-400' });
            result.floatingTexts.push({ text: `-${counterDmg}`, type: 'damage', target: 'monster' });
            result.logs.push(`格擋發動！將 ${monster.name} 的攻擊反彈，造成 ${counterDmg} 傷害！`);

            if (newMonsterHp <= 0) result.monsterDied = true;
            return result;
        }

        // 閃避計算 (使用 stats.dodgeChance 作為基礎，包含 AGI 加成)
        let dodgeChance = stats.dodgeChance;

        // 裝備詞綴額外加成
        const equippedItems = [player.weapon, player.armor].filter(Boolean);
        equippedItems.forEach((item: Item) => {
            if (item.affixes) {
                item.affixes.forEach(affixId => {
                    const affix = AFFIXES[affixId];
                    if (affix && affix.type === 'passive' && affix.passiveEffect === 'dodge_chance' && affix.value) {
                        dodgeChance += affix.value;
                    }
                });
            }
        });

        // 武器被動閃避加成 (dodgeBonus)
        if (player.weapon?.skill?.continuousEffect?.dodgeBonus) {
            dodgeChance += player.weapon.skill.continuousEffect.dodgeBonus;
        }

        // 上下限 5% ~ 95%
        dodgeChance = Math.min(0.95, Math.max(0.05, dodgeChance));

        if (Math.random() < dodgeChance) {
            result.floatingTexts.push({ text: 'MISS', type: 'miss', target: 'player' });
            result.logs.push(`你閃避了 ${monster.name} 的攻擊！`);
            return result;
        }

        // === TANK 職能: HP < 30% 時觸發堅硬模式 ===
        if (monster.role === 'TANK' && monster.hp <= monster.maxHp * 0.3) {
            if (!this.hasBuff(monster, 'fortify')) {
                const newBuffs = this.applyBuff(monster, 'fortify', 999, false);
                result.monsterUpdates!.buffs = newBuffs;
                result.floatingTexts.push({ text: '🛡️堅硬模式！', type: 'buff', target: 'monster', color: 'text-blue-400' });
                result.logs.push(`${monster.name} 進入堅硬模式！防禦力大幅提升！`);
            }
        }

        // === BOSS 職能: HP < 25% 時觸發狂暴模式 ===
        if (monster.role === 'BOSS' && monster.hp <= monster.maxHp * 0.25) {
            if (!this.hasBuff(monster, 'berserk')) {
                const currentBuffs = result.monsterUpdates?.buffs || monster.buffs || [];
                const newBuffs = this.applyBuff({ buffs: currentBuffs }, 'berserk', 999, false);
                result.monsterUpdates!.buffs = newBuffs;
                result.floatingTexts.push({ text: '💢狂暴模式！', type: 'buff', target: 'monster', color: 'text-red-600' });
                result.logs.push(`${monster.name} 進入狂暴模式！攻擊力大幅提升，但防禦降低！`);
            }
        }

        // 獲取怪物 Buff 造成的攻擊加成
        const monsterBuffMods = this.getBuffModifiers(monster);
        const monsterEffectiveAtk = Math.floor(monster.atk * monsterBuffMods.atkMult);

        // 傷害計算 (使用減傷公式，考慮怪物 Buff)
        let damage = calculateDamage(monsterEffectiveAtk, stats.def);

        // --- 狀態異常傷害計算 (對玩家) ---
        const pEffects = player.statusEffects || [];

        // 1. 燃燒增傷
        const burnEffect = pEffects.find((e: StatusEffect) => e.type === 'burn');
        if (burnEffect) {
            damage = Math.floor(damage * (1 + 0.04 * burnEffect.stacks));
        }

        // 2. 冰凍雙倍傷 + 移除
        const frozenIndex = pEffects.findIndex((e: StatusEffect) => e.type === 'frozen');
        if (frozenIndex >= 0) {
            damage *= 2;
            result.floatingTexts.push({ text: 'Shatter!', type: 'damage', target: 'player' });
            result.logs.push('你身上的冰凍碎裂了！受到雙倍傷害！');

            const newEffects = [...pEffects];
            newEffects.splice(frozenIndex, 1);
            result.playerUpdates!.statusEffects = newEffects;
        }

        let currentHp = result.playerUpdates?.hp ?? player.hp;
        let currentShield = player.shield;

        if (currentShield > 0) {
            if (currentShield >= damage) {
                currentShield -= damage;
                result.floatingTexts.push({ text: `🛡️-${damage}`, type: 'miss', target: 'player' });
            } else {
                const remainingDmg = damage - currentShield;
                currentShield = 0;
                currentHp = Math.max(0, currentHp - remainingDmg);
                result.floatingTexts.push({ text: `-${remainingDmg}`, type: 'damage', target: 'player' });
                result.effects.screenShake = true;
            }
        } else {
            currentHp = Math.max(0, currentHp - damage);
            result.floatingTexts.push({ text: `-${damage}`, type: 'damage', target: 'player' });
            result.effects.screenShake = true;
        }

        result.playerUpdates!.hp = currentHp;
        result.playerUpdates!.shield = currentShield;
        result.logs.push(`${monster.name} 攻擊造成 ${damage} 傷害！`);

        if (currentHp <= 0) {
            result.playerDied = true;
            result.logs.push(`💀 你被擊敗了...`);
        }

        // --- Affix Effects (When Hit / Thorns) ---
        if (!result.playerDied) {
            equippedItems.forEach((item: Item) => {
                if (item.affixes) {
                    item.affixes.forEach(affixId => {
                        const affix = AFFIXES[affixId];
                        if (affix && affix.type === 'passive' && affix.passiveEffect === 'thorns' && affix.value) {
                            const reflectDmg = Math.max(1, Math.floor(damage * affix.value));
                            const curMonHp = result.monsterUpdates?.hp ?? monster.hp;
                            const newMonHp = Math.max(0, curMonHp - reflectDmg);

                            result.monsterUpdates!.hp = newMonHp;
                            result.floatingTexts.push({ text: `⚡${reflectDmg}`, type: 'damage', target: 'monster', color: 'text-yellow-400' });

                            if (newMonHp <= 0) result.monsterDied = true;
                        }
                    });
                }

                // 防具 armorEffect 內建詞綴處理
                if (item.armorEffect?.builtInAffixes) {
                    item.armorEffect.builtInAffixes.forEach(affixId => {
                        const affix = AFFIXES[affixId];
                        if (affix && affix.type === 'passive' && affix.passiveEffect === 'thorns' && affix.value) {
                            const reflectDmg = Math.max(1, Math.floor(damage * affix.value));
                            const curMonHp = result.monsterUpdates?.hp ?? monster.hp;
                            const newMonHp = Math.max(0, curMonHp - reflectDmg);
                            result.monsterUpdates!.hp = newMonHp;
                            if (newMonHp <= 0) result.monsterDied = true;
                        }
                    });
                }
            });

            // --- Armor Effect (On Hit) ---
            const armor = player.armor;
            if (armor?.armorEffect) {
                const ae = armor.armorEffect;

                // 受擊時獲得 Buff (例如 haste)
                if (ae.onHitBuff) {
                    const newBuffs = this.applyBuff(player, ae.onHitBuff, ae.onHitBuffDuration || 4, false);
                    result.playerUpdates!.buffs = newBuffs;
                    result.floatingTexts.push({ text: '加速！', type: 'buff', target: 'player', color: 'text-cyan-400' });
                }

                // 受擊時回復 MaxHP 百分比
                if (ae.onHitHealPercent) {
                    const healAmount = Math.floor(stats.maxHp * ae.onHitHealPercent);
                    const newHp = Math.min(stats.maxHp, (result.playerUpdates?.hp ?? currentHp) + healAmount);
                    result.playerUpdates!.hp = newHp;
                    result.floatingTexts.push({ text: `+${healAmount}`, type: 'heal', target: 'player' });
                }

                // 受擊時 x% 機率補滿護盾
                if (ae.onHitShieldRefill && Math.random() < ae.onHitShieldRefill) {
                    result.playerUpdates!.shield = stats.maxShield;
                    result.floatingTexts.push({ text: '護盾滿！', type: 'shield', target: 'player' });
                    result.logs.push('護盾奇蹟般地恢復了！');
                }

                // 受擊時 x% 機率冰凍敵人
                if (ae.onHitFreezeChance && Math.random() < ae.onHitFreezeChance) {
                    const curEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
                    const newEffects = this.applyStatus({ statusEffects: curEffects }, 'frozen');
                    result.monsterUpdates!.statusEffects = newEffects;
                    result.floatingTexts.push({ text: '❄️Frozen', type: 'frozen', target: 'monster' });
                    result.logs.push(`${monster.name} 被冰凍了！`);
                }
            }

            // === 新增: 狂暴符文效果 (berserk_on_hit，受傷時機率觸發自身狂暴) ===
            const berserkOnHitChance = this.getStackedChance(player, 'berserk_on_hit');
            if (berserkOnHitChance > 0 && Math.random() < berserkOnHitChance) {
                if (!this.hasBuff(player, 'berserk')) {
                    const currentBuffs = result.playerUpdates?.buffs || player.buffs || [];
                    const newBuffs = this.applyBuff({ buffs: currentBuffs }, 'berserk', 8, false);
                    result.playerUpdates!.buffs = newBuffs;
                    result.floatingTexts.push({ text: '💢狂暴！', type: 'buff', target: 'player', color: 'text-red-600' });
                    result.logs.push('狂暴符文發動！進入狂暴狀態！');
                }
            }
        }

        // --- 怪物擊中效果 (onHitEffect) ---
        if (!result.playerDied && monster.onHitEffect) {
            const effect = monster.onHitEffect;

            const statusIcons: Record<string, string> = {
                'poison': '🧪中毒',
                'burn': '🔥燃燒',
                'stun': '💫暈眩',
                'frozen': '❄️冰凍',
                'bleed': '🩸流血'
            };

            const buffIcons: Record<string, string> = {
                'double_strike': '⚔️連擊',
                'evasion_stance': '💨迴避',
                'haste': '⚡加速',
                'counter_stance': '🛡️格擋',
                'morale': '✊士氣',
                'fortify': '🛡️堅韌',
                'berserk': '😡狂暴'
            };

            // === 新版多重異常處理 (優先) ===
            if (effect.applyStatuses && effect.applyStatuses.length > 0) {
                for (const statusEntry of effect.applyStatuses) {
                    if (Math.random() < statusEntry.chance) {
                        // 檢查免疫
                        if (this.hasStatusImmunity(player, statusEntry.status)) {
                            result.floatingTexts.push({ text: '免疫！', type: 'buff', target: 'player', color: 'text-green-400' });
                            result.logs.push(`你免疫了${statusIcons[statusEntry.status] || statusEntry.status}狀態！`);
                            continue;
                        }
                        const currentEffects = result.playerUpdates?.statusEffects || player.statusEffects || [];
                        result.playerUpdates!.statusEffects = this.applyStatus({ statusEffects: currentEffects }, statusEntry.status);

                        const statusName = statusIcons[statusEntry.status] || statusEntry.status;
                        result.floatingTexts.push({ text: statusName, type: statusEntry.status as any, target: 'player' });
                        result.logs.push(`${monster.name} 的攻擊使你陷入${statusName}狀態！`);
                    }
                }
            }
            // === 舊版單一異常 (向後兼容) ===
            else if (effect.applyStatus && Math.random() < (effect.statusChance || 0)) {
                // 檢查免疫
                if (this.hasStatusImmunity(player, effect.applyStatus)) {
                    result.floatingTexts.push({ text: '免疫！', type: 'buff', target: 'player', color: 'text-green-400' });
                    result.logs.push(`你免疫了${statusIcons[effect.applyStatus] || effect.applyStatus}狀態！`);
                } else {
                    const currentEffects = result.playerUpdates?.statusEffects || player.statusEffects || [];
                    result.playerUpdates!.statusEffects = this.applyStatus({ statusEffects: currentEffects }, effect.applyStatus);

                    const statusName = statusIcons[effect.applyStatus] || effect.applyStatus;
                    result.floatingTexts.push({ text: statusName, type: effect.applyStatus as any, target: 'player' });
                    result.logs.push(`${monster.name} 的攻擊使你陷入${statusName}狀態！`);
                }
            }

            // === 新版多重 Buff 處理 (優先) ===
            if (effect.applySelfBuffs && effect.applySelfBuffs.length > 0) {
                for (const buffEntry of effect.applySelfBuffs) {
                    if (Math.random() < buffEntry.chance) {
                        const currentBuffs = result.monsterUpdates?.buffs || monster.buffs || [];
                        result.monsterUpdates!.buffs = this.applyBuff({ buffs: currentBuffs }, buffEntry.buff, 4, true);

                        const buffName = buffIcons[buffEntry.buff] || buffEntry.buff;
                        result.floatingTexts.push({ text: buffName, type: 'buff', target: 'monster', color: 'text-orange-400' });
                        result.logs.push(`${monster.name} 進入了${buffName}態勢！`);
                    }
                }
            }
            // === 舊版單一 Buff (向後兼容) ===
            else if (effect.applySelfBuff && Math.random() < (effect.selfBuffChance || 0)) {
                const currentBuffs = result.monsterUpdates?.buffs || monster.buffs || [];
                result.monsterUpdates!.buffs = this.applyBuff({ buffs: currentBuffs }, effect.applySelfBuff, 4, true);

                const buffName = buffIcons[effect.applySelfBuff] || effect.applySelfBuff;
                result.floatingTexts.push({ text: buffName, type: 'buff', target: 'monster', color: 'text-orange-400' });
                result.logs.push(`${monster.name} 進入了${buffName}態勢！`);
            }
        }

        // --- Death Save (不朽戰衣效果) ---
        // 判定邏輯：受傷「前」的當前HP必須>50%時才會觸發不朽效果
        // 例：maxHP=100, 當前HP=49時受致命傷 → 不觸發（49<50）
        // 例：maxHP=100, 當前HP=100時受致命傷 → 觸發，HP剩1
        if (result.playerDied && player.armor?.armorEffect?.deathSave) {
            // player.hp 是這次受傷「前」的HP（還沒被扣血的狀態）
            const hpPercentBeforeDamage = player.hp / stats.maxHp;

            // 只有受傷「前」當前HP超過50%時才會觸發不朽效果
            if (hpPercentBeforeDamage > 0.5) {
                result.playerDied = false;
                result.playerUpdates!.hp = 1;
                result.floatingTexts.push({ text: '不朽！', type: 'buff', target: 'player', color: 'text-yellow-400' });
                result.logs.push('不朽發動！你奇蹟般地存活下來！');
            }
            // 如果受傷前當前HP就已經<=50%，則不朽戰衣不觸發，正常死亡
        }

        return result;
    }

    // 4. 計算武器戰技 (加入異常狀態施加示範：法杖戰技附加冰凍，劍戰技附加燃燒)
    static calculateWeaponArt(player: any, monster: any): BattleResult | null {
        // ... (Keep existing implementation for calculateWeaponArt)
        if (!player.weapon) return null;

        const stats = calculateStats(player);
        const art = WEAPON_ARTS[player.weapon.category];
        if (!art) return null;

        const result: BattleResult = {
            logs: [],
            floatingTexts: [],
            effects: {},
            playerUpdates: {},
            monsterUpdates: {},
            cooldowns: { weapon: art.cooldown || 8 }
        };

        // 處理流血反噬
        this.applyBleedSelfDamage(player, result, true);
        if (result.playerDied) return result;

        if (player.weapon.category === 'sword') {
            const dmg = Math.floor(stats.atk * 0.5);

            // === 新增: 奧術符文效果 (skill_amp，戰技傷害增加) ===
            const skillAmpData = this.getAffixStackedValue(player, 'skill_amp');
            let artDmg = dmg;
            if (skillAmpData.count > 0) {
                artDmg = Math.floor(dmg * (1 + skillAmpData.value));
            }

            // 戰技計算狀態：劍類戰技有機率附加流血
            if (Math.random() < 0.5) {
                const newEffects = this.applyStatus(monster, 'bleed');
                result.monsterUpdates!.statusEffects = newEffects;
                result.logs.push(`${monster.name} 流血了！`);
                result.floatingTexts.push({ text: '🩸Bleed', type: 'bleed', target: 'monster' });
            }

            // 傷害計算 (需考慮怪物身上的現有狀態)
            let finalDmg = artDmg;
            const mEffects = monster.statusEffects || [];

            const burnEffect = mEffects.find((e: StatusEffect) => e.type === 'burn');
            if (burnEffect) finalDmg = Math.floor(finalDmg * (1 + 0.04 * burnEffect.stacks));

            const frozenIndex = mEffects.findIndex((e: StatusEffect) => e.type === 'frozen');
            if (frozenIndex >= 0) {
                finalDmg *= 2;
                result.floatingTexts.push({ text: 'Shatter!', type: 'crit', target: 'monster' });

                let effectsToUpdate = result.monsterUpdates!.statusEffects || [...mEffects];
                effectsToUpdate = effectsToUpdate.filter(e => e.type !== 'frozen');
                result.monsterUpdates!.statusEffects = effectsToUpdate;
            }

            const newMonsterHp = (result.monsterUpdates?.hp ?? monster.hp) - finalDmg;

            result.monsterUpdates!.hp = Math.max(0, newMonsterHp);
            result.effects = { monsterShake: true, hitFlash: true };
            result.floatingTexts.push({ text: `-${finalDmg}`, type: 'damage', target: 'monster' });
            result.logs.push(`⚔️ ${art.name}！造成 ${finalDmg} 點快速傷害！`);

            if (finalDmg > (player.maxDamage || 0)) {
                result.playerUpdates!.maxDamage = finalDmg;
            }
            if (newMonsterHp <= 0) result.monsterDied = true;

        } else if (player.weapon.category === 'staff') {
            const shieldGain = Math.floor(stats.matk * 0.8);
            result.playerUpdates!.shield = (player.shield || 0) + shieldGain;
            result.floatingTexts.push({ text: `+${shieldGain}`, type: 'shield', target: 'player' });
            result.logs.push(`⚔️ ${art.name}！獲得 ${shieldGain} 點護盾！`);

        } else if (player.weapon.category === 'dagger') {
            // Dagger 戰技：賦予連擊 Buff
            const newBuffs = this.applyBuff(player, 'double_strike', 999, true);
            result.playerUpdates!.buffs = newBuffs;
            result.floatingTexts.push({ text: '連擊！', type: 'buff', target: 'player', color: 'text-yellow-400' });
            result.logs.push(`🗡️ ${art.name}！獲得「連擊」效果，下次普攻將連續攻擊2次！`);

        } else if (player.weapon.category === 'bow') {
            // Bow 戰技：賦予迴避態勢 Buff
            const newBuffs = this.applyBuff(player, 'evasion_stance', 999, true);
            result.playerUpdates!.buffs = newBuffs;
            result.floatingTexts.push({ text: '迴避態勢！', type: 'buff', target: 'player', color: 'text-cyan-400' });
            result.logs.push(`🏹 ${art.name}！獲得「迴避態勢」效果，將完美閃避下一次攻擊！`);

        } else if (player.weapon.category === 'mace') {
            // Mace 戰技：造成傷害並暈眩
            const dmg = Math.floor(stats.atk * 0.5);

            // === 新增: 奧術符文效果 (skill_amp，戰技傷害增加) ===
            const skillAmpData = this.getAffixStackedValue(player, 'skill_amp');
            let artDmg = dmg;
            if (skillAmpData.count > 0) {
                artDmg = Math.floor(dmg * (1 + skillAmpData.value));
            }

            // 傷害計算
            let finalDmg = artDmg;
            const mEffects = monster.statusEffects || [];

            const burnEffect = mEffects.find((e: StatusEffect) => e.type === 'burn');
            if (burnEffect) finalDmg = Math.floor(finalDmg * (1 + 0.04 * burnEffect.stacks));

            const frozenIndex = mEffects.findIndex((e: StatusEffect) => e.type === 'frozen');
            if (frozenIndex >= 0) {
                finalDmg *= 2;
                result.floatingTexts.push({ text: 'Shatter!', type: 'crit', target: 'monster' });
                let effectsToUpdate = result.monsterUpdates!.statusEffects || [...mEffects];
                effectsToUpdate = effectsToUpdate.filter(e => e.type !== 'frozen');
                result.monsterUpdates!.statusEffects = effectsToUpdate;
            }

            const newMonsterHp = (result.monsterUpdates?.hp ?? monster.hp) - finalDmg;
            result.monsterUpdates!.hp = Math.max(0, newMonsterHp);
            result.effects = { monsterShake: true, hitFlash: true };
            result.floatingTexts.push({ text: `-${finalDmg}`, type: 'damage', target: 'monster' });

            // 施加暈眩
            if (newMonsterHp > 0) {
                const currentEffects = result.monsterUpdates?.statusEffects || monster.statusEffects || [];
                result.monsterUpdates!.statusEffects = this.applyStatus({ statusEffects: currentEffects }, 'stun');
                result.floatingTexts.push({ text: '💫Stun', type: 'stun', target: 'monster' });
            }

            result.logs.push(`🔨 ${art.name}！造成 ${finalDmg} 點傷害並暈眩敵人！`);

            if (finalDmg > (player.maxDamage || 0)) {
                result.playerUpdates!.maxDamage = finalDmg;
            }
            if (newMonsterHp <= 0) result.monsterDied = true;
        }

        return result;
    }

    // 5. 計算職業技能
    static calculateClassSkill(player: any, monster: any): BattleResult {
        // ... (Keep existing implementation for calculateClassSkill)
        const stats = calculateStats(player);
        const classData = CLASSES[player.classKey];
        const skill = CLASS_SKILLS[classData.skillId];

        const result: BattleResult = {
            logs: [],
            floatingTexts: [],
            effects: { monsterShake: true, hitFlash: true },
            playerUpdates: {},
            monsterUpdates: {},
            cooldowns: { skill: skill.cooldown || 5 }
        };

        // 處理流血反噬
        this.applyBleedSelfDamage(player, result, true);
        if (result.playerDied) return result;

        let skillDmg = 0;
        let skillLog = '';

        // 技能附加狀態邏輯
        switch (player.classKey) {
            case 'knight':
                // 暈眩
                skillDmg = Math.floor(stats.atk * 0.5 + stats.def * 2);
                skillLog = `${skill.name}造成 ${skillDmg} 傷害並暈眩敵人！`;
                result.monsterUpdates!.statusEffects = this.applyStatus(monster, 'stun');
                result.floatingTexts.push({ text: '💫Stun', type: 'stun', target: 'monster' });
                break;
            case 'rogue':
                // 中毒
                skillDmg = Math.floor(stats.atk * 1.2);
                result.floatingTexts.push({ text: 'CRIT!', type: 'crit', target: 'monster' });
                skillLog = `${skill.name}精準命中弱點，造成 ${skillDmg} 傷害並中毒感染！`;
                result.monsterUpdates!.statusEffects = this.applyStatus(monster, 'poison');
                result.monsterUpdates!.statusEffects = this.applyStatus({ statusEffects: result.monsterUpdates!.statusEffects }, 'poison'); // 雙層毒
                result.floatingTexts.push({ text: '🧪Poison', type: 'poison', target: 'monster' });
                break;
            case 'mage':
                // 燃燒
                skillDmg = Math.floor(stats.matk * 1.5);
                skillLog = `${skill.name}！造成 ${skillDmg} 傷害並燃燒！`;
                result.monsterUpdates!.statusEffects = this.applyStatus(monster, 'burn');
                result.floatingTexts.push({ text: '🔥Burn', type: 'burn', target: 'monster' });
                break;
            case 'challenger':
                // 這裡要小心累加可能已經存在的 HP 扣除 (來自流血)
                const currentHp = result.playerUpdates!.hp ?? player.hp;
                const hpCost = Math.floor(player.hp * 0.2);
                result.playerUpdates!.hp = currentHp - hpCost;

                result.floatingTexts.push({ text: `-${hpCost}`, type: 'damage', target: 'player' });
                skillDmg = Math.floor(stats.atk * 2 + hpCost * 2);
                skillLog = `犧牲 ${hpCost} 生命造成 ${skillDmg} 毀滅性傷害！`;

                if ((result.playerUpdates!.hp as number) <= 0) result.playerDied = true;
                break;
        }

        // === 新增: 奧術符文效果 (skill_amp，技能傷害增加) ===
        const skillAmpData = this.getAffixStackedValue(player, 'skill_amp');
        if (skillAmpData.count > 0) {
            skillDmg = Math.floor(skillDmg * (1 + skillAmpData.value));
        }

        // --- 傷害計算與狀態互動 ---
        const mEffects = monster.statusEffects || [];

        // 燃燒增傷
        const burnEffect = mEffects.find((e: StatusEffect) => e.type === 'burn');
        if (burnEffect) skillDmg = Math.floor(skillDmg * (1 + 0.04 * burnEffect.stacks));

        // 冰凍雙倍
        const frozenIndex = mEffects.findIndex((e: StatusEffect) => e.type === 'frozen');
        if (frozenIndex >= 0) {
            skillDmg *= 2;
            result.floatingTexts.push({ text: 'Shatter!', type: 'crit', target: 'monster' });
            result.logs.push('冰凍碎裂！造成雙倍傷害！');

            // 移除冰凍
            let effects = result.monsterUpdates!.statusEffects || [...mEffects];
            effects = effects.filter(e => e.type !== 'frozen');
            result.monsterUpdates!.statusEffects = effects;
        }

        const newMonsterHp = (result.monsterUpdates?.hp ?? monster.hp) - skillDmg;
        result.monsterUpdates!.hp = Math.max(0, newMonsterHp);
        result.floatingTexts.push({ text: `-${skillDmg}`, type: 'crit', target: 'monster' });
        result.logs.push(`✨ ${skillLog}`);

        if (skillDmg > (player.maxDamage || 0)) {
            result.playerUpdates!.maxDamage = skillDmg;
        }

        if (newMonsterHp <= 0) result.monsterDied = true;

        return result;
    }

    // 6. 使用藥水
    static usePotion(player: any): BattleResult {
        const stats = calculateStats(player);
        const healAmount = Math.floor(stats.maxHp * 0.35);
        const newHp = Math.min(player.hp + healAmount, stats.maxHp);

        return {
            logs: [`莉莉將恢復藥水砸向你，恢復 ${healAmount} HP！`],
            floatingTexts: [{ text: `+${healAmount}`, type: 'heal', target: 'player' }],
            effects: {},
            playerUpdates: { hp: newHp, potions: player.potions - 1 }
        };
    }
}