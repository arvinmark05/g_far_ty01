
import { STORY_SCRIPTS } from '../data/story';
import { StoryScript } from '../types';

export class StoryHandler {
  static checkTriggers(player: any, gameState: string, currentDepth: number, maxDepth: number): StoryScript | null {
    if (!player) return null;

    // 根據 priority 排序，優先檢查高優先級的腳本
    const sortedScripts = [...STORY_SCRIPTS].sort((a, b) => b.priority - a.priority);

    for (const script of sortedScripts) {
      if (script.condition(player, gameState, currentDepth, maxDepth)) {
        return script;
      }
    }

    return null;
  }
}
