export type CardRarity = "common" | "rare" | "legendary";
export interface CollectibleCard {
  id: string;
  name: string;
  set: string;
  rarity: CardRarity;
  subtitle: string;
  story: string;
  color: string;
  accent: string;
  motif: "tower" | "planet" | "ship" | "gate" | "city" | "train" | "moon" | "mountain" | "tree" | "whale" | "sun" | "island";
}
export interface CollectionState {
  currencyVersion?: 2;
  coins: number;
  shards: number;
  owned: { cardId: string; acquiredAt: string }[];
  showcase: string[];
  wishlist: string | null;
  completedSets: string[];
  packsSinceLegendary: number;
  transactions: { id: string; label: string; coins: number; shards: number; at: string }[];
  pendingPack: { id: string; cards: { cardId: string; duplicate: boolean; shards: number; refund?: number }[]; guaranteed: boolean } | null;
}
