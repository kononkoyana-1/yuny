/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals } from "jsr:@std/assert@1";

import { batchWords } from "./lessons.ts";

const words = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const sizes = (n: number) => batchWords(words(n)).map((b) => b.length);

Deno.test("45 слов — три урока (TZ.md §8, проверка фазы 3)", () => {
  assertEquals(sizes(45), [15, 15, 15]);
});

Deno.test("до двадцати слов — один урок", () => {
  assertEquals(sizes(1), [1]);
  assertEquals(sizes(20), [20]);
});

Deno.test("21 слово — поровну, а не 20 + 1", () => {
  assertEquals(sizes(21), [11, 10]);
  assertEquals(sizes(41), [14, 14, 13]);
});

Deno.test("ни одна пачка не больше двадцати, ни одно слово не потеряно", () => {
  for (let n = 1; n <= 200; n += 1) {
    const batches = batchWords(words(n));
    assertEquals(batches.length, Math.ceil(n / 20));
    assertEquals(batches.every((b) => b.length <= 20 && b.length > 0), true);
    assertEquals(batches.flat(), words(n));
  }
});

Deno.test("нет слов — нет уроков", () => {
  assertEquals(batchWords([]), []);
});
