
import { STORY_SCRIPTS } from '../data/story';
import { StoryScript, GameFlags } from '../types';

export class StoryHandler {
  /**
   * 檢查是否有故事腳本需要觸發
   * @param player - 玩家狀態
   * @param gameState - 當前遊戲狀態
   * @param currentDepth - 當前樓層
   * @param maxDepth - 最大到達樓層
   * @param phase - 觸發階段 (戰前/戰後/營地)
   */
  static checkTriggers(
    player: any,
    gameState: string,
    currentDepth: number,
    maxDepth: number,
    phase?: 'before_battle' | 'after_battle' | 'camp'
  ): StoryScript | null {
    if (!player) return null;

    // 根據 priority 排序，優先檢查高優先級的腳本
    const sortedScripts = [...STORY_SCRIPTS].sort((a, b) => b.priority - a.priority);

    for (const script of sortedScripts) {
      // 1. 檢查 requireFlags 條件
      if (script.requireFlags) {
        const flags = player.flags || {};
        const allFlagsMatch = Object.entries(script.requireFlags).every(
          ([key, value]) => flags[key as keyof GameFlags] === value
        );
        if (!allFlagsMatch) continue;
      }

      // 2. 檢查自定義 condition
      if (script.condition(player, gameState, currentDepth, maxDepth, phase)) {
        return script;
      }
    }

    return null;
  }

  /**
   * 處理腳本完成後的副作用
   * @param script - 完成的腳本
   * @param player - 玩家當前狀態
   * @returns - 需要更新的玩家屬性
   */
  static processScriptFinish(script: StoryScript, player: any): Partial<any> {
    let updates: Partial<any> = {};

    // 1. 執行 onFinish callback
    if (script.onFinish) {
      updates = { ...updates, ...script.onFinish(player) };
    }

    // 2. 處理 setFlags
    if (script.setFlags) {
      const currentFlags = player.flags || {};
      updates.flags = { ...currentFlags, ...script.setFlags };
    }

    return updates;
  }
}
