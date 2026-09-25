import {
  FolderMapSchema,
  WordProgressSchema,
  type FolderMap,
  type FolderProgressList,
  type Stage,
  type WordProgress,
} from "@yuny/shared";
import { mockUserDictionaryRepository } from "./userDictionary.repository.mock";

/**
 * Карта папки и прогресс слова для mock-режима (#70): стадии раздаются по
 * самому слову, детерминированно, — на карте видны все цвета, «пора освежить»
 * и метка пары, а при перезагрузке ничего не прыгает.
 */
const STAGES: Stage[] = ["new", "meeting", "recognize", "recall", "use", "stable"];

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

/** Стадия, «пора освежить» и пара слова в моке — детерминированно по заголовку. */
export function wordFacts(headword: string) {
  const h = hash(headword);
  return { stage: STAGES[h % STAGES.length]!, due: h % 4 === 0, pair: h % 7 === 0 ? "卖" : null };
}

const MOCK_PER_DAY = 8;

const emptyCounts = (): Record<Stage, number> => ({ new: 0, meeting: 0, recognize: 0, recall: 0, use: 0, stable: 0 });

export async function mockFolderMap(folderId: string): Promise<FolderMap> {
  // По `position`, как отдаёт сервер (folder-map.design.md §1).
  const items = (await mockUserDictionaryRepository.listItems())
    .filter((i) => i.folder_id === folderId)
    .sort((a, b) => a.position - b.position);
  const counts = emptyCounts();
  const seen = new Set<string>();
  const words = [];
  for (const i of items) {
    const key = `${i.headword}|${i.reading ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const f = wordFacts(i.headword);
    counts[f.stage]++;
    words.push({
      headword: i.headword,
      reading: i.reading,
      stage: f.stage,
      due: f.due,
      pair_partner: f.pair,
      position: i.position,
    });
  }
  // Изучено и впереди (#85): срок — по 8 новых в день, как при настройках по умолчанию.
  return FolderMapSchema.parse({
    word_count: words.length,
    due_count: words.filter((w) => w.due).length,
    stage_counts: counts,
    learned: words.length - counts.new,
    queued: counts.new,
    eta_days: Math.ceil(counts.new / MOCK_PER_DAY),
    per_day: MOCK_PER_DAY,
    words,
  });
}

export async function mockFolderProgress(): Promise<FolderProgressList> {
  const folders = await mockUserDictionaryRepository.listFolders();
  const list = await Promise.all(
    folders.map(async (f) => {
      const map = await mockFolderMap(f.id);
      const { words: _words, ...summary } = map;
      return { folder_id: f.id, ...summary };
    }),
  );
  // Сводка: слово в двух папках — одно, стадия — по самому слову.
  const all = new Map<string, Stage>();
  for (const i of await mockUserDictionaryRepository.listItems()) all.set(`${i.headword}|${i.reading ?? ""}`, wordFacts(i.headword).stage);
  const queued = [...all.values()].filter((s) => s === "new").length;
  return {
    folders: list,
    total: { words: all.size, learned: all.size - queued, queued, eta_days: Math.ceil(queued / MOCK_PER_DAY) },
    per_day: MOCK_PER_DAY,
  };
}

export function mockWordProgress(word: { headword: string }): WordProgress {
  const f = wordFacts(word.headword);
  if (f.stage === "new") {
    return WordProgressSchema.parse({ found: true, stage: "new", skills: { read: "not_started", pinyin: "not_started", write: "not_started", use: "not_started" }, next_review_days: null, confusions: [] });
  }
  const h = hash(word.headword);
  return WordProgressSchema.parse({
    found: true,
    stage: f.stage,
    skills: {
      read: f.stage === "stable" ? "stable" : "holding",
      pinyin: h % 2 ? "holding" : "fresh",
      write: h % 3 ? "fresh" : "not_started",
      use: f.stage === "use" || f.stage === "stable" ? "holding" : "not_started",
    },
    next_review_days: f.due ? 0 : 1 + (h % 30),
    confusions: f.pair
      ? [{ partner: "卖", partner_reading: "mài", status: "resolved", resolved_on: "2026-09-20" }]
      : [],
  });
}
