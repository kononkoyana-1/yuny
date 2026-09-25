import { SessionPreviewSchema, type SessionPreview } from "@yuny/shared";

type Plan = SessionPreview["plans"][number];

const SHOPPING = "00000000-0000-4000-8000-000000000001";
const TRAVEL = "00000000-0000-4000-8000-000000000002";

const plan = (over: Partial<Plan> & Pick<Plan, "minutes">): Plan => ({
  due: 0,
  new: 0,
  total: 0,
  est_minutes: 0,
  new_sources: [],
  pairs: [],
  due_tomorrow: 0,
  ...over,
});

const READY_PLANS: Plan[] = [
  plan({ minutes: 5, due: 14, new: 2, total: 20, est_minutes: 5, due_tomorrow: 24,
    new_sources: [{ folder_id: SHOPPING, folder_name: "Покупки", count: 2 }] }),
  plan({ minutes: 10, due: 26, new: 5, total: 34, est_minutes: 8, due_tomorrow: 30,
    new_sources: [{ folder_id: SHOPPING, folder_name: "Покупки", count: 5 }], pairs: [{ a: "买", b: "卖" }] }),
  plan({ minutes: 15, due: 26, new: 8, total: 50, est_minutes: 13, due_tomorrow: 36,
    new_sources: [
      { folder_id: SHOPPING, folder_name: "Покупки", count: 5 },
      { folder_id: TRAVEL, folder_name: "Путешествия", count: 3 },
    ],
    pairs: [{ a: "买", b: "卖" }, { a: "已经", b: "已" }] }),
];

const EMPTY_PLANS: Plan[] = [5, 10, 15].map((minutes) =>
  plan({ minutes: minutes as Plan["minutes"], due_tomorrow: 30 }),
);

/** Одна фикстура на каждое состояние карточки (today-session.design.md §5). */
export const TODAY_FIXTURES = {
  ready: {
    plans: READY_PLANS,
    due_now: 26,
    reason: null,
    budget_minutes: 10,
    state: "ready",
    recall_now: { recalled: 212, total: 347 },
  },
  debt: {
    plans: READY_PLANS.map((p) => ({ ...p, new: 0, new_sources: [], due: p.total, pairs: [] })),
    due_now: 74,
    reason: "debt",
    budget_minutes: 10,
    state: "ready",
    recall_now: { recalled: 180, total: 347 },
  },
  done: {
    plans: EMPTY_PLANS,
    due_now: 0,
    reason: null,
    budget_minutes: 10,
    state: "done",
    recall_now: { recalled: 301, total: 347 },
  },
  nothing_due: {
    plans: EMPTY_PLANS,
    due_now: 0,
    reason: null,
    budget_minutes: 10,
    state: "nothing_due",
    recall_now: { recalled: 330, total: 347 },
  },
  no_words: {
    plans: EMPTY_PLANS.map((p) => ({ ...p, due_tomorrow: 0 })),
    due_now: 0,
    reason: null,
    budget_minutes: 10,
    state: "no_words",
    recall_now: { recalled: 0, total: 0 },
  },
} satisfies Record<string, SessionPreview>;

export type TodayFixture = keyof typeof TODAY_FIXTURES;

/** Фикстуры проходят ту же схему, что ответ сервера. */
export function todayFixture(name: TodayFixture): SessionPreview {
  return SessionPreviewSchema.parse(TODAY_FIXTURES[name]);
}
