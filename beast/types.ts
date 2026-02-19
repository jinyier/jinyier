export enum Stance {
  BIPEDAL = '两足 (直立)',
  QUADRUPED = '四足 (爬行)',
}

export enum ElementType {
  GOLD = '金',
  WOOD = '木',
  WATER = '水',
  FIRE = '火',
  EARTH = '土',
}

export interface BeastData {
  stance: Stance | null;
  head: string;
  frontLimbs: string;
  body: string;
  hindLimbs: string;
  wings: string | null;
  tail: string;
  elements: ElementType[];
  purposes: string[];
}

export const INITIAL_BEAST_DATA: BeastData = {
  stance: null,
  head: '',
  frontLimbs: '',
  body: '',
  hindLimbs: '',
  wings: null,
  tail: '',
  elements: [],
  purposes: [''],
};

export interface BeastStats {
  health: number; // 0-100
  mood: number;   // 0-100
  exp: number;    // Experience points
  level: number;
  gold: number;   // Currency
}

export interface GameEvent {
  id: string;
  message: string;
  type: 'positive' | 'negative' | 'neutral' | 'rare' | 'combat';
  timestamp: Date;
}

export type ItemType = 'consumable' | 'treasure' | 'junk';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  value: number; // Sell value
  effects?: Partial<Omit<BeastStats, 'gold' | 'level'>>; // Stat changes if used
}

export interface InventoryItem extends ItemDef {
  instanceId: string;
}

export interface Enemy {
  name: string;
  image: string;
  level: number;
  maxHealth: number;
  currentHealth: number;
  damage: number;
  rewardExp: number;
  rewardGold: number;
}

export interface Pet {
  id: string;
  name: string;
  description: string;
  type: 'slime' | 'elemental' | 'mech' | 'beast';
}

export interface SavedBeast {
  id: string;
  data: BeastData;
  stats: BeastStats;
  image: string | null;
  inventory: InventoryItem[];
  events: GameEvent[];
  pet?: Pet | null;
  timestamp: number;
}