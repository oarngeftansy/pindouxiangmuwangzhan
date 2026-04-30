import { getLocalBlindBoxPool, type BlindBoxPattern } from "../data/blindboxPools";

export function toDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

const HISTORY_KEY = "blindbox_history_v2";
const DAILY_PICK_KEY = "blindbox_daily_pick_v2";

interface DailyPick {
  date: string;
  patternIds: string[];
}

interface BlindBoxHistory {
  // 最近 3 天抽到的 pattern id
  entries: { date: string; ids: string[] }[];
}

function getHistory(): BlindBoxHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

function saveHistory(history: BlindBoxHistory) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getDailyPick(): DailyPick | null {
  try {
    const raw = localStorage.getItem(DAILY_PICK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDailyPick(pick: DailyPick) {
  localStorage.setItem(DAILY_PICK_KEY, JSON.stringify(pick));
}

// 从池子中随机抽 count 个，尽量避开最近 3 天抽过的
function pickWithoutRepeat(
  pool: BlindBoxPattern[],
  count: number,
  recentIds: Set<string>,
): BlindBoxPattern[] {
  // 优先从没抽过的里选
  const fresh = pool.filter(p => !recentIds.has(p.id));
  const source = fresh.length >= count ? fresh : pool;

  // 随机打乱
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface TodayBlindBox {
  date: string;
  patterns: BlindBoxPattern[];
  canSwitch: boolean;
}

export function getTodayBlindBox(): TodayBlindBox {
  const today = toDateKey();
  const pool = getLocalBlindBoxPool(today);

  // 如果今天已经抽过了，直接返回
  const existing = getDailyPick();
  if (existing && existing.date === today) {
    const patterns = existing.patternIds
      .map(id => pool.find(p => p.id === id))
      .filter(Boolean) as BlindBoxPattern[];

    // 如果找到的数量够，直接用
    if (patterns.length >= 2) {
      return { date: today, patterns, canSwitch: false };
    }
  }

  // 收集最近 3 天的历史
  const history = getHistory();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = toDateKey(threeDaysAgo);

  // 清理过期历史
  history.entries = history.entries.filter(e => e.date >= cutoff && e.date !== today);

  const recentIds = new Set<string>();
  for (const entry of history.entries) {
    for (const id of entry.ids) {
      recentIds.add(id);
    }
  }

  // 抽 2 个
  const picked = pickWithoutRepeat(pool, 2, recentIds);

  // 保存今日选择
  const pickedIds = picked.map(p => p.id);
  saveDailyPick({ date: today, patternIds: pickedIds });

  // 更新历史
  history.entries.push({ date: today, ids: pickedIds });
  saveHistory(history);

  return { date: today, patterns: picked, canSwitch: false };
}
