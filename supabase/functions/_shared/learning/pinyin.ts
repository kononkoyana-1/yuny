/**
 * Пиньинь для сравнения ответа: `mǎi`, `mai3`, `MAI 3` и `mai3 ` — одно и то
 * же; `v` — это `ü`; слог без тона — лёгкий тон (5). Многосложное слово
 * режется на слоги и без пробелов: `dòufu` = `dou4fu` = `dou4 fu5`.
 */

export interface Syllable {
  base: string; // без тона: "mai", "lü"
  tone: 1 | 2 | 3 | 4 | 5;
}

const MARKS: Record<string, [string, 1 | 2 | 3 | 4]> = {};
for (const [base, marked] of Object.entries({
  a: "āáǎà",
  e: "ēéěè",
  i: "īíǐì",
  o: "ōóǒò",
  u: "ūúǔù",
  ü: "ǖǘǚǜ",
})) {
  [...marked].forEach((ch, i) => (MARKS[ch] = [base, (i + 1) as 1 | 2 | 3 | 4]));
}

const INITIALS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s", "y", "w"];

/** Финали от длинных к коротким: сначала пробуется самая длинная. */
const FINALS = [
  "iang", "iong", "uang", "ueng",
  "ang", "eng", "ing", "ong", "ian", "iao", "uai", "uan", "üan", "üe", "ün",
  "ai", "ei", "ao", "ou", "an", "en", "er", "in", "un", "ia", "ie", "iu", "ua", "uo", "ui", "ue",
  "a", "o", "e", "i", "u", "ü",
  "ng", "n", "m", // 嗯 ng, 呣 m
];

const VOWEL = /[aeiouü]/;

/** Режет буквы без пробелов на слоги; `null`, если это не пиньинь. */
function splitSyllables(letters: string): string[] | null {
  const out: string[] = [];
  let i = 0;
  outer: while (i < letters.length) {
    const initial = INITIALS.find((ini) => letters.startsWith(ini, i)) ?? "";
    const start = i + initial.length;
    for (const fin of FINALS) {
      if (!letters.startsWith(fin, start)) continue;
      // ng, n, m — слоги сами по себе (嗯, 呣), не финали после инициали.
      if (initial !== "" && /^(ng|n|m)$/.test(fin)) continue;
      const end = start + fin.length;
      // «xinan» — это xi + nan: конечная n/g/r уходит в следующий слог, если
      // за ней гласная.
      if (fin.length > 1 && /[ngr]$/.test(fin) && end < letters.length && VOWEL.test(letters[end])) {
        continue;
      }
      // После j, q, x, y пишут u вместо ü: jǚ = ju3.
      out.push(initial + (/^[jqxy]$/.test(initial) ? fin.replace("ü", "u") : fin));
      i = end;
      continue outer;
    }
    return null;
  }
  return out.length ? out : null;
}

/**
 * Разбор пиньиня в слоги с тонами. Тон — знаком над гласной или цифрой после
 * слога (0 и 5 — лёгкий тон). `null` — не пиньинь.
 */
export function parsePinyin(input: string): Syllable[] | null {
  const text = input.normalize("NFC").toLowerCase().replace(/v/g, "ü").replace(/u:/g, "ü").trim();
  if (!text) return null;
  const result: Syllable[] = [];
  // Куски между пробелами, апострофами и дефисами; цифра закрывает слог.
  for (const chunk of text.split(/[\s'’\-·]+/).filter(Boolean)) {
    for (const run of chunk.match(/[^\d]+\d?|\d/g) ?? []) {
      const digit = /\d$/.test(run) ? Number(run.slice(-1)) : null;
      const raw = digit === null ? run : run.slice(0, -1);
      if (!raw) {
        // «mai 3»: цифра через пробел — тон предыдущего слога.
        if (digit === null || !result.length) return null;
        result[result.length - 1].tone = (digit === 0 || digit > 5 ? 5 : digit) as Syllable["tone"];
        continue;
      }
      let letters = "";
      const toneAt: (1 | 2 | 3 | 4 | null)[] = [];
      for (const ch of raw) {
        const mark = MARKS[ch];
        if (mark) {
          letters += mark[0];
          toneAt.push(mark[1]);
        } else if (/[a-zü]/.test(ch)) {
          letters += ch;
          toneAt.push(null);
        } else {
          return null;
        }
      }
      const syllables = splitSyllables(letters);
      if (!syllables) return null;
      let pos = 0;
      syllables.forEach((base, idx) => {
        const marks = toneAt.slice(pos, pos + base.length).filter((t) => t !== null);
        pos += base.length;
        let tone: Syllable["tone"] = (marks[0] ?? 5) as Syllable["tone"];
        if (idx === syllables.length - 1 && digit !== null) {
          tone = (digit === 0 ? 5 : digit) as Syllable["tone"];
          if (tone > 5) tone = 5;
        }
        result.push({ base, tone });
      });
    }
  }
  return result.length ? result : null;
}

/** Каноническая запись: `mai3`, `dou4 fu5`. */
export function normalizePinyin(input: string): string | null {
  const s = parsePinyin(input);
  return s ? s.map((x) => `${x.base}${x.tone}`).join(" ") : null;
}

/** Те же слоги без учёта тонов. */
export function sameSyllables(a: string, b: string): boolean {
  const x = parsePinyin(a);
  const y = parsePinyin(b);
  return !!x && !!y && x.length === y.length && x.every((s, i) => s.base === y[i].base);
}
