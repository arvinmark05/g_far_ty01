
import { calculateStats, getRefinedStat, calculateDamage } from './gameFormulas';
import { CLASS_SKILLS, WEAPON_ARTS } from '../data/skills';
import { CLASSES } from '../data/classes';
import { FloatingText, StatusEffect, StatusType, Item } from '../types';
import { AFFIXES } from '../data/affixes';

export interface BattleResult {
    playerUpdates?: Partial<any>; // hp, shield, maxDamage...
    monsterUpdates?: Partial<any>; // hp...
    logs: string[];
    floatingTexts: { text: string, type: 'damage' | 'heal' | 'crit' | 'miss' | 'shield', target: 'player' | 'monster', color?: string }[];
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

    // --- 狀態異常核心邏輯 ---

    // 施加狀態
    static applyStatus(entity: any, type: StatusType): StatusEffect[] {
        const effects = [...(entity.statusEffects || [])];
        const existingIndex = effects.findIndex(e => e.type === type);

        if (existingIndex >= 0) {
            // 已存在，刷新持續時間並疊加
            const effect = { ...effects[existingIndex] };

            if (type === 'poison') {
                effect.stacks = Math.min(10, effect.stacks + 1);
                effect.duration = 4.0;
            } else if (type === 'burn') {
                effect.stacks = Math.min(3, effect.stacks + 1);
                effect.duration = 4.0;
            } else if (type === 'stun') {
                effect.duration = 1.0; // 不疊加，僅刷新
            } else if (type === 'frozen') {
                effect.duration = 2.0; // 不疊加，僅刷新
            } else if (type === 'bleed') {
                effect.stacks = Math.min(5, effect.stacks + 1);
                effect.duration = 4.0;
            }

            effects[existingIndex] = effect;
        } else {
            // 新增狀態
            let duration = 4.0;
            if (type === 'stun') duration = 1.0;
            if (type === 'frozen') duration = 2.0;

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

    // 1. 處理時間流逝 (包含 ATB, Cooldowns, 狀態異常 Tick)
    static processGameTick(player: any, monster: any, currentSkillCD: number, currentWeaponCD: number): BattleTickResult {
        const stats = calculateStats(player);

        // 處理狀態異常 Tick
        const pStatus = this.processEntityStatus(player, true);
        const mStatus = this.processEntityStatus(monster, false);

        // 檢查是否無法行動 (Stun / Frozen)
        const isPlayerStopped = pStatus.effects.some(e => e.type === 'stun' || e.type === 'frozen');
        const isMonsterStopped = mStatus.effects.some(e => e.type === 'stun' || e.type === 'frozen');

        // 構建 DoT 結果
        let tickResult: BattleResult | undefined = undefined;
        if (pStatus.damage > 0 || mStatus.damage > 0 || pStatus.effects.length !== (player.statusEffects?.length || 0) || mStatus.effects.length !== (monster.statusEffects?.length || 0)) {
            tickResult = {
                logs: [...pStatus.logs, ...mStatus.logs],
                floatingTexts: [...pStatus.floatTexts, ...mStatus.floatTexts],
                effects: {},
                playerUpdates: { statusEffects: pStatus.effects },
                monsterUpdates: { statusEffects: mStatus.effects }
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

        return {
            playerAtbDelta: isPlayerStopped ? 0 : stats.speed * 0.1,
            monsterAtbDelta: isMonsterStopped ? 0 : monster.speed * 0.1,
            skillCdDelta: Math.max(0, currentSkillCD - 0.1) - currentSkillCD,
            weaponCdDelta: Math.max(0, currentWeaponCD - 0.1) - currentWeaponCD,
            tickResult
        };
    }

    // 2. 計算玩家普通攻擊 (包含被動、暴擊、燃燒加成、冰凍加成與移除)
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

        let playerDmg = 0;
        let attackType = '普通攻擊';
        let isCrit = false;
        let physicalDmg = stats.atk;
        let magicalDmg = 0;

        // 武器特效被動
        if (player.weapon && player.weapon.skill) {
            const skill = player.weapon.skill;
            if (Math.random() < (skill.triggerRate || 0)) {
                attackType = skill.name;
                physicalDmg = stats.atk * (skill.atkMultiplier || 0);
                magicalDmg = stats.matk * (skill.matkMultiplier || 0);
                if (skill.atkMultiplier === 0) physicalDmg = 0;
            }
        }

        // --- Affix Effects (Combat Stats: Crit, etc.) ---
        // 使用 stats.critChance 作為基礎，包含 AGI 加成
        let critChance = stats.critChance;
        let critDamageMult = 1.5; // Base 150%

        // Rogue Base (職業額外加成)
        if (player.classKey === 'rogue') {
            critChance += 0.15;
        }

        // 裝備詞綴加成
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
        }

        let rawDmg = physicalDmg + magicalDmg;

        // --- 狀態異常傷害計算 (對怪物) ---
        const mEffects = monster.statusEffects || [];

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

        // 使用減傷公式計算最終傷害
        const monsterDef = monster.def || 0;
        playerDmg = calculateDamage(rawDmg, monsterDef);
        const newMonsterHp = (result.monsterUpdates?.hp ?? monster.hp) - playerDmg;

        // 更新結果
        result.floatingTexts.push({
            text: `-${playerDmg}`,
            type: isCrit ? 'crit' : 'damage',
            target: 'monster'
        });

        result.logs.push(`你對 ${monster.name} 造成 ${playerDmg} 點傷害！`);
        result.effects = { monsterShake: true, hitFlash: true };
        result.monsterUpdates!.hp = Math.max(0, newMonsterHp);

        if (playerDmg > (player.maxDamage || 0)) {
            result.playerUpdates!.maxDamage = playerDmg;
        }

        if (newMonsterHp <= 0) {
            result.monsterDied = true;
        }

        // --- Affix Effects (On Hit) ---
        if (player.weapon && player.weapon.affixes) {
            player.weapon.affixes.forEach((affixId: string) => {
                const affix = AFFIXES[affixId];
                if (affix && affix.type === 'passive') {
                    // 吸血
                    if (affix.passiveEffect === 'life_steal') {
                        const healAmount = Math.floor(playerDmg * 0.1);
                        if (healAmount > 0) {
                            const currentHp = result.playerUpdates?.hp ?? player.hp;
                            const newHp = Math.min(stats.maxHp, currentHp + healAmount);
                            result.playerUpdates = { ...result.playerUpdates, hp: newHp };
                            result.floatingTexts.push({ text: `+${healAmount}`, type: 'heal', target: 'player' });
                        }
                    }
                    // 放血
                    if (affix.passiveEffect === 'bleed_on_hit') {
                        const currentMonsterEffects = result.monsterUpdates?.statusEffects || monster.statusEffects;
                        const newEffects = this.applyStatus({ statusEffects: currentMonsterEffects }, 'bleed');
                        result.monsterUpdates = { ...result.monsterUpdates, statusEffects: newEffects };
                        result.floatingTexts.push({ text: '🩸Bleed', type: 'crit', target: 'monster', color: 'text-red-600' });
                    }
                }
            });
        }

        return result;
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

        // 上下限 5% ~ 95%
        dodgeChance = Math.min(0.95, Math.max(0.05, dodgeChance));

        if (Math.random() < dodgeChance) {
            result.floatingTexts.push({ text: 'MISS', type: 'miss', target: 'player' });
            result.logs.push(`你閃避了 ${monster.name} 的攻擊！`);
            return result;
        }

        // 傷害計算 (使用減傷公式)
        let damage = calculateDamage(monster.atk, stats.def);

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
            });
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

            // 戰技計算狀態 (示範：劍類戰技有機率附加燃燒)
            if (Math.random() < 0.5) {
                const newEffects = this.applyStatus(monster, 'burn');
                result.monsterUpdates!.statusEffects = newEffects;
                result.logs.push(`${monster.name} 燃燒了！`);
                result.floatingTexts.push({ text: '🔥Burn', type: 'crit', target: 'monster' });
            }

            // 傷害計算 (需考慮怪物身上的現有狀態)
            let finalDmg = dmg;
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
            const shieldGain = Math.floor(stats.matk * 0.5);
            result.playerUpdates!.shield = (player.shield || 0) + shieldGain;
            result.floatingTexts.push({ text: `+${shieldGain}`, type: 'shield', target: 'player' });
            result.logs.push(`⚔️ ${art.name}！獲得 ${shieldGain} 點護盾！`);

            // 法杖戰技：附加冰凍
            if (Math.random() < 0.8) {
                const newEffects = this.applyStatus(monster, 'frozen');
                result.monsterUpdates!.statusEffects = newEffects;
                result.logs.push(`${monster.name} 被凍結了！`);
                result.floatingTexts.push({ text: '❄️Frozen', type: 'crit', target: 'monster' });
            }
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
                skillDmg = Math.floor(stats.atk * 1.2 + stats.def * 2);
                skillLog = `${skill.name}造成 ${skillDmg} 傷害並暈眩敵人！`;
                result.monsterUpdates!.statusEffects = this.applyStatus(monster, 'stun');
                result.floatingTexts.push({ text: '💫Stun', type: 'crit', target: 'monster' });
                break;
            case 'rogue':
                // 中毒
                skillDmg = Math.floor(stats.atk * 2.5);
                result.floatingTexts.push({ text: 'CRIT!', type: 'crit', target: 'monster' });
                skillLog = `${skill.name}精準命中弱點，造成 ${skillDmg} 傷害並中毒感染！`;
                result.monsterUpdates!.statusEffects = this.applyStatus(monster, 'poison');
                result.monsterUpdates!.statusEffects = this.applyStatus({ statusEffects: result.monsterUpdates!.statusEffects }, 'poison'); // 雙層毒
                result.floatingTexts.push({ text: '🧪Poison', type: 'crit', target: 'monster' });
                break;
            case 'mage':
                // 燃燒
                skillDmg = Math.floor(stats.matk * 3.5);
                skillLog = `${skill.name}釋放出毀滅性能量，造成 ${skillDmg} 傷害並燃燒！`;
                result.monsterUpdates!.statusEffects = this.applyStatus(monster, 'burn');
                result.floatingTexts.push({ text: '🔥Burn', type: 'crit', target: 'monster' });
                break;
            case 'challenger':
                // 這裡要小心累加可能已經存在的 HP 扣除 (來自流血)
                const currentHp = result.playerUpdates!.hp ?? player.hp;
                const hpCost = Math.floor(player.hp * 0.2);
                result.playerUpdates!.hp = currentHp - hpCost;

                result.floatingTexts.push({ text: `-${hpCost}`, type: 'damage', target: 'player' });
                skillDmg = Math.floor(stats.atk * 3 + hpCost * 2);
                skillLog = `犧牲 ${hpCost} 生命造成 ${skillDmg} 毀滅性傷害！`;

                if ((result.playerUpdates!.hp as number) <= 0) result.playerDied = true;
                break;
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
        const healAmount = Math.floor(stats.maxHp * 0.5);
        const newHp = Math.min(player.hp + healAmount, stats.maxHp);

        return {
            logs: [`使用藥水恢復 ${healAmount} HP！`],
            floatingTexts: [{ text: `+${healAmount}`, type: 'heal', target: 'player' }],
            effects: {},
            playerUpdates: { hp: newHp, potions: player.potions - 1 }
        };
    }
}