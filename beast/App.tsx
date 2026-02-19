import React, { useState, useEffect, useRef } from 'react';
import { Stance, ElementType, BeastData, INITIAL_BEAST_DATA, BeastStats, GameEvent, ItemDef, InventoryItem, Enemy, SavedBeast, Pet } from './types.ts';
import { StepContainer } from './components/StepContainer.tsx';
import { ProgressBar } from './components/ProgressBar.tsx';
import { generateBeastImage, generateEnemyImage } from './services/geminiService.ts';
import { 
  Footprints, 
  Accessibility, 
  Skull, 
  Hand, 
  Box, 
  Cat, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind, 
  Coins,
  ShieldCheck,
  RefreshCcw,
  Sparkles,
  Heart,
  Smile,
  Zap,
  Utensils,
  Map,
  Moon,
  Swords,
  Scroll,
  Backpack,
  X,
  Trash2,
  Gem,
  Apple,
  Gift,
  Sword,
  ShieldAlert,
  Loader,
  Dumbbell,
  Target,
  ArrowLeft,
  ArrowRight,
  MoveHorizontal,
  Save,
  Archive,
  PawPrint,
  Ghost,
  Bot,
  Trophy,
  HandHeart,
  Users,
  Feather,
  Thermometer,
  Bandage,
  CloudRain,
  Sun,
  MessageCircle,
  Search,
  Tent,
  CloudLightning,
  CloudFog,
  Eye,
  Store,
  Compass,
  Package
} from 'lucide-react';

const STEPS = [
  'stance',
  'head',
  'frontLimbs',
  'body',
  'hindLimbs',
  'wings',
  'tail',
  'elements',
  'purposes',
  'game'
] as const;

const INITIAL_STATS: BeastStats = {
  health: 100,
  mood: 80,
  exp: 0,
  level: 1,
  gold: 0
};

// --- Item Registry ---
const ITEM_REGISTRY: ItemDef[] = [
  { id: 'mystic_berry', name: '神秘果实', type: 'consumable', description: '发光的水果，可以恢复生命值。', value: 10, effects: { health: 20, mood: 5 } },
  { id: 'star_water', name: '星光水', type: 'consumable', description: '映照着夜空的清爽泉水。', value: 15, effects: { health: 10, mood: 15 } },
  { id: 'energy_crystal', name: '能量水晶', type: 'consumable', description: '充满了原始力量的水晶。', value: 50, effects: { exp: 50, mood: -10 } },
  { id: 'golden_apple', name: '金苹果', type: 'consumable', description: '传说中的果实，全面恢复状态。', value: 100, effects: { health: 50, mood: 50, exp: 20 } },
  { id: 'spicy_root', name: '火辣根茎', type: 'consumable', description: '吃起来像着火一样，极大提升士气。', value: 20, effects: { mood: 30, health: -5 } },
  { id: 'ancient_coin', name: '远古金币', type: 'treasure', description: '来自失落文明的金币。', value: 100 },
  { id: 'gem_fragment', name: '宝石碎片', type: 'treasure', description: '在光线下闪闪发光，非常有价值。', value: 250 },
  { id: 'dragon_scale', name: '龙鳞', type: 'treasure', description: '摸起来很温暖，极其稀有。', value: 500 },
  { id: 'lost_crown', name: '失落王冠', type: 'treasure', description: '一个古老王国的遗物。', value: 1000 },
  { id: 'shiny_rock', name: '闪亮的石头', type: 'junk', description: '只是一块漂亮的石头，不值钱。', value: 1 },
  { id: 'tangled_roots', name: '纠缠的树根', type: 'junk', description: '一团干枯的树根。', value: 0 },
  { id: 'broken_pot', name: '破碎的罐子', type: 'junk', description: '陶器的悲惨遗迹。', value: 2 },
];

const AVAILABLE_PETS: Pet[] = [
  { id: 'slime_blue', name: '果冻史莱姆', type: 'slime', description: '一只半透明的蓝色史莱姆，总是粘乎乎的。' },
  { id: 'fox_ember', name: '余火小狐', type: 'elemental', description: '尾巴尖端燃烧着微弱火焰的小狐狸。' },
  { id: 'owl_mech', name: '发条猫头鹰', type: 'mech', description: '一只机械构造的猫头鹰，眼睛像透镜一样转动。' },
  { id: 'rock_buddy', name: '小石头人', type: 'elemental', description: '一块有了生命的小石头，非常安静。' },
  { id: 'ghost_wisp', name: '幽灵光球', type: 'beast', description: '一团漂浮的白色光球，似乎迷路了。' },
];

