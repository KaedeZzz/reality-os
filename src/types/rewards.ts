export interface PersonalReward {
  id: string;
  title: string;
  category: "想要的装备" | "味觉奖励" | "旅行计划" | "专属假期" | "特别体验";
  description: string;
  cost: number;
  detail: string;
  budget?: number;
  tags?: string[];
  image?: {
    src: string;
    alt: string;
    caption: string;
    fit?: "cover" | "contain";
  };
  source?: { label: string; url: string };
  icon:
    | "keyboard"
    | "monitor"
    | "chocolate"
    | "trip"
    | "rest"
    | "gaming"
    | "kart"
    | "dining";
}
export interface RewardRedemption {
  id: string;
  rewardId: string;
  title: string;
  category: string;
  description: string;
  cost: number;
  budget?: number;
  note: string;
  redeemedAt: string;
  status: "pending" | "enjoyed" | "cancelled";
  finishedAt?: string;
}
