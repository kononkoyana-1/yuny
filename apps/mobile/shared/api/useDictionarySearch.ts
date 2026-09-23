import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { dictionaryRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Столько же по умолчанию отдаёт `dictionary-search`; явно — чтобы считать `offset` следующей страницы. */
const PAGE_SIZE = 20;

/**
 * Поиск по словарю БКРС (TZ.md §11 экран 04) страницами. Пустой запрос не
 * уходит на сервер вовсе. Пока пользователь дописывает слово, на экране
 * остаётся выдача прошлого запроса (`keepPreviousData`), а не мигает загрузка.
 *
 * `query` сюда приходит уже с задержкой — её держит экран, а не хук.
 */
export function useDictionarySearch(query: string) {
  const trimmed = query.trim();
  return useInfiniteQuery({
    queryKey: queryKeys.dictionarySearch(trimmed),
    queryFn: ({ pageParam }) =>
      dictionaryRepository.search({ query: trimmed, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more ? last.offset + last.items.length : undefined),
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
    // Статья словаря не меняется, пока не перезальют БКРС: повторный запрос
    // того же слова за сессию сети не стоит.
    staleTime: Infinity,
  });
}
