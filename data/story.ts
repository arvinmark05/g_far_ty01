
import { StoryScript } from '../types';

// 圖片需放在 public/img/ 資料夾，使用 BASE_URL 確保 GitHub Pages 部署後路徑正確
const BASE = import.meta.env.BASE_URL;
const IMG_GUIDE_NORMAL = `${BASE}img/smith_01.png`;
const IMG_SMITH_NORMAL = `${BASE}img/smith_02.png`;
const IMG_SMITH_HAPPY = `${BASE}img/smith_02.png`;
const IMG_VILLAGE_HEAD = `${BASE}img/smith_02.png`;

export const STORY_SCRIPTS: StoryScript[] = [
  {
    id: 'intro',
    priority: 100,
    condition: (player, gameState) => player.storyProgress === 0 && gameState === 'village',
    lines: [
      { speakerName: '神秘引導者', text: '醒醒吧，冒險者...', image: IMG_GUIDE_NORMAL },
      { speakerName: '神秘引導者', text: '這座地下城充滿了未知的危險與機遇。', image: IMG_GUIDE_NORMAL },
      { speakerName: '神秘引導者', text: '我是這座村莊的引路人。在你深入探索之前，請務必做好準備。', image: IMG_GUIDE_NORMAL, emotion: 'normal' },
      { speakerName: '神秘引導者', text: '去吧，展現你的勇氣！', image: IMG_GUIDE_NORMAL, emotion: 'happy' }
    ],
    onFinish: (player) => ({ storyProgress: 1 })
  },
  {
    id: 'first_return',
    priority: 90,
    condition: (player, gameState, depth) => player.storyProgress === 1 && gameState === 'village' && depth > 0,
    lines: [
      { speakerName: '武器店老闆', text: '呦！看來你活著回來了！', image: IMG_SMITH_HAPPY, emotion: 'happy' },
      { speakerName: '武器店老闆', text: '我是這裡的鐵匠。如果你在地下城找到了什麼好素材，記得來找我強化裝備。', image: IMG_SMITH_NORMAL },
      { speakerName: '武器店老闆', text: '沒有好的裝備，你是走不遠的。', image: IMG_SMITH_NORMAL }
    ],
    onFinish: (player) => ({ storyProgress: 2 })
  },
  {
    id: 'depth_10_unlock',
    priority: 80,
    condition: (player, gameState, depth, maxDepth) => player.storyProgress === 2 && gameState === 'village' && maxDepth >= 10,
    lines: [
      { speakerName: '村長', text: '難以置信... 你竟然到達了第 10 層？', image: IMG_VILLAGE_HEAD, emotion: 'surprise' },
      { speakerName: '村長', text: '自從上次的遠征隊全軍覆沒後，已經很久沒有人能到達那種深度了。', image: IMG_VILLAGE_HEAD },
      { speakerName: '村長', text: '請收下這個，這或許能幫助你面對接下來的惡夢。', image: IMG_VILLAGE_HEAD },
      { speakerName: '系統', text: '獲得 500 金幣！', image: '' }
    ],
    onFinish: (player) => ({ storyProgress: 3, gold: player.gold + 500 })
  }
];
