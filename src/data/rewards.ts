import type { PersonalReward } from "../types/rewards";

// Prices are the user's own wish-list budgets, not live retailer quotes.
export const PERSONAL_REWARDS: PersonalReward[] = [
  {
    id: "full-rest-day",
    title: "一日完全休息日",
    category: "专属假期",
    description: "提前留出一整天，不追进度、不安排补任务。",
    cost: 360,
    detail:
      "给自己安排一个完整的专属假日：睡醒再起，按心情过一天，把计划性工作留到之后。360 币兑换的是这份特别安排，无需额外消费。正常休息、周末和身体需要的休息一直都是自由的。",
    icon: "rest",
  },
  {
    id: "gaming-evening",
    title: "爽打一晚上游戏",
    category: "专属假期",
    description: "专门空出一个晚上，选最想玩的游戏，尽兴就好。",
    cost: 120,
    detail:
      "给 FC27、CS2 或万象棋留一个完整的游戏夜。可以约朋友，也可以自己玩，不带训练指标，不要求战绩。无需额外消费，日常玩游戏不需要兑换。",
    icon: "gaming",
  },
  {
    id: "karting-session",
    title: "去一次卡丁车",
    category: "特别体验",
    description: "去赛道上体验速度，把这次出门留给好玩。",
    cost: 400,
    budget: 400,
    detail:
      "按你给出的预算，为一次卡丁车体验预留 400 元。挑好场地与合适的时间，安排一次专门的出行；兑换不会自动预约。",
    icon: "kart",
  },
  {
    id: "special-dinner",
    title: "吃一顿好的",
    category: "味觉奖励",
    description: "选一家一直想吃的店，把一顿饭认真当成期待。",
    cost: 500,
    budget: 500,
    detail:
      "为一顿特别的大餐预留 500 元预算。选自己真想吃的菜，可以独享，也可以与喜欢的人分享。正常吃饭不需要兑换。",
    icon: "dining",
  },
  {
    id: "wishlist-chocolate",
    title: "Knoops 巧克力粉",
    category: "味觉奖励",
    description: "把收藏夹里的那份 Knoops，变成杯子里的浓郁热巧。",
    cost: 200,
    budget: 200,
    detail:
      "为你收藏的 Knoops 预留 200 元预算。官方热巧商品以巧克力薄片形式出售，可以融入热牛奶，也能做冰巧克力。图中展示 54% 黑巧、250g 包装作为参考；你的具体浓度和规格待确认，预算沿用你给出的 200 元。",
    icon: "chocolate",
    tags: ["KNOOPS", "热巧 / 冰巧", "浓度待确认"],
    image: {
      src: "./rewards/knoops-54-reference.jpg",
      alt: "Knoops 54% 黑巧克力薄片官方包装参考图",
      caption: "官方图 · 54% 包装示例，口味待确认",
      fit: "contain",
    },
    source: {
      label: "Knoops 官方商品资料",
      url: "https://knoops.com/products/dark-chocolate-flakes",
    },
  },
  {
    id: "wishlist-keyboard",
    title: "心动的磁轴键盘",
    category: "想要的装备",
    description: "给喜欢的游戏添一件真正想换上桌的装备。",
    cost: 2000,
    budget: 2000,
    detail:
      "为淘宝收藏夹里的磁轴键盘预留 2000 元预算。型号、配列与配色尚未确认，先保留你的选择；后续再补触发行程、连接方式等准确参数。图片是无品牌外观示意，不代表具体商品。",
    icon: "keyboard",
    tags: ["磁轴", "型号待确认", "桌面升级"],
    image: {
      src: "./rewards/magnetic-keyboard-concept.png",
      alt: "深色磁轴键盘概念示意图，不代表具体品牌型号",
      caption: "AI 外观示意 · 非具体商品实拍",
      fit: "cover",
    },
  },
  {
    id: "wishlist-monitor",
    title: "ROG · 2K 270Hz 显示器",
    category: "想要的装备",
    description: "把期待放在更清晰、更流畅的游戏画面上。",
    cost: 3000,
    budget: 3000,
    detail:
      "你已确认 ROG、2K、270Hz，预算 3000 元。当前用 ROG Strix XG27AQM 官方图作型号参考：这款为 27 英寸、2560×1440，最高 270Hz 为超频模式。你的淘宝收藏型号尚待确认，图片不代表已替你选定此款。",
    icon: "monitor",
    tags: ["ROG", "2K · 2560×1440", "270Hz"],
    image: {
      src: "./rewards/rog-xg27aqm.webp",
      alt: "ROG Strix XG27AQM 官方产品图，作为 2K 270Hz 显示器参考",
      caption: "官方图 · XG27AQM 参考，具体型号待确认",
      fit: "contain",
    },
    source: {
      label: "ROG XG27AQM 官方规格（参考型号）",
      url: "https://rog.asus.com/monitors/27-to-31-5-inches/rog-strix-xg27aqm-model/spec/",
    },
  },
  {
    id: "beijing-november",
    title: "十一月 · 北京现场观赛",
    category: "旅行计划",
    description: "把想去看的比赛，变成真正出发的一趟旅行。",
    cost: 4000,
    budget: 4000,
    detail:
      "整趟北京观赛行程预算 4000 元，用于比赛门票、往返交通、住宿等。计划在 2026 年 11 月出发，具体场次和日期之后再确定。",
    icon: "trip",
  },
];
