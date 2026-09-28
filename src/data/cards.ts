import type { CollectibleCard, CardRarity } from "../types/collection";
export const RARITIES: Record<CardRarity, { name: string; price: number; exchange: number; duplicate: number }> = {
  common: { name: "原初", price: 100, exchange: 20, duplicate: 20 },
  rare: { name: "珍藏", price: 300, exchange: 60, duplicate: 50 },
  legendary: { name: "典藏", price: 800, exchange: 160, duplicate: 120 },
};
export const PACK_PRICE = 150;
export const CARD_SETS = ["深空来信", "浮光之城", "荒野回声"];
export const CARDS: CollectibleCard[] = [
  { id: "orbit", name: "环星旅人", set: "深空来信", rarity: "common", subtitle: "绕过寂静，抵达未知", story: "他每经过一颗行星，就留下一盏灯。后来的人把这条光路叫作归途。", color: "#192858", accent: "#b8a0ff", motif: "planet" },
  { id: "signal", name: "最后的信标", set: "深空来信", rarity: "common", subtitle: "总有一束光在等你", story: "没有船再经过这片星域。守塔人仍然每天准时点灯，相信远方也有人在看。", color: "#203854", accent: "#88e2e1", motif: "tower" },
  { id: "voyager", name: "无声航行", set: "深空来信", rarity: "rare", subtitle: "向没有名字的明天", story: "飞船驶离最后一张星图。舷窗外不再有坐标，只有尚未讲述的故事。", color: "#352054", accent: "#eea9de", motif: "ship" },
  { id: "stargate", name: "星海之门", set: "深空来信", rarity: "legendary", subtitle: "所有旅途，在此交汇", story: "传说门后不是另一个宇宙，而是所有曾经勇敢出发的自己。", color: "#342349", accent: "#ffe4a1", motif: "gate" },
  { id: "rooftop", name: "屋顶上的风", set: "浮光之城", rarity: "common", subtitle: "城市也有柔软的一面", story: "日落后，修理工爬上屋顶。整个城市的灯亮起来，像一片倒悬的星空。", color: "#40344c", accent: "#ffc3a0", motif: "city" },
  { id: "nightline", name: "午夜末班车", set: "浮光之城", rarity: "common", subtitle: "下一站，慢一点", story: "这班列车不赶时间。有人带着鲜花，有人带着疲惫，每个人都有一个去处。", color: "#163e48", accent: "#9bdfc5", motif: "train" },
  { id: "moonroom", name: "借一轮月亮", set: "浮光之城", rarity: "rare", subtitle: "给普通夜晚一点奇迹", story: "窗边的小店出租月光。只需一个愿望，就能让自己的房间亮一整夜。", color: "#393258", accent: "#c6c7ff", motif: "moon" },
  { id: "dawn", name: "永昼天台", set: "浮光之城", rarity: "legendary", subtitle: "太阳为你停留一刻", story: "城市最高处藏着一座天台。登上它的人，会看到自己最想记住的那个清晨。", color: "#55394c", accent: "#ffe29c", motif: "sun" },
  { id: "ridge", name: "山脊来信", set: "荒野回声", rarity: "common", subtitle: "风替远方说你好", story: "山顶的信箱没有地址。登山者留下的话，会被下一位路过的人带走。", color: "#254649", accent: "#b9e3c1", motif: "mountain" },
  { id: "forest", name: "森林守夜人", set: "荒野回声", rarity: "common", subtitle: "静下来，也是一种前进", story: "树木记得所有季节。守夜人听着年轮里的故事，等第一只鸟醒来。", color: "#24473b", accent: "#d2e9a3", motif: "tree" },
  { id: "skywhale", name: "云海鲸歌", set: "荒野回声", rarity: "rare", subtitle: "把沉重的事交给天空", story: "每当有人放下一个执念，云海中的鲸就会唱起歌。歌声很轻，却能传到很远。", color: "#24425e", accent: "#a2dbfa", motif: "whale" },
  { id: "island", name: "漂浮的春天", set: "荒野回声", rarity: "legendary", subtitle: "你走到哪里，哪里就开花", story: "一座没有锚的岛屿，带着四季旅行。它从不问目的地，只在疲惫的人上方停留。", color: "#35494a", accent: "#ffe7ab", motif: "island" },
];
export const findCard = (id: string) => CARDS.find((card) => card.id === id);
