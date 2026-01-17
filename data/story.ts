
import { StoryScript, GameFlags } from '../types';

// 圖片路徑 - 使用 BASE_URL 確保 GitHub Pages 部署後路徑正確
const BASE = import.meta.env.BASE_URL;
const IMG_GUIDE = `${BASE}img/smith_01.png`; // 女神 (暫用)
const IMG_LILY_NORMAL = `${BASE}img/smith_01.png`;
const IMG_LILY_HAPPY = `${BASE}img/smith_01.png`;
const IMG_LILY_FEAR = `${BASE}img/smith_01.png`;
const IMG_LILY_CRY = `${BASE}img/smith_01.png`;
const IMG_LILY_LEWD = `${BASE}img/smith_01.png`;

// ============================================
// 故事腳本定義
// Priority: 數字越高越優先檢查
// ============================================

export const STORY_SCRIPTS: StoryScript[] = [
  // ============================================
  // A. 序章與村莊
  // ============================================

  {
    id: 'intro',
    priority: 1000, // 最高優先級
    condition: (player, gameState) => player.storyProgress === 0 && gameState === 'village',
    lines: [
      { speakerName: '???', text: '喂喂～能聽到嗎，雜魚？', image: IMG_GUIDE },
      { speakerName: '引導者', text: '啊哈♪ 終於有反應了。歡迎來到這個世界，小廢物～', image: IMG_GUIDE, emotion: 'happy' },
      { speakerName: '引導者', text: '我是負責引導像你這種菜鳥的女神大人喔♥ 感恩戴德吧！', image: IMG_GUIDE },
      { speakerName: '引導者', text: '嘖嘖嘖...看這副弱雞樣...真的能活著走出地下城嗎？', image: IMG_GUIDE, emotion: 'happy' },
      { speakerName: '引導者', text: '算了，反正死掉也是一種娛樂嘛～那麼，你這個雜魚叫什麼名字？', image: IMG_GUIDE, showNameInput: true },
      { speakerName: '引導者', text: '哼～記住了。那就去地下城送死吧，我會在這裡看好戲的♪', image: IMG_GUIDE, emotion: 'happy' },
    ],
    onFinish: (player) => ({ storyProgress: 1 }),
    setFlags: { intro_seen: true }
  },

  {
    id: 'welcome_village',
    priority: 95,
    condition: (player, gameState) => player.storyProgress === 1 && gameState === 'village' && !player.flags?.smith_rescued,
    lines: [
      { speakerName: '???', text: '喂！你是新來的冒險者嗎？', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '我是這村子的鐵匠，叫我莉莉就行。', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '...嗯？幹嘛那樣看我？因為我是矮人族所以很小隻是很正常的！', image: IMG_LILY_NORMAL, emotion: 'angry' },
      { speakerName: '莉莉', text: '哼，別看我這樣，我的鍛造技術可是一流的！等你有錢了就來光顧吧。', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '對了，如果你要去地下城深處...別死得太難看喔。', image: IMG_LILY_HAPPY, emotion: 'happy' },
    ],
    onFinish: (player) => ({ storyProgress: 2 })
  },

  // ============================================
  // B. 救援與商店開啟 (Floor 1-30)
  // ============================================

  {
    id: 'depth_10_unlock',
    priority: 80,
    condition: (player, gameState, depth, maxDepth) =>
      player.storyProgress === 2 && gameState === 'village' && maxDepth >= 10,
    lines: [
      { speakerName: '引導者', text: '哎呀？居然還活著？', image: IMG_GUIDE, emotion: 'surprise' },
      { speakerName: '引導者', text: '我還以為你會在第三層就變成怪物的點心呢～', image: IMG_GUIDE },
      { speakerName: '引導者', text: '看來稍微有點骨氣嘛...那就多掙扎一下讓我開心吧♥', image: IMG_GUIDE, emotion: 'happy' },
      { speakerName: '引導者', text: '繼續往下走的話，會遇到更刺激的事情喔...嘻嘻', image: IMG_GUIDE },
    ],
    onFinish: (player) => ({ storyProgress: 3, gold: player.gold + 200 })
  },

  {
    id: 'lily_rescue_before',
    priority: 200, // 高優先級，戰前事件
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 29 && gameState === 'battle' && phase === 'before_battle' && !player.flags?.smith_rescued,
    lines: [
      { speakerName: '', text: '走進這一層時，傳來一陣淒厲的尖叫聲——', image: '' },
      { speakerName: '???', text: '不要！放開我...嗚嗚...！', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '', text: '你看到一個矮小的身影被一群哥布林包圍...', image: '' },
      { speakerName: '', text: '那是之前在村莊遇到的鐵匠——莉莉！她的工作服已經被撕得破破爛爛...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '有...有人嗎！？救救我——！！', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '', text: '哥布林們發現了你，發出威嚇的叫聲！', image: '' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'lily_rescue_after',
    priority: 200,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 29 && phase === 'after_battle' && !player.flags?.smith_rescued,
    lines: [
      { speakerName: '莉莉', text: '嗚...嗚嗚...太可怕了...', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '莉莉', text: '謝...謝謝你...如果你沒來的話，我就...嗚...', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '莉莉', text: '...抱歉，讓你看到這麼狼狽的樣子...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '我本來只是想來找一些稀有礦石...沒想到會遇上這種事...', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '...真的非常感謝你。我是莉莉，雖然之前見過面了...', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '作為答謝，以後來我的店裡可以給你特別優惠！一定要來喔！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '系統', text: '🏪 商店功能已解鎖！', image: '' },
    ],
    onFinish: (player) => ({ storyProgress: 4 }),
    setFlags: { smith_rescued: true }
  },

  {
    id: 'shop_tutorial',
    priority: 90,
    condition: (player, gameState) =>
      gameState === 'shop' && player.flags?.smith_rescued && !player.flags?.shop_tutorial_seen,
    lines: [
      { speakerName: '莉莉', text: '歡迎光臨～♪ 啊，是你！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '咳咳...之前的事就當沒發生過！現在的我是專業的商人！', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '武器、防具、藥水，這裡應有盡有。只要你有錢！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '...什麼？想賒帳？門都沒有！我可是很守財的矮人喔！', image: IMG_LILY_NORMAL, emotion: 'angry' },
    ],
    onFinish: () => ({}),
    setFlags: { shop_tutorial_seen: true }
  },

  // ============================================
  // C. 尋找秘寶之旅 (Floor 30-500)
  // ============================================

  // --- 背包任務 ---
  {
    id: 'backpack_quest',
    priority: 85,
    condition: (player, gameState) =>
      gameState === 'village' && player.flags?.smith_rescued && !player.flags?.backpack_quest_started && player.storyProgress >= 4,
    lines: [
      { speakerName: '莉莉', text: '啊！等等——！', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '上次在地下城逃跑的時候...我的鐵匠背包掉在那裡了...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '那裡面有很多重要的工具！你能幫我找回來嗎？', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '莉莉', text: '應該是在 50 層左右的營地附近...拜託了！', image: IMG_LILY_NORMAL },
    ],
    onFinish: (player) => ({ storyProgress: 5 }),
    setFlags: { backpack_quest_started: true }
  },

  {
    id: 'backpack_found',
    priority: 100,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 50 && phase === 'camp' && player.flags?.backpack_quest_started && !player.flags?.backpack_found,
    lines: [
      { speakerName: '', text: '在營地附近，你發現了一個沉甸甸的背包...', image: '' },
      { speakerName: '', text: '這一定就是莉莉說的鐵匠背包！裡面都是鍛造工具，難怪這麼重...', image: '' },
      { speakerName: '引導者', text: '哦～找到了那個大胸矮人的東西嗎？', image: IMG_GUIDE },
      { speakerName: '引導者', text: '真是個好人呢...或者說...是想要報酬吧？嘻嘻♪', image: IMG_GUIDE, emotion: 'happy' },
    ],
    onFinish: () => ({}),
    setFlags: { backpack_found: true }
  },

  {
    id: 'lily_join',
    priority: 88,
    condition: (player, gameState) =>
      gameState === 'shop' && player.flags?.backpack_found && !player.flags?.lily_joined,
    lines: [
      { speakerName: '莉莉', text: '！！這是...我的背包！！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '太好了...我還以為再也找不回來了...謝謝你！', image: IMG_LILY_CRY, emotion: 'happy' },
      { speakerName: '莉莉', text: '...其實，有件事想拜託你。', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '在地下城的最深處，據說有一種叫做「深淵火種」的傳說素材...', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '作為鐵匠，那是我畢生的夢想！用它打造的武器一定是最強的！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '...所以、我能跟著你一起冒險嗎？當然，我會用我的技術幫助你的！', image: IMG_LILY_NORMAL },
      { speakerName: '', text: '你點了點頭。', image: '' },
      { speakerName: '莉莉', text: '太好了！那就這麼說定了！從現在起我們就是夥伴了！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '系統', text: '🎉 莉莉加入了隊伍！', image: '' },
    ],
    onFinish: (player) => ({ storyProgress: 6 }),
    setFlags: { lily_joined: true }
  },

  // --- Floor 99-100: 巨魔 ---
  {
    id: 'troll_warning',
    priority: 110,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 99 && phase === 'camp' && player.flags?.lily_joined && !player.flags?.floor_100_cleared && !player.flags?.troll_warning_seen,
    lines: [
      { speakerName: '引導者', text: '呀呵～終於要到第 100 層了呢', image: IMG_GUIDE },
      { speakerName: '引導者', text: '下一層那傢伙很大喔...非常的大♥', image: IMG_GUIDE, emotion: 'happy' },
      { speakerName: '引導者', text: '你那個矮人妹子...會不會被玩壞呢～？好期待啊♪', image: IMG_GUIDE },
    ],
    onFinish: () => ({}),
    setFlags: { troll_warning_seen: true }
  },

  {
    id: 'troll_fear',
    priority: 210,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 100 && phase === 'before_battle' && player.flags?.lily_joined && !player.flags?.floor_100_cleared,
    lines: [
      { speakerName: '', text: '巨大的陰影籠罩了整個房間——一頭巨魔！', image: '' },
      { speakerName: '莉莉', text: '...！！', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '', text: '莉莉的臉色刷地變得蒼白，全身開始顫抖...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '巨...巨魔...以前...我曾經被...那種傢伙...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '被抓住...粗暴地...嗚...不要...不要再想起來了...！', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '', text: '她蹲下身子，淚水開始奪眶而出，臉頰紅得像要燒起來...', image: IMG_LILY_CRY, emotion: 'lewd' },
      { speakerName: '', text: '你站到她身前，舉起武器保護她！', image: '' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'troll_victory',
    priority: 210,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 100 && phase === 'after_battle' && player.flags?.lily_joined && !player.flags?.floor_100_cleared,
    lines: [
      { speakerName: '莉莉', text: '...打、打倒了？真的嗎...？', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '...謝謝你...保護了我...', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '莉莉', text: '...！等等，這是——！', image: IMG_LILY_NORMAL, emotion: 'surprise' },
      { speakerName: '', text: '在巨魔倒下的地方，露出了一座古老的鐵砧...', image: '' },
      { speakerName: '莉莉', text: '這是「古代鐵砧」！傳說中矮人族至寶之一！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '有了這個...我可以幫你強化裝備了！這可是超級稀有的技術！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '系統', text: '🔨 商店「強化」功能已解鎖！', image: '' },
    ],
    onFinish: (player) => ({ storyProgress: 7 }),
    setFlags: { floor_100_cleared: true }
  },

  // --- Floor 101-200: 陰森森林 ---
  {
    id: 'forest_enter',
    priority: 105,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 101 && phase === 'before_battle' && player.flags?.floor_100_cleared && !player.flags?.floor_200_cleared,
    lines: [
      { speakerName: '', text: '環境變得陰暗潮濕，四周都是扭曲的樹木...', image: '' },
      { speakerName: '莉莉', text: '嗚...這裡好恐怖...感覺有什麼東西在盯著我們...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '', text: '莉莉緊緊抓著你的衣角，身體微微顫抖。', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '那個...我可以這樣跟著你嗎...？不、不要走太快喔...！', image: IMG_LILY_FEAR, emotion: 'fear' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'forest_toilet',
    priority: 100,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 120 && phase === 'camp' && player.flags?.floor_100_cleared && !player.flags?.floor_200_cleared,
    lines: [
      { speakerName: '莉莉', text: '那、那個...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '我...想上廁所...但是這裡太可怕了...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '你...你可以陪我去嗎...？不、不是要你看！只是在旁邊守著...！', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '', text: '你別過臉，在附近守護著她...', image: '' },
      { speakerName: '', text: '黑暗中傳來細微的水聲...還有莉莉壓抑的喘息...', image: '' },
      { speakerName: '莉莉', text: '好...好了...謝、謝謝...', image: IMG_LILY_LEWD, emotion: 'lewd' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'necro_warning',
    priority: 110,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 199 && phase === 'camp' && player.flags?.floor_100_cleared && !player.flags?.floor_200_cleared && !player.flags?.necro_warning_seen,
    lines: [
      { speakerName: '引導者', text: '死亡的氣息好重～', image: IMG_GUIDE },
      { speakerName: '引導者', text: '下一層是死靈法師的領域喔...小心別嚇尿了？嘻嘻♪', image: IMG_GUIDE, emotion: 'happy' },
    ],
    onFinish: () => ({}),
    setFlags: { necro_warning_seen: true }
  },

  {
    id: 'necro_battle',
    priority: 220,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 200 && phase === 'before_battle' && player.flags?.floor_100_cleared && !player.flags?.floor_200_cleared,
    lines: [
      { speakerName: '', text: '陰寒的氣息瀰漫整個空間...死靈法師出現了！', image: '' },
      { speakerName: '', text: '無數亡靈的低語灌入腦海——', image: '' },
      { speakerName: '莉莉', text: '嗚...頭好痛...腦袋裡都是聲音...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '莉莉', text: '不要...進到我的腦袋裡...不要...！', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '', text: '莉莉的腿開始發軟，恐懼已經壓過了她的理智...', image: '' },
      { speakerName: '莉莉', text: '啊——！我...我控制不住...不要...！！', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '', text: '一陣溫熱的液體從她的裙下流淌出來...她失禁了。', image: '' },
      { speakerName: '莉莉', text: '嗚嗚...好丟臉...對不起...對不起...', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '', text: '你沒有回頭，只是默默擋在她身前，舉起武器——', image: '' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'necro_victory',
    priority: 220,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 200 && phase === 'after_battle' && player.flags?.floor_100_cleared && !player.flags?.floor_200_cleared,
    lines: [
      { speakerName: '莉莉', text: '...結束了嗎...', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '莉莉', text: '我...剛才...那個...', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '', text: '你遞給她一塊布，沒有多說什麼。', image: '' },
      { speakerName: '莉莉', text: '...謝謝...你沒有嘲笑我...', image: IMG_LILY_NORMAL },
      { speakerName: '', text: '在死靈法師的法杖旁邊，你發現了古老的附魔工具...', image: '' },
      { speakerName: '莉莉', text: '！這個...是「附魔工具」！我聽說過這種東西！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '有了這個，我可以把符文的力量注入裝備裡！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '系統', text: '💎 商店「附魔」功能已解鎖！', image: '' },
    ],
    onFinish: (player) => ({ storyProgress: 8 }),
    setFlags: { floor_200_cleared: true }
  },

  // --- Floor 201-300: 礦山 ---
  {
    id: 'mountain_enter',
    priority: 105,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 201 && phase === 'before_battle' && player.flags?.floor_200_cleared && !player.flags?.floor_300_cleared,
    lines: [
      { speakerName: '', text: '眼前是一片險峻的山脈地形，到處都是裸露的礦脈...', image: '' },
      { speakerName: '莉莉', text: '哇——！這裡...這裡是...！！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '', text: '莉莉的眼睛瞬間亮了起來，整個人都變得不一樣了！', image: '' },
      { speakerName: '莉莉', text: '這是秘銀礦脈！那邊還有精金礦！還有...哇！！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '這裡簡直是矮人的天堂！！我好興奮！！', image: IMG_LILY_HAPPY, emotion: 'happy' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'mountain_mining',
    priority: 100,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 230 && phase === 'camp' && player.flags?.floor_200_cleared && !player.flags?.floor_300_cleared,
    lines: [
      { speakerName: '', text: '莉莉拿出她的鐵鎚，無視危險地到處敲打牆壁...', image: '' },
      { speakerName: '莉莉', text: '叮叮叮～♪ 這裡有礦... 這邊也有...哼哼♪', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '引導者', text: '...看吧，給她找個礦就完全變一個人了呢', image: IMG_GUIDE },
      { speakerName: '引導者', text: '根本不像剛才那個又哭又叫的廢物嘛～', image: IMG_GUIDE, emotion: 'happy' },
      { speakerName: '莉莉', text: '不要打擾我挖礦！！', image: IMG_LILY_NORMAL, emotion: 'angry' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'golem_warning',
    priority: 110,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 299 && phase === 'camp' && player.flags?.floor_200_cleared && !player.flags?.floor_300_cleared && !player.flags?.golem_warning_seen,
    lines: [
      { speakerName: '引導者', text: '古老的氣息...感覺很硬呢', image: IMG_GUIDE },
      { speakerName: '引導者', text: '岩石巨像...這次換你們被砸扁嗎？嘻嘻', image: IMG_GUIDE, emotion: 'happy' },
    ],
    onFinish: () => ({}),
    setFlags: { golem_warning_seen: true }
  },

  {
    id: 'golem_battle',
    priority: 230,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 300 && phase === 'before_battle' && player.flags?.floor_200_cleared && !player.flags?.floor_300_cleared,
    lines: [
      { speakerName: '', text: '巨大的岩石巨像從地面隆起——', image: '' },
      { speakerName: '莉莉', text: '好、好大...！', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '', text: '莉莉本能地往後退...然後掉進了她自己挖的洞裡！', image: '' },
      { speakerName: '莉莉', text: '呀啊——！？', image: IMG_LILY_FEAR, emotion: 'surprise' },
      { speakerName: '', text: '...只露出一顆頭在地面上，表情非常羞恥。', image: '' },
      { speakerName: '莉莉', text: '不...不要管我！快去打倒那傢伙！', image: IMG_LILY_NORMAL, emotion: 'angry' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'golem_victory',
    priority: 230,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 300 && phase === 'after_battle' && player.flags?.floor_200_cleared && !player.flags?.floor_300_cleared,
    lines: [
      { speakerName: '莉莉', text: '可以來拉我出去了嗎...！', image: IMG_LILY_NORMAL, emotion: 'angry' },
      { speakerName: '', text: '你把莉莉從洞裡拉出來...她渾身都是泥土。', image: '' },
      { speakerName: '莉莉', text: '...不要笑！', image: IMG_LILY_NORMAL, emotion: 'angry' },
      { speakerName: '', text: '...不過，在洞裡發現了大量稀有礦石！', image: '' },
      { speakerName: '莉莉', text: '！？這些全是強化用的礦石！！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '哈哈！因禍得福！這下可以在商店販賣強化石了！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '系統', text: '⚒️ 商店新增「強化石」販賣！', image: '' },
    ],
    onFinish: (player) => ({ storyProgress: 9 }),
    setFlags: { floor_300_cleared: true }
  },

  // --- Floor 301-400: 舊文明遺跡 ---
  {
    id: 'ruins_enter',
    priority: 105,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 301 && phase === 'before_battle' && player.flags?.floor_300_cleared && !player.flags?.floor_400_cleared,
    lines: [
      { speakerName: '', text: '古老的文明遺跡...牆上刻著神秘的符文...', image: '' },
      { speakerName: '莉莉', text: '這裡一定有很多值錢的古物...嘿嘿...', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '什麼？我只是想研究歷史！...順便...帶走一點而已...', image: IMG_LILY_NORMAL },
    ],
    onFinish: () => ({})
  },

  {
    id: 'ruins_runes',
    priority: 100,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 340 && phase === 'camp' && player.flags?.floor_300_cleared && !player.flags?.floor_400_cleared,
    lines: [
      { speakerName: '莉莉', text: '看！我找到了這麼多符文石！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '', text: '莉莉得意地展示她搜刮來的戰利品...', image: '' },
      { speakerName: '莉莉', text: '這些每個都價值連城！等我們回去以後就發財了！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '引導者', text: '...真是個貪財的小矮人呢', image: IMG_GUIDE },
      { speakerName: '莉莉', text: '這叫商業頭腦！我是商人！', image: IMG_LILY_NORMAL, emotion: 'angry' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'vampire_warning',
    priority: 110,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 399 && phase === 'camp' && player.flags?.floor_300_cleared && !player.flags?.floor_400_cleared && !player.flags?.vampire_warning_seen,
    lines: [
      { speakerName: '引導者', text: '呀～黑暗又色情的氣息...', image: IMG_GUIDE },
      { speakerName: '引導者', text: '這可是大人的時間喔♥ 小孩子不要偷看嘛～', image: IMG_GUIDE, emotion: 'happy' },
    ],
    onFinish: () => ({}),
    setFlags: { vampire_warning_seen: true }
  },

  {
    id: 'vampire_battle',
    priority: 240,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 400 && phase === 'before_battle' && player.flags?.floor_300_cleared && !player.flags?.floor_400_cleared,
    lines: [
      { speakerName: '', text: '黑暗中，一雙血紅的眼睛亮起——吸血伯爵！', image: '' },
      { speakerName: '', text: '他發動了精神攻擊...一股無法抗拒的力量湧入腦海！', image: '' },
      { speakerName: '莉莉', text: '什...什麼...頭好暈...', image: IMG_LILY_FEAR, emotion: 'fear' },
      { speakerName: '', text: '莉莉的瞳孔逐漸渙散...', image: '' },
      { speakerName: '莉莉', text: '啊...嗯...♥', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '', text: '她陷入了魅惑狀態！雙腿發軟，身體泛起不正常的紅暈...', image: '' },
      { speakerName: '莉莉', text: '哈啊...身體...好熱...嗯...不行...♥', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '', text: '她嬌喘著倒在地上，完全失去了戰鬥力...', image: '' },
      { speakerName: '', text: '只剩你一個人面對吸血伯爵了！', image: '' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'vampire_victory',
    priority: 240,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 400 && phase === 'after_battle' && player.flags?.floor_300_cleared && !player.flags?.floor_400_cleared,
    lines: [
      { speakerName: '', text: '隨著吸血伯爵的消滅，魅惑效果也解除了...', image: '' },
      { speakerName: '莉莉', text: '嗯...？發生什麼...？為什麼我躺在地上...？', image: IMG_LILY_NORMAL, emotion: 'surprise' },
      { speakerName: '', text: '她完全不記得剛才的事...但身體還在微微發熱。', image: '' },
      { speakerName: '莉莉', text: '為什麼...身體好奇怪...熱熱的...', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '', text: '你沒有告訴她發生了什麼，只是轉移話題...', image: '' },
      { speakerName: '', text: '順帶一提，你搜刮了吸血伯爵的寶庫，發現了大量符文！', image: '' },
      { speakerName: '莉莉', text: '！這些符文！我可以在商店販賣這些！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '系統', text: '📿 商店新增「符文石」販賣！', image: '' },
    ],
    onFinish: (player) => ({ storyProgress: 10 }),
    setFlags: { floor_400_cleared: true }
  },

  // --- Floor 401-500: 深淵 ---
  {
    id: 'abyss_enter',
    priority: 105,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 401 && phase === 'before_battle' && player.flags?.floor_400_cleared && !player.flags?.floor_500_cleared,
    lines: [
      { speakerName: '', text: '黑暗荒漠...只剩下火把微弱的光芒...', image: '' },
      { speakerName: '莉莉', text: '...終於快到了嗎...深淵火種...', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '...說起來，我們已經一起走了這麼遠了呢...', image: IMG_LILY_HAPPY, emotion: 'happy' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'abyss_campfire',
    priority: 100,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 450 && phase === 'camp' && player.flags?.floor_400_cleared && !player.flags?.floor_500_cleared,
    lines: [
      { speakerName: '', text: '營火旁，你和莉莉各自沉思著...', image: '' },
      { speakerName: '莉莉', text: '...喂。', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '謝謝你...一直以來都保護著我...', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '在那種森林裡嚇尿了也是...還有在遺跡裡被魅惑什麼的...', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '莉莉', text: '讓你看到那麼丟臉的樣子...真的對不起...', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '', text: '你搖搖頭，說那不是她的錯。', image: '' },
      { speakerName: '莉莉', text: '...你真的是個很好的人呢。', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '等拿到深淵火種...我要用它打造最棒的武器送給你！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '...那個...拿到之後...你還願意和我一起冒險嗎...？', image: IMG_LILY_LEWD, emotion: 'lewd' },
      { speakerName: '', text: '你點了點頭。莉莉露出了燦爛的笑容。', image: IMG_LILY_HAPPY, emotion: 'happy' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'final_warning',
    priority: 110,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 499 && phase === 'camp' && player.flags?.floor_400_cleared && !player.flags?.floor_500_cleared && !player.flags?.final_warning_seen,
    lines: [
      { speakerName: '引導者', text: '終於到了呢...最後的深淵', image: IMG_GUIDE },
      { speakerName: '引導者', text: '這一路走來...說實話，我都覺得有點驚訝', image: IMG_GUIDE },
      { speakerName: '引導者', text: '別死了喔，雜魚。...不，現在已經不是雜魚了呢', image: IMG_GUIDE, emotion: 'happy' },
    ],
    onFinish: () => ({}),
    setFlags: { final_warning_seen: true }
  },

  {
    id: 'final_battle',
    priority: 250,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 500 && phase === 'before_battle' && player.flags?.floor_400_cleared && !player.flags?.floor_500_cleared,
    lines: [
      { speakerName: '', text: '眼前是一片無盡的黑暗...', image: '' },
      { speakerName: '', text: '巨大的黑暗化為實體，襲來！', image: '' },
      { speakerName: '莉莉', text: '這就是...深淵的守護者嗎...！', image: IMG_LILY_NORMAL },
      { speakerName: '莉莉', text: '我們一起來的！現在也一起戰鬥！', image: IMG_LILY_HAPPY, emotion: 'happy' },
    ],
    onFinish: () => ({})
  },

  {
    id: 'ending',
    priority: 255,
    condition: (player, gameState, depth, maxDepth, phase) =>
      depth === 500 && phase === 'after_battle' && player.flags?.floor_400_cleared && !player.flags?.floor_500_cleared,
    lines: [
      { speakerName: '', text: '黑暗消散...一道光芒出現——', image: '' },
      { speakerName: '莉莉', text: '是...「深淵火種」！！', image: IMG_LILY_HAPPY, emotion: 'happy' },
      { speakerName: '莉莉', text: '嗚嗚...終於...終於找到了...！', image: IMG_LILY_CRY, emotion: 'happy' },
      { speakerName: '', text: '莉莉喜極而泣，緊緊抱住了你。', image: IMG_LILY_CRY, emotion: 'happy' },
      { speakerName: '莉莉', text: '謝謝你...真的謝謝你...沒有你的話...', image: IMG_LILY_CRY, emotion: 'cry' },
      { speakerName: '引導者', text: '...呀呵，恭喜恭喜♪', image: IMG_GUIDE },
      { speakerName: '引導者', text: '沒想到真的能做到呢...這次的勇者稍微有點骨氣呢', image: IMG_GUIDE },
      { speakerName: '引導者', text: '那麼...作為獎勵，我就把「無盡模式」開放給你吧', image: IMG_GUIDE, emotion: 'happy' },
      { speakerName: '引導者', text: '你可以繼續探索更深的地方...或者和那個矮人妹子做點什麼也行♥', image: IMG_GUIDE, emotion: 'happy' },
      { speakerName: '系統', text: '🎊 恭喜通關！無盡模式已解鎖！', image: '' },
      { speakerName: '系統', text: '傳送回村莊中...', image: '' },
    ],
    onFinish: (player) => ({ storyProgress: 100 }),
    setFlags: { floor_500_cleared: true },
    forceReturnToVillage: true
  },
];
