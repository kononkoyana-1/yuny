import { useQuery } from "@tanstack/react-query";
import { dictionaryRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Перевод фразы из поиска (#76). Запрос — только когда поиск решил, что это
 * фраза (`isPhraseQuery`); перевод не меняется — повторно в сеть не ходим.
 */
export function usePhraseTranslation(text: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.phraseTranslation(text),
    queryFn: () => dictionaryRepository.translatePhrase(text),
    enabled: enabled && text.length > 0,
    staleTime: Infinity,
    retry: false,
  });
}