type WeatherType = 'clear' | 'rain' | 'storm' | 'mist';
type CravingType = 'food' | 'play' | 'explore' | null;

interface SecretLocation {
  name: string;
  type: 'ruins' | 'fairy' | 'cave';
  expiresAt: number;
}

export default function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<BeastData>(INITIAL_BEAST_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Game State
  const [stats, setStats] = useState<BeastStats>(INITIAL_STATS);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const [isSick, setIsSick] = useState(false);
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  
  // Advanced Events State
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [craving, setCraving] = useState<CravingType>(null);
  const [secretLoc, setSecretLoc] = useState<SecretLocation | null>(null);

  // Pet State
  const [pet, setPet] = useState<Pet | null>(null);
  const [foundPetCandidate, setFoundPetCandidate] = useState<Pet | null>(null);

  // Combat State
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [isGeneratingEnemy, setIsGeneratingEnemy] = useState(false);
  const [combatState, setCombatState] = useState<'idle' | 'encounter' | 'fighting' | 'victory' | 'defeat'>('idle');
  const [combatLog, setCombatLog] = useState<string[]>([]);

  // Training State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingPhase, setTrainingPhase] = useState<'intro' | 'active' | 'victory' | 'defeat'>('intro');
  const [trainingDummyHp, setTrainingDummyHp] = useState(100);
  const [playerLane, setPlayerLane] = useState(1); 
  const [dangerLane, setDangerLane] = useState<number | null>(null);
  const [warningActive, setWarningActive] = useState(false);
  const [damageActive, setDamageActive] = useState(false);

  // Save System State
  const [savedBeasts, setSavedBeasts] = useState<SavedBeast[]>(() => {
    try {
      const local = localStorage.getItem('guardian_beasts_v1');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      console.error("Failed to load saves", e);
      return [];
    }
  });

  const eventLogRef = useRef<HTMLDivElement>(null);
  const combatLogRef = useRef<HTMLDivElement>(null);
  const playerLaneRef = useRef(1);
  const trainingActiveRef = useRef(false);

  useEffect(() => {
    if (eventLogRef.current) eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
  }, [events]);

  useEffect(() => {
    if (combatLogRef.current) combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
  }, [combatLog]);

  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

  useEffect(() => {
    localStorage.setItem('guardian_beasts_v1', JSON.stringify(savedBeasts));
  }, [savedBeasts]);

  // Passive Timer Loop
  useEffect(() => {
    if (stepIndex === STEPS.length - 1 && combatState === 'idle' && !isTraining) {
      const interval = setInterval(() => {
        const rand = Math.random();
        if (weather === 'storm' && rand < 0.3) {
           updateStats({ health: -1, mood: -2 });
           addEvent("狂风暴雨让守护兽感到不适...", "negative");
        } else if (weather === 'rain' && rand < 0.2) {
           updateStats({ mood: -1 });
        } else if (weather === 'clear' && rand < 0.2) {
           updateStats({ mood: 1 });
        }
        if (secretLoc && Date.now() > secretLoc.expiresAt) {
          setSecretLoc(null);
          addEvent(`你之前发现的 ${secretLoc.name} 入口消失了。`, "neutral");
        }
        if (isSick) {
          updateStats({ health: -2, mood: -2 });
          if (rand < 0.2) addEvent("守护兽因病痛而呻吟...", "negative");
        } else {
          if (pet && rand < 0.2) triggerPetEvent();
          else if (rand > 0.5) triggerRandomEvent();
        }
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [stepIndex, stats, combatState, isTraining, pet, isSick, weather, secretLoc]);

  const updateData = (key: keyof BeastData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const addEvent = (message: string, type: GameEvent['type'] = 'neutral') => {
    setEvents(prev => [...prev, { id: Date.now().toString(), message, type, timestamp: new Date() }]);
  };

  const updateStats = (updates: Partial<BeastStats>) => {
    setStats(prev => {
      let { health, mood, exp, level, gold } = prev;
      if (updates.health !== undefined) health = Math.min(100, Math.max(0, health + updates.health));
      if (updates.mood !== undefined) mood = Math.min(100, Math.max(0, mood + updates.mood));
      if (updates.gold !== undefined) gold = Math.max(0, gold + updates.gold);
      if (updates.exp !== undefined) {
        exp += updates.exp;
        if (exp >= level * 100) {
          exp -= level * 100;
          level += 1;
          addEvent(`升级了！达到了 Lv.${level}！`, 'rare');
          health = 100; mood = 100;
        }
      }
      return { health, mood, exp, level, gold };
    });
  };

  const handleNext = async () => {
    if (stepIndex === STEPS.length - 2) {
      setIsLoading(true);
      try {
        const imageUrl = await generateBeastImage(data);
        setGeneratedImage(imageUrl);
        setStepIndex(prev => prev + 1);
        addEvent("你的守护兽已降临于世！", "rare");
      } catch (e) {
        alert("召唤失败，请检查网络或重试。");
      } finally {
        setIsLoading(false);
      }
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => { if (stepIndex > 0) setStepIndex(prev => prev - 1); };

  const handleReset = () => {
    setData(INITIAL_BEAST_DATA); setGeneratedImage(null); setStats(INITIAL_STATS);
    setEvents([]); setInventory([]); setPet(null); setEnemy(null);
    setCombatState('idle'); setIsTraining(false); setIsSick(false);
    setChatMessage(null); setWeather('clear'); setCraving(null);
    setSecretLoc(null); setStepIndex(0);
  };

  const handleSaveGame = () => {
    const save: SavedBeast = { id: Date.now().toString(), data, stats, image: generatedImage, inventory, events, pet, timestamp: Date.now() };
    setSavedBeasts(prev => [save, ...prev]);
    addEvent("守护兽的灵魂已归档保存。", "rare");
  };

  const handleLoadGame = (save: SavedBeast) => {
    setData(save.data); setStats(save.stats); setGeneratedImage(save.image);
    setInventory(save.inventory); setEvents(save.events); setPet(save.pet || null);
    setStepIndex(STEPS.length - 1); setEnemy(null); setCombatState('idle');
    setIsTraining(false); setIsSick(false); setWeather('clear');
  };

  const handleDeleteSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("确定要释放这只守护兽的灵魂吗？")) setSavedBeasts(prev => prev.filter(s => s.id !== id));
  };

  // --- Interaction & Game Logic ---

  const triggerRandomEvent = () => {
    const roll = Math.floor(Math.random() * 100);
    if (roll < 10) {
      const weathers: WeatherType[] = ['clear', 'rain', 'storm', 'mist'];
      const next = weathers.filter(w => w !== weather);
      const nw = next[Math.floor(Math.random() * next.length)];
      setWeather(nw);
      addEvent(`天气变化：${nw === 'clear' ? '晴朗' : nw === 'rain' ? '下雨' : nw === 'storm' ? '风暴' : '迷雾'}`, "neutral");
    } else if (roll < 20 && !craving) {
      const crs: CravingType[] = ['food', 'play', 'explore'];
      setCraving(crs[Math.floor(Math.random() * crs.length)]);
      addEvent("守护兽似乎产生了一些渴望...", "neutral");
    } else if (roll < 35 && !isSick) {
      setIsSick(true); addEvent("守护兽看起来生病了！", "negative");
    } else if (roll < 45) {
      const item = ITEM_REGISTRY[Math.floor(Math.random() * ITEM_REGISTRY.length)];
      setInventory(prev => [...prev, { ...item, instanceId: Date.now().toString() }]);
      addEvent(`发现了【${item.name}】！`, "positive");
    } else {
      addEvent("周围风平浪静...", "neutral");
    }
  };

  const triggerPetEvent = () => {
    if (!pet) return;
    const rand = Math.random();
    if (rand < 0.4) {
      const gold = Math.floor(Math.random() * 20) + 5;
      updateStats({ gold });
      addEvent(`${pet.name} 找到了 ${gold} 金币！`, "positive");
    } else {
      updateStats({ mood: 5 });
      addEvent(`${pet.name} 逗得守护兽很开心。`, "positive");
    }
  };

  const handleChat = () => {
    const msgs = ["我感觉充满力量！", "我们要去哪里冒险？", "我会永远守护你。", "今天天气不错。", "我肚子有点饿。"];
    const msg = isSick ? "我感觉很难受..." : craving === 'food' ? "好想吃东西..." : msgs[Math.floor(Math.random() * msgs.length)];
    setChatMessage(msg);
    addEvent(`守护兽: "${msg}"`, "neutral");
    setTimeout(() => setChatMessage(null), 4000);
  };

  const handleFeed = () => {
    if (stats.gold < 5) return addEvent("金币不足！", "negative");
    let moodB = 10, expB = 5;
    if (craving === 'food') { moodB = 30; expB = 20; setCraving(null); addEvent("美味无比！渴望达成。", "rare"); }
    updateStats({ health: 15, mood: moodB, exp: expB, gold: -5 });
    addEvent("喂食了一份点心。", "positive");
  };

  const handleCure = () => {
    if (!isSick) return;
    if (stats.gold < 20) return addEvent("金币不足！(20金币)", "negative");
    setIsSick(false); updateStats({ gold: -20, health: 30, mood: 20 });
    addEvent("治好了守护兽！", "positive");
  };

  const handleRest = () => {
    addEvent("正在休息...", "neutral");
    updateStats({ health: 25, mood: 10 });
    if (isSick && Math.random() < 0.3) { setIsSick(false); addEvent("通过休息，病奇迹般好了！", "positive"); }
  };

  // --- Inventory Management ---
  const handleUseItem = (item: InventoryItem) => {
    if (item.type !== 'consumable') return;
    
    // Apply effects
    if (item.effects) {
      updateStats(item.effects);
    }
    
    // Remove one instance
    setInventory(prev => {
      const idx = prev.findIndex(i => i.instanceId === item.instanceId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    
    addEvent(`使用了 ${item.name}。`, 'positive');
  };

  const handleSellItem = (item: InventoryItem) => {
    // Add gold
    updateStats({ gold: item.value });
    
    // Remove one instance
    setInventory(prev => {
      const idx = prev.findIndex(i => i.instanceId === item.instanceId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    
    addEvent(`出售了 ${item.name}，获得 ${item.value} 金币。`, 'neutral');
  };

  // --- Combat Fixes ---

  const startEncounter = async () => {
    setIsGeneratingEnemy(true);
    setCombatState('encounter');
    setCombatLog(["正在搜寻敌人..."]);
    try {
      const res = await generateEnemyImage(stats.level);
      if (res) {
        const e: Enemy = {
          name: res.name, image: res.image, level: stats.level,
          maxHealth: 60 + (stats.level * 20), currentHealth: 60 + (stats.level * 20),
          damage: 8 + (stats.level * 2), rewardExp: 50 + (stats.level * 10), rewardGold: 30 + (stats.level * 5)
        };
        setEnemy(e);
      } else { setCombatState('idle'); addEvent("什么也没找到。", "neutral"); }
    } catch { setCombatState('idle'); } finally { setIsGeneratingEnemy(false); }
  };

  const handleCombatAction = (action: 'attack' | 'flee') => {
    if (!enemy) return;
    if (action === 'flee') { setCombatState('idle'); setEnemy(null); addEvent("成功逃脱！", "neutral"); return; }
    
    setCombatState('fighting');
    const playerDmg = Math.floor(Math.random() * 15) + 10 + (stats.level * 3);
    const newEnemyHp = Math.max(0, enemy.currentHealth - playerDmg);
    setEnemy({ ...enemy, currentHealth: newEnemyHp });
    setCombatLog(prev => [...prev, `你发动攻击，造成 ${playerDmg} 点伤害。`]);

    if (newEnemyHp <= 0) {
      setCombatState('victory');
      updateStats({ exp: enemy.rewardExp, gold: enemy.rewardGold, mood: 15 });
      setCombatLog(prev => [...prev, `击败了 ${enemy.name}！`]);
      return;
    }

    setTimeout(() => {
      const eDmg = Math.floor(Math.random() * enemy.damage) + 5;
      updateStats({ health: -eDmg });
      setCombatLog(prev => [...prev, `${enemy.name} 发动攻击，造成 ${eDmg} 点伤害。`]);
      if (stats.health - eDmg <= 0) setCombatState('defeat');
    }, 800);
  };

  const handleEnterSecret = () => {
    if (!secretLoc) return;
    
    if (secretLoc.type === 'ruins') {
      addEvent("你们在废墟深处找到了古代宝藏！", "rare");
      updateStats({ gold: 100, exp: 50 });
      const treasure = ITEM_REGISTRY.find(i => i.id === 'ancient_coin');
      if (treasure) setInventory(prev => [...prev, { ...treasure, instanceId: Date.now().toString() }]);
    } else if (secretLoc.type === 'fairy') {
      addEvent("沐浴在妖精之环的魔法光辉中，守护兽完全恢复了！", "rare");
      updateStats({ health: 100, mood: 100, exp: 20 });
    } else if (secretLoc.type === 'cave') {
      addEvent("洞窟里长满了水晶，你们采集了一些。", "rare");
      updateStats({ exp: 40 });
      const crystal = ITEM_REGISTRY.find(i => i.id === 'energy_crystal');
      if (crystal) setInventory(prev => [...prev, { ...crystal, instanceId: Date.now().toString() }, { ...crystal, instanceId: Date.now().toString() }]);
    }
    
    setSecretLoc(null); // Consumed
  };

  const handleExplore = async () => {
    if (isSick || stats.health < 20) return addEvent("太虚弱了，无法探险。", "negative");
    if (craving === 'explore') { setCraving(null); updateStats({ mood: 20, exp: 15 }); addEvent("愿望达成！", "rare"); }
    
    const roll = Math.random();
    
    // 15% Secret Location
    if (roll < 0.15 && !secretLoc) {
      const locs: SecretLocation[] = [
         { name: "古老废墟", type: 'ruins', expiresAt: Date.now() + 60000 },
         { name: "妖精之环", type: 'fairy', expiresAt: Date.now() + 60000 },
         { name: "水晶洞窟", type: 'cave', expiresAt: Date.now() + 60000 },
      ];
      const found = locs[Math.floor(Math.random() * locs.length)];
      setSecretLoc(found);
      addEvent(`发现了一个隐藏地点：【${found.name}】！`, "rare");
    } 
    // 45% Item Discovery
    else if (roll < 0.60) {
      const item = ITEM_REGISTRY[Math.floor(Math.random() * ITEM_REGISTRY.length)];
      setInventory(prev => [...prev, { ...item, instanceId: Date.now().toString() }]);
      addEvent(`运气不错！在探险中发现了【${item.name}】！`, "positive");
      updateStats({ exp: 15, mood: 5 });
    }
    // 20% Nothing but EXP
    else if (roll < 0.80) {
      addEvent("什么也没发现，但锻炼了体能。", "neutral"); 
      updateStats({ exp: 10 });
    } 
    // 20% Combat
    else {
      startEncounter();
    }
  };

  // --- Training Fixes ---

  const startTraining = () => { if (!isSick) { setIsTraining(true); setTrainingPhase('intro'); trainingActiveRef.current = true; } };
  const quitTraining = () => { trainingActiveRef.current = false; setIsTraining(false); };

  const runTrainingLoop = () => {
    if (!trainingActiveRef.current) return;
    setTimeout(() => {
      if (!trainingActiveRef.current) return;
      const target = Math.floor(Math.random() * 3);
      setDangerLane(target); setWarningActive(true);
      setTimeout(() => {
        if (!trainingActiveRef.current) return;
        setWarningActive(false); setDamageActive(true);
        if (playerLaneRef.current === target) updateStats({ health: -10 });
        setTimeout(() => {
          setDamageActive(false); setDangerLane(null);
          if (trainingActiveRef.current) runTrainingLoop();
        }, 400);
      }, 1000);
    }, 1500);
  };

  const handleTrainingAttack = () => {
    const dmg = 20 + stats.level;
    setTrainingDummyHp(prev => {
      const next = prev - dmg;
      if (next <= 0) {
        trainingActiveRef.current = false; setTrainingPhase('victory');
        updateStats({ exp: 150, mood: 20 }); addEvent("训练成功！", "rare");
        return 0;
      }
      return next;
    });
  };

  // --- UI Step Renderers ---

  const renderStanceStep = () => (
    <StepContainer title="姿态选择" description="选择你的守护兽的站立姿态。" onNext={handleNext} canNext={!!data.stance}>
      <div className="grid grid-cols-2 gap-6">
        {[Stance.BIPEDAL, Stance.QUADRUPED].map(s => (
          <button key={s} onClick={() => updateData('stance', s)} className={`p-8 rounded-xl border-2 flex flex-col items-center gap-4 transition-all ${data.stance === s ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
            {s === Stance.BIPEDAL ? <Accessibility size={48} /> : <Footprints size={48} />}
            <span className="font-bold text-lg">{s}</span>
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const renderInputStep = (key: keyof BeastData, title: string, desc: string, icon: React.ReactNode, placeholder: string) => (
    <StepContainer title={title} description={desc} onNext={handleNext} onBack={handleBack} canNext={!!data[key]}>
      <div className="flex flex-col items-center gap-8">
        <div className="text-amber-500 p-6 bg-amber-500/10 rounded-full ring-4 ring-amber-500/20">{icon}</div>
        <input type="text" value={data[key] as string || ''} onChange={e => updateData(key, e.target.value)} placeholder={placeholder} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-center focus:border-amber-500 outline-none" autoFocus />
      </div>
    </StepContainer>
  );

  const renderWingsStep = () => (
    <StepContainer title="翅膀特征" description="它是否拥有翅膀？" onNext={handleNext} onBack={handleBack} canNext={true}>
      <div className="flex flex-col items-center gap-8">
        <div className="text-amber-500 p-6 bg-amber-500/10 rounded-full"><Wind size={48} /></div>
        <input type="text" value={data.wings || ''} onChange={e => updateData('wings', e.target.value)} placeholder="如：巨大的羽翼, 恶魔之翼, 无..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-center outline-none focus:border-amber-500" />
      </div>
    </StepContainer>
  );

  const renderElementsStep = () => (
    <StepContainer title="元素共鸣" description="选择 1-2 种与其灵魂产生共鸣的元素。" onNext={handleNext} onBack={handleBack} canNext={data.elements.length > 0 && data.elements.length <= 2}>
      <div className="grid grid-cols-3 gap-4">
        {[
          { type: ElementType.GOLD, icon: <Zap size={24} />, color: 'text-yellow-400' },
          { type: ElementType.WOOD, icon: <Feather size={24} />, color: 'text-green-400' },
          { type: ElementType.WATER, icon: <Droplets size={24} />, color: 'text-blue-400' },
          { type: ElementType.FIRE, icon: <Flame size={24} />, color: 'text-red-400' },
          { type: ElementType.EARTH, icon: <Mountain size={24} />, color: 'text-amber-700' },
        ].map(el => (
          <button key={el.type} onClick={() => {
            const current = data.elements;
            if (current.includes(el.type)) updateData('elements', current.filter(e => e !== el.type));
            else if (current.length < 2) updateData('elements', [...current, el.type]);
          }} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${data.elements.includes(el.type) ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
            <div className={el.color}>{el.icon}</div>
            <span className="font-bold">{el.type}</span>
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const renderPurposeStep = () => (
    <StepContainer title="使命" description="守护兽为何而生？" onNext={handleNext} onBack={handleBack} isLastStep isLoading={isLoading} canNext={data.purposes.some(p => p.trim() !== '')}>
      <div className="flex flex-col gap-4">
        {data.purposes.map((p, i) => (
          <input key={i} type="text" value={p} onChange={e => {
            const next = [...data.purposes]; next[i] = e.target.value; updateData('purposes', next);
          }} placeholder="例如：守护世界和平..." className="bg-slate-800 border-2 border-slate-700 rounded-xl p-3 focus:border-amber-500 outline-none" />
        ))}
      </div>
    </StepContainer>
  );

  const renderParticles = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="absolute w-2 h-2 bg-amber-400/50 rounded-full animate-float" style={{left: `${Math.random() * 100}%`, bottom: '-10px', animationDelay: `${Math.random() * 5}s`}} />
      ))}
    </div>
  );

  const renderWeatherEffects = () => {
    if (weather === 'rain') return <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse" />;
    if (weather === 'storm') return <div className="absolute inset-0 bg-slate-900/40 pointer-events-none animate-pulse" />;
    return null;
  };

  const renderGameDashboard = () => (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f172a] text-slate-200">
      {/* Stats Bar */}
      <div className="p-4 grid grid-cols-5 gap-4 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-2"><Heart className="text-red-500" size={20}/> <span>{stats.health}%</span></div>
        <div className="flex items-center gap-2"><Smile className="text-yellow-500" size={20}/> <span>{stats.mood}</span></div>
        <div className="flex items-center gap-2"><Trophy className="text-purple-500" size={20}/> <span>Lv.{stats.level}</span></div>
        <div className="flex items-center gap-2"><Coins className="text-amber-500" size={20}/> <span>{stats.gold}</span></div>
        <div className="flex items-center gap-2"><Zap className="text-blue-500" size={20}/> <span>{stats.exp} XP</span></div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Log */}
        <div className="w-1/4 p-4 border-r border-slate-800 flex flex-col bg-slate-900/20">
          <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2"><Scroll size={18}/> 历程</h3>
          <div ref={eventLogRef} className="flex-1 overflow-auto space-y-2 text-sm">
            {events.map(e => (
              <div key={e.id} className={`${e.type === 'rare' ? 'text-amber-400 font-bold' : e.type === 'negative' ? 'text-red-400' : 'text-slate-400'}`}>
                {e.message}
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel: Image & Interaction */}
        <div className="flex-1 flex flex-col p-6 items-center">
          <div className="relative w-full max-w-lg aspect-square bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            {generatedImage ? (
              <img src={generatedImage} alt="Beast" className={`w-full h-full object-cover transition-transform duration-500 ${isSick ? 'grayscale opacity-50' : 'animate-breathe'}`} />
            ) : <Loader className="w-full h-full animate-spin text-slate-700 p-20" />}
            {renderParticles()}
            {renderWeatherEffects()}
            {chatMessage && (
              <div className="absolute top-4 left-4 right-4 bg-white/90 text-slate-900 p-3 rounded-xl shadow-lg animate-bounce">
                {chatMessage}
              </div>
            )}
            {secretLoc && (
              <button onClick={handleEnterSecret} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold shadow-lg animate-bounce border-2 border-purple-300 z-20 flex items-center gap-2">
                <Sparkles size={16} /> 进入{secretLoc.name}
              </button>
            )}
          </div>
          
          <div className="mt-8 grid grid-cols-4 gap-4 w-full max-w-lg">
            <button onClick={handleFeed} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all">
              <Utensils size={24} className="text-amber-500" /> <span className="text-xs">喂食</span>
            </button>
            <button onClick={handleChat} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-1">
              <MessageCircle size={24} className="text-blue-400" /> <span className="text-xs">对话</span>
            </button>
            <button onClick={handleRest} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-1">
              <Moon size={24} className="text-purple-400" /> <span className="text-xs">休息</span>
            </button>
            <button onClick={handleExplore} className="p-3 bg-amber-600 hover:bg-amber-500 rounded-xl flex flex-col items-center gap-1 shadow-lg shadow-amber-900/20">
              <Compass size={24} /> <span className="text-xs">探险</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Actions & Status */}
        <div className="w-1/4 p-4 border-l border-slate-800 space-y-4 bg-slate-900/20 overflow-auto">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h4 className="font-bold text-amber-500 mb-2 flex items-center gap-2"><Sword size={16}/> 技能训练</h4>
            <button onClick={startTraining} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">开始每日训练</button>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h4 className="font-bold text-amber-500 mb-2 flex items-center gap-2"><Backpack size={16}/> 物品栏</h4>
            <button onClick={() => setShowInventory(true)} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">打开背包 ({inventory.length})</button>
          </div>
          {pet && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h4 className="font-bold text-amber-500 mb-1 flex items-center gap-2"><PawPrint size={16}/> 宠物伙伴</h4>
              <p className="text-xs text-slate-400 mb-2">{pet.name}</p>
              <button onClick={() => updateStats({mood: 5})} className="w-full py-2 bg-slate-700 rounded-lg text-sm">互动</button>
            </div>
          )}
          <div className="pt-4 flex gap-2">
            <button onClick={handleSaveGame} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center gap-1 text-xs"><Save size={14}/> 保存</button>
            <button onClick={handleReset} className="flex-1 py-2 bg-red-900/30 border border-red-800/50 rounded-lg flex items-center justify-center gap-1 text-xs text-red-400"><RefreshCcw size={14}/> 重置</button>
          </div>
        </div>
      </div>

      {/* Inventory Overlay */}
      {showInventory && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2"><Backpack /> 背包</h2>
              <button onClick={() => setShowInventory(false)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4 grid gap-3 overflow-auto flex-1">
              {inventory.length === 0 ? (
                <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-4">
                  <Package size={48} className="opacity-20" />
                  <p>背包是空的，去探险找点东西吧！</p>
                </div>
              ) : (
                inventory.map(item => (
                  <div key={item.instanceId} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        item.type === 'consumable' ? 'bg-green-900/30 text-green-400' :
                        item.type === 'treasure' ? 'bg-amber-900/30 text-amber-400' :
                        'bg-slate-700/30 text-slate-400'
                      }`}>
                         {item.type === 'consumable' ? <Apple size={24}/> : item.type === 'treasure' ? <Gem size={24}/> : <Trash2 size={24}/>}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       {item.type === 'consumable' && (
                         <button onClick={() => handleUseItem(item)} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-bold transition-colors">
                           使用
                         </button>
                       )}
                       <button onClick={() => handleSellItem(item)} className="px-3 py-1.5 bg-amber-700/50 hover:bg-amber-600/50 border border-amber-600/30 rounded-lg text-xs font-bold transition-colors text-amber-200 flex items-center gap-1">
                         <Coins size={12} /> 卖出 {item.value}
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-800/30 rounded-b-2xl flex justify-between items-center text-sm text-slate-400">
               <span>容量: {inventory.length}</span>
               <span className="flex items-center gap-1 text-amber-500 font-bold"><Coins size={14}/> {stats.gold}</span>
            </div>
          </div>
        </div>
      )}

      {/* Combat Overlay */}
      {enemy && combatState !== 'idle' && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-8">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex-1 flex gap-8 p-8 overflow-hidden">
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-64 bg-slate-800 rounded-2xl overflow-hidden border-2 border-red-500/30">
                  <img src={enemy.image} alt="Enemy" className="w-full h-full object-cover animate-pulse" />
                </div>
                <h3 className="mt-4 text-2xl font-bold text-red-500">{enemy.name} (Lv.{enemy.level})</h3>
                <div className="w-full bg-slate-800 h-4 mt-4 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-300" style={{width: `${(enemy.currentHealth / enemy.maxHealth) * 100}%`}} />
                </div>
              </div>
              <div className="w-1/3 bg-black/40 rounded-2xl p-4 flex flex-col">
                <h4 className="text-amber-500 font-bold mb-2">战斗志</h4>
                <div ref={combatLogRef} className="flex-1 overflow-auto space-y-1 text-xs text-slate-300">
                  {combatLog.map((log, i) => <div key={i}>{log}</div>)}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-800/50 flex justify-center gap-4">
              {combatState === 'fighting' || combatState === 'encounter' ? (
                <>
                  <button onClick={() => handleCombatAction('attack')} className="px-12 py-4 bg-red-600 rounded-xl font-bold text-xl hover:bg-red-500">攻击</button>
                  <button onClick={() => handleCombatAction('flee')} className="px-12 py-4 bg-slate-700 rounded-xl font-bold text-xl">逃跑</button>
                </>
              ) : (
                <button onClick={() => {setEnemy(null); setCombatState('idle');}} className="px-12 py-4 bg-amber-600 rounded-xl font-bold text-xl">返回</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      <style>{`
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes float { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-50px); opacity: 0; } }
      `}</style>
      {stepIndex < STEPS.length - 1 && <ProgressBar currentStep={stepIndex} totalSteps={STEPS.length - 1} />}
      {stepIndex === 0 && renderStanceStep()}
      {stepIndex === 1 && renderInputStep('head', '头部特征', '你的守护兽长着什么样的脑袋？', <Skull size={48} />, '例如：巨龙, 狮子...')}
      {stepIndex === 2 && renderInputStep('frontLimbs', '前肢特征', '它的前肢看起来像什么？', <Hand size={48} />, '例如：猛虎利爪...')}
      {stepIndex === 3 && renderInputStep('body', '躯干特征', '描述一下它的身体躯干。', <Box size={48} />, '例如：覆盖鳞片...')}
      {stepIndex === 4 && renderInputStep('hindLimbs', '后肢特征', '它的后肢是什么样的？', <Footprints size={48} />, '例如：强壮的马蹄...')}
      {stepIndex === 5 && renderWingsStep()}
      {stepIndex === 6 && renderInputStep('tail', '尾部特征', '它的尾巴有什么特别之处？', <Cat size={48} />, '例如：燃烧的火焰...')}
      {stepIndex === 7 && renderElementsStep()}
      {stepIndex === 8 && renderPurposeStep()}
      {stepIndex === 9 && renderGameDashboard()}
    </div>
  );
}