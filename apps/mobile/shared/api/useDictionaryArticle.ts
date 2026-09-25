import { useQuery } from "@tanstack/react-query";
import { dictionaryRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Статья в листе словаря (словарь 2.0, #79 #80 #84): уровень HSK, состав
 * слова, слова со знаком — отдельным запросом при открытии статьи. Статья
 * меняется только с перезаливкой словаря, а слова пользователя в ней
 * сбрасываются вместе со сводками (`queryKeys.dictionaryArticle`).
 */
export function useDictionaryArticle(headword: string, reading: string | null) {
  return useQuery({
    queryKey: queryKeys.dictionaryArticle(headword, reading),
    queryFn: () => dictionaryRepository.article({ headword, reading }),
    staleTime: 5 * 60_000,
  });
}
